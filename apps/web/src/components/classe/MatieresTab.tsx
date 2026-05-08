import type { Matiere } from "@school-mgt/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { api, getApiError } from "../../lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "../ConfirmModal";
import { BookMarked, Pencil, Plus, Trash2 } from "lucide-react";

interface Props {
  classeId: string;
  canEdit: boolean;
}

interface MatiereForm {
  nom: string;
  description: string;
}

const EMPTY_FORM: MatiereForm = { nom: "", description: "" };

export default function MatieresTab({ classeId, canEdit }: Props) {
  const queryClient = useQueryClient(); // Initialisation du client de requête pour la gestion du cache
  const modalRef = useRef<HTMLDialogElement>(null); // Référence pour le modal de création de matière

  const [form, setForm] = useState<MatiereForm>(EMPTY_FORM); // État pour le formulaire de création de matière
  const [editingId, setEditingId] = useState<string | null>(null); // État pour suivre l'ID de la matière en cours d'édition
  const [deleteTarget, setDeleteTarget] = useState<Matiere | null>(null); // État pour suivre l'ID de la matière ciblée pour suppression

  const { data: matieres = [], isLoading } = useQuery<Matiere[]>({
    queryKey: ["classe-matieres", classeId], // Clé de la requête pour le cache, incluant l'ID de la classe
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/matieres`); // Requête pour récupérer les matières de la classe
      return data; // Retourne les données des matières
    },
    enabled: !!classeId, // N'exécute la requête que si l'ID de la classe est présent
  });

  const saveMutation = useMutation({
    mutationFn: async (values: MatiereForm) => {
      if (editingId) {
        const { data } = await api.put(
          `/api/classes/${classeId}/matieres/${editingId}`, // Correction de l'URL pour inclure l'ID de la matière
          values,
        ); // Requête pour mettre à jour une matière existante
        return data; // Retourne les données de la matière mise à jour
      }
      const { data } = await api.post(
        `/api/classes/${classeId}/matieres`,
        values,
      ); // Requête pour créer une nouvelle matière
      return data; // Retourne les données de la matière créée
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classe-matieres", classeId],
      }); // Invalide le cache des matières de la classe pour forcer le rechargement
      toast.success(
        editingId
          ? "Matière mise à jour avec succès"
          : "Matière créée avec succès",
      ); // Affiche un message de succès
      modalRef.current?.close(); // Ferme le modal de création/édition
      setForm(EMPTY_FORM); // Réinitialise le formulaire
      setEditingId(null); // Réinitialise l'ID d'édition
    },

    onError: (err) => {
      toast.error(
        getApiError(
          err,
          editingId
            ? "Erreur lors de la mise à jour de la matière."
            : "Erreur lors de la création de la matière.",
        ),
      );
    }, // Affiche un message d'erreur en cas d'échec
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/classes/${classeId}/matieres/${id}`); // Requête pour supprimer une matière
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classe-matieres", classeId],
      }); // Invalide le cache des matières de la classe pour forcer le rechargement
      toast.success("Matière supprimée avec succès"); // Affiche un message de succès
      setDeleteTarget(null); // Réinitialise la cible de suppression
    },
    onError: (err) => {
      toast.error(
        getApiError(err, "Erreur lors de la suppression de la matière."),
      ); // Affiche un message d'erreur en cas d'échec
    },
  });

  const openCreate = () => {
    setForm(EMPTY_FORM); // Réinitialise le formulaire pour la création
    setEditingId(null); // Réinitialise l'ID d'édition
    modalRef.current?.showModal(); // Ouvre le modal de création
  };

  const openEdit = (matiere: Matiere) => {
    setForm({ nom: matiere.nom, description: matiere.description ?? "" }); // Remplit le formulaire avec les données de la matière à éditer
    setEditingId(matiere.id); // Définit l'ID de la matière en cours d'édition
    modalRef.current?.showModal(); // Ouvre le modal d'édition
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); // Empêche le comportement par défaut du formulaire
    if (form.nom.trim().length < 2)
      return toast.error(
        "Le nom de la matière doit contenir au moins 2 caractères.",
      ); // Validation simple du nom de la matière
    saveMutation.mutate({
      nom: form.nom.trim(),
      description: form.description.trim(),
    }); // Lance la mutation de sauvegarde avec les données du formulaire
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button className="btn btn-primary btn-sm gap-2" onClick={openCreate}>
            <Plus size={16} />
            Ajouter une matière
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : matieres.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-base-content/50">
          <BookMarked size={40} />
          <p>Aucune matière définie pour cette classe.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                {canEdit && <th className="w-28">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {matieres.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.nom}</td>
                  <td className="text-base-content/70">
                    {m.description ?? "—"}
                  </td>
                  {canEdit && (
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEdit(m)}
                          title="Modifier"
                          aria-label={`Modifier la matière ${m.nom}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteTarget(m)}
                          title="Supprimer"
                          aria-label={`Supprimer la matière ${m.nom}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal créer / modifier */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            {editingId ? "Modifier la matière" : "Nouvelle matière"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="form-control">
              <div className="label">
                <span className="label-text">Nom *</span>
              </div>
              <input
                className="input input-bordered w-full"
                value={form.nom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nom: e.target.value }))
                }
                placeholder="ex: Mathématiques"
                required
                minLength={2}
              />
            </label>
            <label className="form-control">
              <div className="label">
                <span className="label-text">Description</span>
              </div>
              <textarea
                className="textarea textarea-bordered w-full"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description optionnelle..."
                rows={3}
              />
            </label>
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
                  "Enregistrer"
                ) : (
                  "Créer"
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* ConfirmModal suppression */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer la matière"
        message={`Voulez-vous vraiment supprimer la matière "${deleteTarget?.nom}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
