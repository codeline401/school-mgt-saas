/**
 * @file SaisieNotesTab.tsx
 * @description Onglet "Saisie des notes" du module Notes & Examens.
 *
 * Fonctionnalités :
 *  - Filtre par classe : sélectionner une classe affiche ses notes.
 *  - Tableau des notes avec élève, matière, titre, note, coefficient, feuille.
 *  - Bouton "Saisir une note" (ADMIN, SUDO_ADMIN, PROF) :
 *      1. Sélection de la classe
 *      2. Sélection de l'élève (chargé dynamiquement)
 *      3. Sélection de la matière (chargée dynamiquement)
 *      4. Titre de l'évaluation, note, note max, coefficient, commentaire, feuille
 *  - Modification et suppression des notes existantes.
 *
 * Accès en lecture : ADMIN, SUDO_ADMIN, USER.
 * Accès en écriture : ADMIN, SUDO_ADMIN, PROF.
 */

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import ConfirmModal from "../ConfirmModal";
import type { Classe, Eleve, Matiere, Note } from "@school-mgt/types";

type TypeNote = Note["typeNote"];

// ─── Helpers d'affichage ──────────────────────────────────────────────────────

/**
 * Parse un string de date sans décaler le jour dû à l'UTC.
 * Les strings "YYYY-MM-DD" sont traitées comme locales ; les datetimes complets
 * (avec 'T') sont passés directement au constructeur Date.
 */
function parseLocalDate(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

const TYPE_NOTE_LABELS: Record<TypeNote, string> = {
  INTERROGATION: "Interrogation",
  DS: "DS",
  EXAMEN: "Examen",
  AUTRE: "Autre",
};

const TYPE_NOTE_BADGE: Record<TypeNote, string> = {
  INTERROGATION: "badge-info",
  DS: "badge-warning",
  EXAMEN: "badge-error",
  AUTRE: "badge-ghost",
};

// ─── Types ────────────────────────────────────────────────────────────────────

/** Champs du formulaire de saisie/modification d'une note. */
interface NoteForm {
  classeId: string; // sélection préalable de la classe
  eleveId: string;
  matiereId: string;
  titre: string;
  note: string;
  noteMax: string;
  coefficient: string;
  commentaire: string;
  typeNote: TypeNote;
  dateEval: string; // YYYY-MM-DD
  feuille: File | null;
}

const EMPTY_FORM: NoteForm = {
  classeId: "",
  eleveId: "",
  matiereId: "",
  titre: "",
  note: "",
  noteMax: "20",
  coefficient: "1",
  commentaire: "",
  typeNote: "AUTRE",
  dateEval: new Date().toISOString().slice(0, 10),
  feuille: null,
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function SaisieNotesTab() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const user = useAuthStore((s) => s.user);

  // Droits : ADMIN, SUDO_ADMIN et PROF peuvent saisir / modifier / supprimer
  const canWrite =
    user?.role === "ADMIN" ||
    user?.role === "SUDO_ADMIN" ||
    user?.role === "PROF";

  // ── État : filtre classe (vue tableau) et formulaire (modal) ──────────────
  const [filterClasseId, setFilterClasseId] = useState<string>("");
  const [form, setForm] = useState<NoteForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  // ── Chargement de toutes les classes (pour le filtre et le modal) ─────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });

  // ── Chargement des notes de la classe sélectionnée dans le filtre ─────────
  const {
    data: notes = [],
    isLoading: notesLoading,
    isError: notesError,
  } = useQuery<Note[]>({
    queryKey: ["classe-notes", filterClasseId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${filterClasseId}/notes`);
      return data;
    },
    // N'active la requête que si une classe est sélectionnée dans le filtre
    enabled: !!filterClasseId,
  });

  // ── Chargement des élèves pour la classe sélectionnée dans le MODAL ───────
  const { data: modalEleves = [] } = useQuery<Eleve[]>({
    queryKey: ["classe-eleves", form.classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${form.classeId}/eleves`);
      return data;
    },
    enabled: !!form.classeId,
  });

  // ── Chargement des matières pour la classe sélectionnée dans le MODAL ─────
  const { data: modalMatieres = [] } = useQuery<Matiere[]>({
    queryKey: ["classe-matieres", form.classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${form.classeId}/matieres`);
      return data;
    },
    enabled: !!form.classeId,
  });

  // ── Mutation : création ou mise à jour d'une note ─────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (values: NoteForm) => {
      const formData = new FormData();
      formData.append("titre", values.titre);
      formData.append("eleveId", values.eleveId);
      formData.append("matiereId", values.matiereId);
      formData.append("note", values.note);
      formData.append("noteMax", values.noteMax);
      formData.append("coefficient", values.coefficient);
      formData.append("typeNote", values.typeNote);
      formData.append("dateEval", values.dateEval);
      if (values.commentaire)
        formData.append("commentaire", values.commentaire);
      if (values.feuille) formData.append("feuille", values.feuille);

      if (editingId) {
        const { data } = await api.put(
          `/api/classes/${values.classeId}/notes/${editingId}`,
          formData,
        );
        return data;
      }
      const { data } = await api.post(
        `/api/classes/${values.classeId}/notes`,
        formData,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalide le cache de la classe concernée
      queryClient.invalidateQueries({
        queryKey: ["classe-notes", variables.classeId],
      });
      toast.success(editingId ? "Note mise à jour." : "Note enregistrée.");
      closeModal();
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

  // ── Mutation : suppression d'une note ─────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async ({
      classeId,
      noteId,
    }: {
      classeId: string;
      noteId: string;
    }) => {
      await api.delete(`/api/classes/${classeId}/notes/${noteId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classe-notes", variables.classeId],
      });
      toast.success("Note supprimée.");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la suppression."));
      setDeleteTarget(null);
    },
  });
  // ── Helpers modal ──────────────────────────────────────────────────────────

  /** Ouvre le modal en mode création, pré-remplit la classe si le filtre est actif. */
  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, classeId: filterClasseId });
    modalRef.current?.showModal();
  }

  /** Ouvre le modal en mode édition avec les données de la note. */
  function openEdit(note: Note) {
    setEditingId(note.id);
    setForm({
      classeId: note.classeId,
      eleveId: note.eleveId,
      matiereId: note.matiereId ?? note.matiere?.id ?? "",
      titre: note.titre,
      note: String(note.note),
      noteMax: String(note.noteMax),
      coefficient: String(note.coefficient),
      commentaire: note.commentaire ?? "",
      typeNote: note.typeNote ?? "AUTRE",
      dateEval: note.dateEval
        ? note.dateEval.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      feuille: null,
    });
    modalRef.current?.showModal();
  }

  function closeModal() {
    modalRef.current?.close();
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  // ── Gestionnaires de formulaire ────────────────────────────────────────────

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Quand la classe change dans le modal, réinitialise élève et matière
      if (name === "classeId") {
        next.eleveId = "";
        next.matiereId = "";
      }
      return next;
    });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, feuille: e.target.files?.[0] ?? null }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── En-tête : filtre classe + bouton saisir ────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/* Filtre classe */}
        <fieldset className="fieldset min-w-56">
          <legend className="fieldset-legend">Filtrer par classe</legend>
          <select
            className="select select-sm w-full"
            value={filterClasseId}
            onChange={(e) => setFilterClasseId(e.target.value)}
            aria-label="Sélectionner une classe"
          >
            <option value="">— Toutes les classes —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Compteur + bouton */}
        <div className="flex items-center gap-3">
          {filterClasseId && !notesLoading && (
            <span className="flex items-center gap-1 text-sm text-base-content/60">
              <ClipboardList size={14} />
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </span>
          )}
          {canWrite && (
            <button
              className="btn btn-primary btn-sm gap-1"
              onClick={openCreate}
              aria-label="Saisir une nouvelle note"
            >
              <Plus size={14} />
              Saisir une note
            </button>
          )}
        </div>
      </div>

      {/* ── Etat : aucune classe sélectionnée ─────────────────────────── */}
      {!filterClasseId && (
        <div className="text-center py-16 text-base-content/40 text-sm">
          Sélectionnez une classe pour afficher ses notes.
        </div>
      )}

      {/* ── Chargement ────────────────────────────────────────────────── */}
      {filterClasseId && notesLoading && (
        <div className="flex justify-center py-12" aria-busy="true">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {/* ── Erreur API ─────────────────────────────────────────────────── */}
      {notesError && (
        <div role="alert" className="alert alert-error">
          Erreur lors du chargement des notes.
        </div>
      )}

      {/* ── Tableau des notes ──────────────────────────────────────────── */}
      {filterClasseId && !notesLoading && !notesError && (
        <>
          {notes.length === 0 ? (
            <div className="text-center py-12 text-base-content/40 text-sm">
              Aucune note enregistrée pour cette classe.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="table table-zebra w-full"
                aria-label="Liste des notes"
              >
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
                        {n.eleve
                          ? `${n.eleve.nom} ${n.eleve.prenom}`
                          : n.eleveId}
                      </td>
                      <td>{n.matiere?.nom ?? "—"}</td>
                      <td className="font-medium">
                        <div>{n.titre}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {n.typeNote && (
                            <span
                              className={`badge badge-xs ${
                                TYPE_NOTE_BADGE[n.typeNote] ?? "badge-ghost"
                              }`}
                            >
                              {TYPE_NOTE_LABELS[n.typeNote] ?? n.typeNote}
                            </span>
                          )}
                          {n.dateEval && (
                            <span className="text-xs text-base-content/40">
                              {parseLocalDate(n.dateEval).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-outline">
                          {Number(n.note)}/{Number(n.noteMax)}
                        </span>
                      </td>
                      <td className="text-center">{n.coefficient}</td>
                      <td className="max-w-xs truncate text-sm text-base-content/60">
                        {n.commentaire ?? "—"}
                      </td>
                      <td className="text-center">
                        {n.feuillePath ? (
                          <a
                            href={`${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/uploads/feuilles/${n.feuillePath.split(/[\\/]/).pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-xs"
                            aria-label="Voir la feuille corrigée"
                          >
                            <FileText size={14} className="text-info" />
                          </a>
                        ) : (
                          <span className="text-base-content/30 text-xs">
                            —
                          </span>
                        )}
                      </td>
                      {canWrite && (
                        <td className="text-right space-x-1">
                          <button
                            className="btn btn-ghost btn-xs"
                            aria-label="Modifier la note"
                            onClick={() => openEdit(n)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            aria-label="Supprimer la note"
                            onClick={() => setDeleteTarget(n)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Modal création / édition ───────────────────────────────────── */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="font-bold text-lg mb-4">
            {editingId ? "Modifier la note" : "Saisir une note"}
          </h3>

          {saveMutation.isError && (
            <div role="alert" className="alert alert-error alert-soft mb-3">
              <span>
                {getApiError(saveMutation.error, "Une erreur est survenue.")}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* ── 1. Sélection de la classe ─────────────────────────── */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Classe *</legend>
              <select
                name="classeId"
                className="select w-full"
                value={form.classeId}
                onChange={handleChange}
                // La classe n'est plus modifiable en mode édition
                disabled={!!editingId}
                required
              >
                <option value="">— Sélectionner une classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </fieldset>

            {/* ── 2. Sélection de l'élève (dépend de la classe) ────── */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Élève *</legend>
              <select
                name="eleveId"
                className="select w-full"
                value={form.eleveId}
                onChange={handleChange}
                disabled={!form.classeId || !!editingId}
                required
              >
                <option value="">
                  {form.classeId
                    ? "— Sélectionner un élève —"
                    : "— Choisir d'abord une classe —"}
                </option>
                {modalEleves.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom} {e.prenom}
                  </option>
                ))}
              </select>
            </fieldset>

            {/* ── 3. Sélection de la matière (dépend de la classe) ─── */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Matière *</legend>
              <select
                name="matiereId"
                className="select w-full"
                value={form.matiereId}
                onChange={handleChange}
                disabled={!form.classeId || !!editingId}
                required
              >
                <option value="">
                  {form.classeId
                    ? "— Sélectionner une matière —"
                    : "— Choisir d'abord une classe —"}
                </option>
                {modalMatieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </fieldset>

            {/* ── 4. Titre de l'évaluation ──────────────────────────── */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Titre de l'évaluation *
              </legend>
              <input
                type="text"
                name="titre"
                className="input w-full"
                placeholder="ex : DS1 – 1er Trimestre 2025-2026"
                value={form.titre}
                onChange={handleChange}
                // Le titre (clé d'unicité) n'est plus modifiable en édition
                disabled={!!editingId}
                required
              />
            </fieldset>
            {/* ── 4b. Type d'évaluation + Date ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Type d'évaluation</legend>
                <select
                  name="typeNote"
                  className="select w-full"
                  value={form.typeNote}
                  onChange={handleChange}
                >
                  <option value="INTERROGATION">Interrogation</option>
                  <option value="DS">Devoir surveillé (DS)</option>
                  <option value="EXAMEN">Examen</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Date de l'évaluation
                </legend>
                <input
                  type="date"
                  name="dateEval"
                  className="input w-full"
                  value={form.dateEval}
                  onChange={handleChange}
                />
              </fieldset>
            </div>
            {/* ── 5. Note / Note max ────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Note *</legend>
                <input
                  type="number"
                  name="note"
                  className="input w-full"
                  min={0}
                  step="0.01"
                  value={form.note}
                  onChange={handleChange}
                  required
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Note max *</legend>
                <input
                  type="number"
                  name="noteMax"
                  className="input w-full"
                  min={1}
                  step="0.01"
                  value={form.noteMax}
                  onChange={handleChange}
                  required
                />
              </fieldset>
            </div>

            {/* ── 6. Coefficient ────────────────────────────────────── */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Coefficient</legend>
              <input
                type="number"
                name="coefficient"
                className="input w-full"
                min={1}
                step="0.5"
                value={form.coefficient}
                onChange={handleChange}
              />
            </fieldset>

            {/* ── 7. Commentaire ────────────────────────────────────── */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Commentaire</legend>
              <textarea
                name="commentaire"
                className="textarea w-full"
                rows={2}
                value={form.commentaire}
                onChange={handleChange}
              />
            </fieldset>

            {/* ── 8. Feuille corrigée ───────────────────────────────── */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Feuille corrigée (PDF, JPEG, PNG – max 10 Mo)
              </legend>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="file-input w-full"
                onChange={handleFileChange}
              />
            </fieldset>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeModal}
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

        {/* Fermeture en cliquant hors du modal */}
        <form method="dialog" className="modal-backdrop">
          <button type="submit" onClick={closeModal}>
            Fermer
          </button>
        </form>
      </dialog>

      {/* ── Modal de confirmation de suppression ───────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer la note"
        message={
          deleteTarget
            ? `Supprimer la note « ${deleteTarget.titre} » de ${deleteTarget.eleve ? `${deleteTarget.eleve.nom} ${deleteTarget.eleve.prenom}` : "cet élève"} ? Cette action est irréversible.`
            : ""
        }
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({
              classeId: deleteTarget.classeId,
              noteId: deleteTarget.id,
            });
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
