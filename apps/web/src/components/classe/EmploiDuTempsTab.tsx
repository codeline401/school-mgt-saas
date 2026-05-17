import type { CreneauHoraire, JourSemaine, Matiere } from "@school-mgt/types";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../../lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "../ConfirmModal";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";

const JOURS: { key: JourSemaine; label: string }[] = [
  { key: "LUNDI", label: "Lundi" },
  { key: "MARDI", label: "Mardi" },
  { key: "MERCREDI", label: "Mercredi" },
  { key: "JEUDI", label: "Jeudi" },
  { key: "VENDREDI", label: "Vendredi" },
  { key: "SAMEDI", label: "Samedi" },
];

const PRESET_COLORS = [
  "#3B82F6", // bleu
  "#10B981", // vert
  "#F59E0B", // ambre
  "#EF4444", // rouge
  "#8B5CF6", // violet
  "#EC4899", // rose
  "#06B6D4", // cyan
  "#F97316", // orange
];

interface Props {
  classeId: string;
  canManage: boolean;
}

interface CreneauForm {
  jour: JourSemaine;
  heureDebut: string;
  heureFin: string;
  matiereId: string;
  intitule: string;
  couleur: string;
}

const EMPTY_FORM: CreneauForm = {
  jour: "LUNDI",
  heureDebut: "07:00",
  heureFin: "08:00",
  matiereId: "",
  intitule: "",
  couleur: "",
};

export default function EmploiDuTempsTab({ classeId, canManage }: Props) {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);

  const [form, setForm] = useState<CreneauForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreneauHoraire | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: creneaux = [],
    isLoading,
    isError,
  } = useQuery<CreneauHoraire[]>({
    queryKey: ["classe-emploi-du-temps", classeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/emploi-du-temps`,
      );
      return data;
    },
    enabled: !!classeId,
  });

  const { data: matieres = [] } = useQuery<Matiere[]>({
    queryKey: ["classe-matieres", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/matieres`);
      return data;
    },
    enabled: !!classeId,
  });

  // ── Dérivé : lignes (plages horaires) et index rapide ─────────────────────

  const timeSlots = useMemo(() => {
    const seen = new Map<string, { heureDebut: string; heureFin: string }>();
    for (const c of creneaux) {
      const key = `${c.heureDebut}-${c.heureFin}`;
      if (!seen.has(key))
        seen.set(key, { heureDebut: c.heureDebut, heureFin: c.heureFin });
    }
    return [...seen.values()].sort((a, b) =>
      a.heureDebut.localeCompare(b.heureDebut),
    );
  }, [creneaux]);

  const creneauMap = useMemo(() => {
    const map = new Map<string, CreneauHoraire>();
    for (const c of creneaux) {
      map.set(`${c.jour}-${c.heureDebut}-${c.heureFin}`, c);
    }
    return map;
  }, [creneaux]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (values: CreneauForm) => {
      const payload = {
        jour: values.jour,
        heureDebut: values.heureDebut,
        heureFin: values.heureFin,
        matiereId: values.matiereId || undefined,
        intitule: values.intitule || undefined,
        couleur: values.couleur || undefined,
      };
      if (editingId) {
        const { data } = await api.put(
          `/api/classes/${classeId}/emploi-du-temps/${editingId}`,
          payload,
        );
        return data;
      }
      const { data } = await api.post(
        `/api/classes/${classeId}/emploi-du-temps`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classe-emploi-du-temps", classeId],
      });
      toast.success(editingId ? "Créneau mis à jour." : "Créneau ajouté.");
      modalRef.current?.close();
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
    onError: (err) =>
      toast.error(getApiError(err, "Erreur lors de l'enregistrement.")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/classes/${classeId}/emploi-du-temps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classe-emploi-du-temps", classeId],
      });
      toast.success("Créneau supprimé.");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la suppression."));
      setDeleteTarget(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openCreate(prefill?: Partial<CreneauForm>) {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, ...prefill });
    modalRef.current?.showModal();
  }

  function openEdit(c: CreneauHoraire) {
    setEditingId(c.id);
    setForm({
      jour: c.jour,
      heureDebut: c.heureDebut,
      heureFin: c.heureFin,
      matiereId: c.matiereId ?? "",
      intitule: c.intitule ?? "",
      couleur: c.couleur ?? "",
    });
    modalRef.current?.showModal();
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.matiereId && !form.intitule.trim()) {
      toast.error("Veuillez renseigner une matière ou un intitulé.");
      return;
    }
    if (form.heureDebut >= form.heureFin) {
      toast.error("L'heure de fin doit être après l'heure de début.");
      return;
    }
    saveMutation.mutate(form);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="alert alert-error">
        Erreur lors du chargement de l'emploi du temps. Veuillez réessayer.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span className="font-semibold">
            {creneaux.length} créneau{creneaux.length !== 1 ? "x" : ""}{" "}
            configuré
            {creneaux.length !== 1 ? "s" : ""}
          </span>
        </div>
        {canManage && (
          <button
            className="btn btn-primary btn-sm gap-1"
            onClick={() => openCreate()}
          >
            <Plus className="w-4 h-4" />
            Nouveau créneau
          </button>
        )}
      </div>

      {/* Empty state */}
      {timeSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-base-content/50 border-2 border-dashed rounded-xl">
          <CalendarDays size={40} />
          <p className="font-semibold text-lg">
            Aucun emploi du temps configuré
          </p>
          <p className="text-sm">
            Les cours apparaîtront ici une fois ajoutés.
          </p>
          {canManage && (
            <button
              className="btn btn-primary btn-sm mt-2"
              onClick={() => openCreate()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Commencer la configuration
            </button>
          )}
        </div>
      ) : (
        /* Tableau */
        <div className="overflow-x-auto rounded-xl border border-base-300">
          <table className="table w-full text-sm">
            <thead>
              <tr className="bg-base-200">
                <th className="text-center w-32 font-semibold">Horaire</th>
                {JOURS.map((j) => (
                  <th
                    key={j.key}
                    className="text-center min-w-32.5 font-semibold"
                  >
                    {j.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={`${slot.heureDebut}-${slot.heureFin}`}>
                  {/* Colonne horaire */}
                  <td className="text-center font-mono text-xs font-semibold bg-base-200/60 text-base-content/70 whitespace-nowrap border-r border-base-300">
                    {slot.heureDebut.replace(":", "h")}
                    <span className="mx-0.5 text-base-content/40">–</span>
                    {slot.heureFin.replace(":", "h")}
                  </td>

                  {/* Colonnes jours */}
                  {JOURS.map((j) => {
                    const c = creneauMap.get(
                      `${j.key}-${slot.heureDebut}-${slot.heureFin}`,
                    );
                    return (
                      <td
                        key={j.key}
                        className="p-1.5 border border-base-200 align-middle"
                      >
                        {c ? (
                          /* Cellule remplie */
                          <div
                            className="relative group rounded-lg px-2 py-2 min-h-13 flex flex-col justify-center"
                            style={{
                              backgroundColor: c.couleur
                                ? `${c.couleur}22`
                                : "hsl(var(--b2))",
                              borderLeft: `3px solid ${c.couleur ?? "hsl(var(--p))"}`,
                            }}
                          >
                            <span className="font-medium text-xs leading-snug block truncate">
                              {c.matiere?.nom ?? c.intitule ?? "—"}
                            </span>
                            {/* Boutons édition — visibles au survol */}
                            {canManage && (
                              <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5 bg-base-100/80 rounded p-0.5">
                                <button
                                  className="btn btn-ghost btn-xs p-0 h-5 w-5 min-h-0"
                                  title="Modifier"
                                  aria-label={`Modifier ${c.matiere?.nom ?? c.intitule ?? "ce créneau"}`}
                                  onClick={() => openEdit(c)}
                                >
                                  <Pencil size={10} />
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs text-error p-0 h-5 w-5 min-h-0"
                                  title="Supprimer"
                                  aria-label={`Supprimer ${c.matiere?.nom ?? c.intitule ?? "ce créneau"}`}
                                  onClick={() => setDeleteTarget(c)}
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : canManage ? (
                          /* Cellule vide — bouton + */
                          <button
                            className="w-full min-h-13 rounded-lg border-2 border-dashed border-base-300 text-base-content/25 hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
                            title={`Ajouter — ${j.label} ${slot.heureDebut}-${slot.heureFin}`}
                            aria-label={`Ajouter un cours le ${j.label} de ${slot.heureDebut} à ${slot.heureFin}`}
                            onClick={() =>
                              openCreate({
                                jour: j.key,
                                heureDebut: slot.heureDebut,
                                heureFin: slot.heureFin,
                              })
                            }
                          >
                            <Plus size={16} />
                          </button>
                        ) : (
                          <div className="min-h-13" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création / édition */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-4">
            {editingId ? "Modifier le créneau" : "Nouveau créneau"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Jour */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Jour *</span>
              </label>
              <select
                name="jour"
                value={form.jour}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                {JOURS.map((j) => (
                  <option key={j.key} value={j.key}>
                    {j.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Horaires */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Début *</span>
                </label>
                <input
                  type="time"
                  name="heureDebut"
                  value={form.heureDebut}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Fin *</span>
                </label>
                <input
                  type="time"
                  name="heureFin"
                  value={form.heureFin}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
            </div>

            {/* Matière */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Matière</span>
                <span className="label-text-alt text-base-content/50">
                  optionnel
                </span>
              </label>
              <select
                name="matiereId"
                value={form.matiereId}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="">— Choisir une matière —</option>
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Intitulé */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  Intitulé {form.matiereId ? "(optionnel)" : "*"}
                </span>
                <span className="label-text-alt text-base-content/50">
                  {form.matiereId
                    ? "Remplace le nom de la matière si renseigné"
                    : "Requis si aucune matière choisie"}
                </span>
              </label>
              <input
                name="intitule"
                value={form.intitule}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder={
                  form.matiereId
                    ? "ex: Maths renforcés"
                    : "ex: Sport, Récréation…"
                }
                maxLength={100}
              />
            </div>

            {/* Couleur */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Couleur</span>
                <span className="label-text-alt text-base-content/50">
                  optionnel
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {/* Réinitialiser */}
                <button
                  type="button"
                  title="Aucune couleur"
                  aria-label="Aucune couleur"
                  onClick={() => setForm((p) => ({ ...p, couleur: "" }))}
                  className={`w-7 h-7 rounded-full border-2 bg-base-200 transition-all ${
                    form.couleur === ""
                      ? "border-primary scale-110 shadow"
                      : "border-transparent opacity-50"
                  }`}
                />
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    aria-label={`Couleur ${hex}`}
                    onClick={() => setForm((p) => ({ ...p, couleur: hex }))}
                    style={{ backgroundColor: hex }}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      form.couleur === hex
                        ? "border-primary scale-110 shadow"
                        : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => modalRef.current?.close()}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : editingId ? (
                  "Mettre à jour"
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Confirmation suppression */}
      <ConfirmModal
        title="Supprimer le créneau"
        message={`Supprimer "${deleteTarget?.matiere?.nom ?? deleteTarget?.intitule ?? "ce créneau"}" (${deleteTarget?.jour ?? ""} ${deleteTarget?.heureDebut ?? ""}-${deleteTarget?.heureFin ?? ""}) ? Cette action est irréversible.`}
        isOpen={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
