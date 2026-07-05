import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  Loader2,
  ListTree,
} from "lucide-react";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { Classe } from "@school-mgt/types";

// ─── Types locaux ─────────────────────────────────────────────────────────────

type StatutChapitre = "A_FAIRE" | "EN_COURS" | "FAIT";

interface Matiere {
  id: string;
  nom: string;
}

interface SousChapitre {
  id: string;
  titre: string;
  ordre: number;
  statut: StatutChapitre;
}

interface Chapitre {
  id: string;
  titre: string;
  ordre: number;
  statut: StatutChapitre;
  matiereId: string;
  sousChapitres: SousChapitre[];
}

const STATUT_CONFIG: Record<
  StatutChapitre,
  { label: string; badgeClass: string }
> = {
  A_FAIRE: { label: "À faire", badgeClass: "badge-ghost" },
  EN_COURS: { label: "En cours", badgeClass: "badge-warning" },
  FAIT: { label: "Fait", badgeClass: "badge-success" },
};

const STATUT_CYCLE: Record<StatutChapitre, StatutChapitre> = {
  A_FAIRE: "EN_COURS",
  EN_COURS: "FAIT",
  FAIT: "A_FAIRE",
};

function getProgress(chapitre: Chapitre): number {
  if (chapitre.sousChapitres.length === 0) {
    return chapitre.statut === "FAIT"
      ? 100
      : chapitre.statut === "EN_COURS"
        ? 50
        : 0;
  }
  const fait = chapitre.sousChapitres.filter(
    (sc) => sc.statut === "FAIT",
  ).length;
  return Math.round((fait / chapitre.sousChapitres.length) * 100);
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SuiviChapitresTab() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const canEdit = !!user && ["PROF", "ADMIN", "SUDO_ADMIN"].includes(user.role);

  const [classeId, setClasseId] = useState("");
  const [matiereId, setMatiereId] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // État du formulaire d'ajout / édition
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titre, setTitre] = useState("");
  const [sousChapitresDraft, setSousChapitresDraft] = useState<string[]>([""]);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });

  const { data: matieres = [] } = useQuery<Matiere[]>({
    queryKey: ["classe-matieres", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/matieres`);
      return data;
    },
    enabled: !!classeId,
  });

  const {
    data: chapitres = [],
    isLoading,
    isError,
    error,
  } = useQuery<Chapitre[]>({
    queryKey: ["chapitres", classeId, matiereId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/suivi-chapitre`,
        { params: { matiereId } },
      );
      return data;
    },
    enabled: !!classeId && !!matiereId,
  });

  function invalidateChapitres() {
    queryClient.invalidateQueries({
      queryKey: ["chapitres", classeId, matiereId],
    });
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (payload: {
      titre: string;
      sousChapitres: { titre: string }[];
    }) => {
      const { data } = await api.post(
        `/api/classes/${classeId}/suivi-chapitre`,
        {
          titre: payload.titre,
          matiereId,
          sousChapitres: payload.sousChapitres,
        },
      );
      return data;
    },
    onSuccess: () => {
      invalidateChapitres();
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      titre: string;
      sousChapitres: { titre: string }[];
    }) => {
      const { data } = await api.put(
        `/api/classes/${classeId}/suivi-chapitre/${payload.id}`,
        {
          titre: payload.titre,
          matiereId,
          sousChapitres: payload.sousChapitres,
        },
      );
      return data;
    },
    onSuccess: () => {
      invalidateChapitres();
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/classes/${classeId}/suivi-chapitre/${id}`);
    },
    onSuccess: invalidateChapitres,
  });

  const statutChapitreMutation = useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: StatutChapitre;
    }) => {
      await api.patch(`/api/classes/${classeId}/suivi-chapitre/${id}/statut`, {
        statut,
      });
    },
    onSuccess: invalidateChapitres,
  });

  const statutSousChapitreMutation = useMutation({
    mutationFn: async ({
      chapitreId,
      sousChapitreId,
      statut,
    }: {
      chapitreId: string;
      sousChapitreId: string;
      statut: StatutChapitre;
    }) => {
      await api.patch(
        `/api/classes/${classeId}/suivi-chapitre/${chapitreId}/sous-chapitre/${sousChapitreId}/statut`,
        { statut },
      );
    },
    onSuccess: invalidateChapitres,
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleClasseChange(id: string) {
    setClasseId(id);
    setMatiereId("");
    resetForm();
  }

  function handleMatiereChange(id: string) {
    setMatiereId(id);
    resetForm();
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setTitre("");
    setSousChapitresDraft([""]);
  }

  function startEdit(chapitre: Chapitre) {
    setEditingId(chapitre.id);
    setTitre(chapitre.titre);
    setSousChapitresDraft(
      chapitre.sousChapitres.length > 0
        ? chapitre.sousChapitres.map((sc) => sc.titre)
        : [""],
    );
    setShowForm(true);
  }

  function updateDraftRow(index: number, value: string) {
    setSousChapitresDraft((prev) =>
      prev.map((v, i) => (i === index ? value : v)),
    );
  }

  function addDraftRow() {
    setSousChapitresDraft((prev) => [...prev, ""]);
  }

  function removeDraftRow(index: number) {
    setSousChapitresDraft((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const payload = {
      titre: titre.trim(),
      sousChapitres: sousChapitresDraft
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => ({ titre: t })),
    };
    if (!payload.titre) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function cycleStatutChapitre(chapitre: Chapitre) {
    statutChapitreMutation.mutate({
      id: chapitre.id,
      statut: STATUT_CYCLE[chapitre.statut],
    });
  }

  function cycleStatutSousChapitre(chapitreId: string, sc: SousChapitre) {
    statutSousChapitreMutation.mutate({
      chapitreId,
      sousChapitreId: sc.id,
      statut: STATUT_CYCLE[sc.statut],
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ListTree size={18} className="text-primary" />
        <h2 className="font-semibold text-base">Suivi de chapitre</h2>
      </div>

      {/* ── Sélection classe / matière ─────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Classe *</legend>
          <select
            className="select select-sm w-full"
            value={classeId}
            onChange={(e) => handleClasseChange(e.target.value)}
          >
            <option value="">— Choisir une classe —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Matière *</legend>
          <select
            className="select select-sm w-full"
            value={matiereId}
            onChange={(e) => handleMatiereChange(e.target.value)}
            disabled={!classeId}
          >
            <option value="">— Choisir une matière —</option>
            {matieres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </fieldset>
      </div>

      {!classeId || !matiereId ? (
        <div className="text-center py-16 text-base-content/40 text-sm">
          Choisissez une classe et une matière pour afficher la progression des
          chapitres.
        </div>
      ) : (
        <>
          {/* ── Erreur de chargement ─────────────────────────────────────── */}
          {isError && (
            <div className="alert alert-error text-sm">
              <AlertCircle size={15} />
              {getApiError(error, "Erreur lors du chargement des chapitres.")}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-base-content/50">
              <Loader2 size={15} className="animate-spin" />
              Chargement…
            </div>
          )}

          {/* ── Liste des chapitres ──────────────────────────────────────── */}
          {!isLoading && chapitres.length === 0 && !showForm && (
            <div className="text-center py-10 text-base-content/40 text-sm">
              Aucun chapitre pour cette matière.
            </div>
          )}

          <div className="space-y-2">
            {chapitres.map((chapitre, index) => {
              const isExpanded = expandedIds.has(chapitre.id);
              const progress = getProgress(chapitre);
              return (
                <div key={chapitre.id} className="card card-border">
                  <div className="card-body p-3 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => toggleExpanded(chapitre.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </button>

                      <BookOpen size={14} className="text-base-content/40" />

                      <span className="text-xs text-base-content/40 w-5">
                        {index + 1}.
                      </span>

                      <span className="font-medium text-sm flex-1">
                        {chapitre.titre}
                      </span>

                      <button
                        type="button"
                        disabled={!canEdit || statutChapitreMutation.isPending}
                        onClick={() => cycleStatutChapitre(chapitre)}
                        className={`badge ${STATUT_CONFIG[chapitre.statut].badgeClass} ${
                          canEdit ? "cursor-pointer" : ""
                        }`}
                        title={
                          canEdit ? "Cliquer pour changer le statut" : undefined
                        }
                      >
                        {STATUT_CONFIG[chapitre.statut].label}
                      </button>

                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-square"
                            onClick={() => startEdit(chapitre)}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-square text-error"
                            onClick={() => deleteMutation.mutate(chapitre.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>

                    {chapitre.sousChapitres.length > 0 && (
                      <progress
                        className="progress progress-primary w-full h-1.5"
                        value={progress}
                        max={100}
                      />
                    )}

                    {isExpanded && chapitre.sousChapitres.length > 0 && (
                      <ul className="pl-9 space-y-1 pt-1">
                        {chapitre.sousChapitres.map((sc) => (
                          <li
                            key={sc.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="flex-1 text-base-content/70">
                              {sc.titre}
                            </span>
                            <button
                              type="button"
                              disabled={
                                !canEdit || statutSousChapitreMutation.isPending
                              }
                              onClick={() =>
                                cycleStatutSousChapitre(chapitre.id, sc)
                              }
                              className={`badge badge-sm ${STATUT_CONFIG[sc.statut].badgeClass} ${
                                canEdit ? "cursor-pointer" : ""
                              }`}
                            >
                              {STATUT_CONFIG[sc.statut].label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Formulaire ajout / édition ───────────────────────────────── */}
          {canEdit && (
            <>
              {!showForm ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={14} />
                  Ajouter un chapitre
                </button>
              ) : (
                <div className="card card-border">
                  <div className="card-body p-4 gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">
                        {editingId
                          ? "Modifier le chapitre"
                          : "Nouveau chapitre"}
                      </h3>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={resetForm}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">
                        Titre du chapitre *
                      </legend>
                      <input
                        className="input input-sm w-full"
                        placeholder="Ex : Les fractions"
                        value={titre}
                        onChange={(e) => setTitre(e.target.value)}
                      />
                    </fieldset>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">
                        Sous-chapitres (optionnel)
                      </legend>
                      <div className="space-y-1.5">
                        {sousChapitresDraft.map((value, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5"
                          >
                            <input
                              className="input input-sm w-full"
                              placeholder={`Sous-chapitre ${index + 1}`}
                              value={value}
                              onChange={(e) =>
                                updateDraftRow(index, e.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs btn-square"
                              onClick={() => removeDraftRow(index)}
                              disabled={sousChapitresDraft.length === 1}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs mt-1.5 self-start"
                        onClick={addDraftRow}
                      >
                        <Plus size={12} />
                        Ajouter un sous-chapitre
                      </button>
                    </fieldset>

                    {editingId && (
                      <p className="text-xs text-base-content/40">
                        Modifier les sous-chapitres réinitialise leur statut de
                        progression.
                      </p>
                    )}

                    {(createMutation.isError || updateMutation.isError) && (
                      <div className="alert alert-error text-sm">
                        <AlertCircle size={15} />
                        {getApiError(
                          createMutation.error || updateMutation.error,
                          "Erreur lors de l'enregistrement du chapitre.",
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={!titre.trim() || isSaving}
                        onClick={handleSubmit}
                      >
                        {isSaving && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        {editingId ? "Enregistrer" : "Créer le chapitre"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={resetForm}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
