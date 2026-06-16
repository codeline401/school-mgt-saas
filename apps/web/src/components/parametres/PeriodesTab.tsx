import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type TypePeriode = "TRIMESTRE" | "SEMESTRE" | "ANNEE" | "AUTRE";

interface Periode {
  id: string;
  nom: string;
  type: TypePeriode;
  anneeScolaire: string;
  dateDebut: string | null;
  dateFin: string | null;
  schoolId: string;
  createdAt: string;
}

interface CreatePeriodePayload {
  nom: string;
  type: TypePeriode;
  anneeScolaire: string;
  dateDebut?: string;
  dateFin?: string;
}

const TYPE_OPTIONS: Array<{ value: TypePeriode; label: string }> = [
  { value: "TRIMESTRE", label: "Trimestre" },
  { value: "SEMESTRE", label: "Semestre" },
  { value: "ANNEE", label: "Année entière" },
  { value: "AUTRE", label: "Autre" },
];

function currentSchoolYear(): string {
  const d = new Date();
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PeriodesTab() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const canEdit = user?.role === "SUDO_ADMIN" || user?.role === "ADMIN";

  // ── Formulaire ──────────────────────────────────────────────────────────────
  const [nom, setNom] = useState("");
  const [type, setType] = useState<TypePeriode>("TRIMESTRE");
  const [anneeScolaire, setAnneeScolaire] = useState(currentSchoolYear());
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Query : liste des périodes ───────────────────────────────────────────────
  const {
    data: periodes = [],
    isLoading,
    isError,
    error,
  } = useQuery<Periode[]>({
    queryKey: ["periodes"],
    queryFn: async () => {
      const { data } = await api.get("/api/periodes");
      return data;
    },
    enabled: canEdit,
  });

  // ── Mutation : créer une période ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: CreatePeriodePayload) => {
      const { data } = await api.post("/api/periodes", payload);
      return data as Periode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodes"] });
      // Vide uniquement le nom pour permettre d'enchaîner les créations
      setNom("");
      toast.success("Période créée avec succès.");
    },
    onError: (err) => {
      toast.error(
        getApiError(err, "Erreur lors de la création de la période."),
      );
    },
  });

  // ── Mutation : supprimer une période ─────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/periodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodes"] });
      setDeleteConfirmId(null);
      toast.success("Période supprimée.");
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la suppression."));
      setDeleteConfirmId(null);
    },
  });

  // ── Soumission du formulaire ──────────────────────────────────────────────────
  function handleSubmit() {
    if (!nom.trim() || !anneeScolaire.trim()) return;
    createMutation.mutate({
      nom: nom.trim(),
      type,
      anneeScolaire: anneeScolaire.trim(),
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
    });
  }

  // ── Groupement par année scolaire ─────────────────────────────────────────────
  const grouped = periodes.reduce<Record<string, Periode[]>>((acc, p) => {
    if (!acc[p.anneeScolaire]) acc[p.anneeScolaire] = [];
    acc[p.anneeScolaire].push(p);
    return acc;
  }, {});
  const annees = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (!canEdit) {
    return (
      <div className="text-center py-16 text-base-content/40 text-sm">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-primary" />
        <h2 className="font-semibold text-base">Périodes scolaires</h2>
      </div>

      <p className="text-sm text-base-content/60">
        Les périodes permettent de regrouper les notes pour générer bulletins,
        relevés et classements. Créez une période par trimestre ou semestre pour
        chaque année scolaire.
      </p>

      {/* ── Formulaire de création ─────────────────────────────────────────── */}
      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <h3 className="card-title text-sm">Nouvelle période</h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom *</legend>
              <input
                className="input input-sm w-full"
                placeholder="ex : Trimestre 1"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Type *</legend>
              <select
                className="select select-sm w-full"
                value={type}
                onChange={(e) => setType(e.target.value as TypePeriode)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Année scolaire *</legend>
              <input
                className="input input-sm w-full"
                placeholder="ex : 2026-2027"
                value={anneeScolaire}
                onChange={(e) => setAnneeScolaire(e.target.value)}
              />
            </fieldset>

            <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Date de début (optionnel)
                </legend>
                <input
                  type="date"
                  className="input input-sm w-full"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Date de fin (optionnel)
                </legend>
                <input
                  type="date"
                  className="input input-sm w-full"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </fieldset>
            </div>
          </div>

          <div className="card-actions">
            <button
              className="btn btn-primary btn-sm"
              disabled={
                !nom.trim() || !anneeScolaire.trim() || createMutation.isPending
              }
              onClick={handleSubmit}
            >
              {createMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Créer la période
            </button>
          </div>
        </div>
      </div>

      {/* ── Liste des périodes ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-sm" />
        </div>
      )}

      {isError && (
        <div className="alert alert-error text-sm">
          <AlertCircle size={15} />
          {getApiError(error, "Erreur de chargement des périodes.")}
        </div>
      )}

      {!isLoading && periodes.length === 0 && (
        <div className="text-center py-10 text-base-content/40 text-sm border border-dashed border-base-300 rounded-box">
          Aucune période créée. Ajoutez votre première période ci-dessus.
        </div>
      )}

      {annees.map((annee) => (
        <div key={annee} className="space-y-2">
          <h3 className="text-sm font-semibold text-base-content/60 flex items-center gap-2">
            <span className="badge badge-neutral badge-sm">{annee}</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {grouped[annee]
                  .sort((a, b) => a.nom.localeCompare(b.nom))
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.nom}</td>
                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {TYPE_OPTIONS.find((o) => o.value === p.type)
                            ?.label ?? p.type}
                        </span>
                      </td>
                      <td className="text-base-content/60 text-xs">
                        {p.dateDebut
                          ? new Date(p.dateDebut).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="text-base-content/60 text-xs">
                        {p.dateFin
                          ? new Date(p.dateFin).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="text-right">
                        {deleteConfirmId === p.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-error">
                              Confirmer ?
                            </span>
                            <button
                              className="btn btn-error btn-xs"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(p.id)}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                "Oui"
                              )}
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => setDeleteConfirmId(p.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
