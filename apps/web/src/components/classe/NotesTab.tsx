import type { Eleve, Matiere, Note } from "@school-mgt/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { api, getApiError } from "../../lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "../ConfirmModal";
import { ClipboardList, FileText, Pencil, Plus, Trash2 } from "lucide-react";

interface Props {
  classeId: string;
  canWrite: boolean;
  canRead: boolean;
}

interface NoteForm {
  titre: string;
  eleveId: string;
  matiereId: string;
  note: string;
  noteMax: string;
  coefficient: string;
  commentaire: string;
  feuille: File | null;
}

const EMPTY_FORM: NoteForm = {
  titre: "",
  eleveId: "",
  matiereId: "",
  note: "",
  noteMax: "20",
  coefficient: "1",
  commentaire: "",
  feuille: null,
};

export default function NotesTab({ classeId, canWrite }: Props) {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);

  const [form, setForm] = useState<NoteForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  // Chargement des notes de la classe
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["classe-notes", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/notes`);
      return data;
    },
    enabled: !!classeId,
  });

  // Chargement des élèves pour le select
  const { data: eleves = [] } = useQuery<Eleve[]>({
    queryKey: ["classe-eleves", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/eleves`);
      return data;
    },
    enabled: !!classeId,
  });

  // Chargement des matières pour le select
  const { data: matieres = [] } = useQuery<Matiere[]>({
    queryKey: ["classe-matieres", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/matieres`);
      return data;
    },
    enabled: !!classeId,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: NoteForm) => {
      const formData = new FormData();
      formData.append("titre", values.titre);
      formData.append("eleveId", values.eleveId);
      formData.append("matiereId", values.matiereId);
      formData.append("note", values.note);
      formData.append("noteMax", values.noteMax);
      formData.append("coefficient", values.coefficient);
      if (values.commentaire)
        formData.append("commentaire", values.commentaire);
      if (values.feuille) formData.append("feuille", values.feuille);

      if (editingId) {
        const { data } = await api.put(
          `/api/classes/${classeId}/notes/${editingId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        return data;
      }
      const { data } = await api.post(
        `/api/classes/${classeId}/notes`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classe-notes", classeId] });
      toast.success(editingId ? "Note mise à jour." : "Note enregistrée.");
      modalRef.current?.close();
      setForm(EMPTY_FORM);
      setEditingId(null);
    },
    onError: (err) => {
      toast.error(
        getApiError(
          err,
          editingId
            ? "Erreur lors de la mise à jour."
            : "Erreur lors de la création.",
        ),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await api.delete(`/api/classes/${classeId}/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classe-notes", classeId] });
      toast.success("Note supprimée.");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la suppression."));
      setDeleteTarget(null);
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    modalRef.current?.showModal();
  }

  function openEdit(note: Note) {
    setEditingId(note.id);
    setForm({
      titre: note.titre,
      eleveId: note.eleveId,
      matiereId: note.matiere?.id ?? "",
      note: String(note.note),
      noteMax: String(note.noteMax),
      coefficient: String(note.coefficient),
      commentaire: note.commentaire ?? "",
      feuille: null,
    });
    modalRef.current?.showModal();
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, feuille: e.target.files?.[0] ?? null }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <span className="font-semibold text-base-content">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </span>
        </div>
        {canWrite && (
          <button className="btn btn-primary btn-sm gap-1" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Ajouter une note
          </button>
        )}
      </div>

      {/* Tableau des notes */}
      {notes.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          Aucune note enregistrée pour cette classe.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Matière</th>
                <th>Titre / Évaluation</th>
                <th className="text-center">Note</th>
                <th className="text-center">Coef.</th>
                <th>Commentaire</th>
                <th className="text-center">Feuille</th>
                {canWrite && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id}>
                  <td>
                    {n.eleve ? `${n.eleve.nom} ${n.eleve.prenom}` : n.eleveId}
                  </td>
                  <td>{n.matiere?.nom ?? "—"}</td>
                  <td className="font-medium">{n.titre}</td>
                  <td className="text-center">
                    <span className="badge badge-outline">
                      {Number(n.note)}/{Number(n.noteMax)}
                    </span>
                  </td>
                  <td className="text-center">{n.coefficient}</td>
                  <td className="max-w-xs truncate text-sm text-base-content/70">
                    {n.commentaire ?? "—"}
                  </td>
                  <td className="text-center">
                    {n.feuillePath ? (
                      <a
                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${n.feuillePath.replace(/\\/g, "/")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-xs"
                        aria-label="Voir la feuille corrigée"
                      >
                        <FileText className="w-4 h-4 text-info" />
                      </a>
                    ) : (
                      <span className="text-base-content/30 text-xs">—</span>
                    )}
                  </td>
                  {canWrite && (
                    <td className="text-right space-x-1">
                      <button
                        className="btn btn-ghost btn-xs"
                        aria-label="Modifier la note"
                        onClick={() => openEdit(n)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        aria-label="Supprimer la note"
                        onClick={() => setDeleteTarget(n)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création / édition */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="font-bold text-lg mb-4">
            {editingId ? "Modifier la note" : "Ajouter une note"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Titre — non modifiable en mode édition */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Titre de l'évaluation *</span>
              </label>
              <input
                name="titre"
                className="input input-bordered w-full"
                placeholder="ex: DS1 - 1er Trimestre 2025-2026"
                value={form.titre}
                onChange={handleChange}
                disabled={!!editingId}
                required
              />
            </div>

            {/* Élève */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Élève *</span>
              </label>
              <select
                name="eleveId"
                className="select select-bordered w-full"
                value={form.eleveId}
                onChange={handleChange}
                disabled={!!editingId}
                required
              >
                <option value="">— Sélectionner un élève —</option>
                {eleves.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom} {e.prenom}
                  </option>
                ))}
              </select>
            </div>

            {/* Matière */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Matière *</span>
              </label>
              <select
                name="matiereId"
                className="select select-bordered w-full"
                value={form.matiereId}
                onChange={handleChange}
                disabled={!!editingId}
                required
              >
                <option value="">— Sélectionner une matière —</option>
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Note / Note max */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Note *</span>
                </label>
                <input
                  type="number"
                  name="note"
                  className="input input-bordered w-full"
                  min={0}
                  step="0.01"
                  value={form.note}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Note max *</span>
                </label>
                <input
                  type="number"
                  name="noteMax"
                  className="input input-bordered w-full"
                  min={1}
                  step="0.01"
                  value={form.noteMax}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Coefficient */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Coefficient</span>
              </label>
              <input
                type="number"
                name="coefficient"
                className="input input-bordered w-full"
                min={1}
                value={form.coefficient}
                onChange={handleChange}
              />
            </div>

            {/* Commentaire */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Commentaire</span>
              </label>
              <textarea
                name="commentaire"
                className="textarea textarea-bordered w-full"
                rows={2}
                value={form.commentaire}
                onChange={handleChange}
              />
            </div>

            {/* Feuille corrigée */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  Feuille corrigée (PDF, JPEG, PNG — max 10 Mo)
                </span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="file-input file-input-bordered w-full"
                onChange={handleFileChange}
              />
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  modalRef.current?.close();
                  setForm(EMPTY_FORM);
                  setEditingId(null);
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                {editingId ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>fermer</button>
        </form>
      </dialog>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer la note"
        message={
          deleteTarget
            ? `Supprimer la note "${deleteTarget.titre}" pour ${deleteTarget.eleve ? `${deleteTarget.eleve.nom} ${deleteTarget.eleve.prenom}` : "cet élève"} ?`
            : ""
        }
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
