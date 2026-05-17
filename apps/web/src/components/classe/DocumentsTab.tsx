import type { ClasseDocument, Matiere } from "@school-mgt/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { api, getApiError } from "../../lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "../ConfirmModal";
import { FileText, Plus, Trash2, Eye } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const TYPE_LABELS: Record<string, string> = {
  COURS: "Cours",
  DEVOIR: "Devoir",
  EVALUATION: "Évaluation",
  NOTE_SERVICE: "Note de service",
  CIRCULAIRE: "Circulaire",
  AUTRE: "Autre",
};

const TYPE_BADGE: Record<string, string> = {
  COURS: "badge-primary",
  DEVOIR: "badge-secondary",
  EVALUATION: "badge-accent",
  NOTE_SERVICE: "badge-warning",
  CIRCULAIRE: "badge-info",
  AUTRE: "badge-ghost",
};

interface Props {
  classeId: string;
  canUpload: boolean;
}

interface DocForm {
  titre: string;
  description: string;
  type: string;
  matiereId: string;
  fichier: File | null;
}

const EMPTY_FORM: DocForm = {
  titre: "",
  description: "",
  type: "COURS",
  matiereId: "",
  fichier: null,
};

export default function DocumentsTab({ classeId, canUpload }: Props) {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const user = useAuthStore((s) => s.user);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<DocForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ClasseDocument | null>(null);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);

  const {
    data: documents = [],
    isLoading,
    isError,
  } = useQuery<ClasseDocument[]>({
    queryKey: ["classe-documents", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/documents`);
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
    enabled: !!classeId && canUpload,
  });

  const uploadMutation = useMutation({
    mutationFn: async (values: DocForm) => {
      const formData = new FormData();
      formData.append("titre", values.titre);
      formData.append("type", values.type);
      if (values.description)
        formData.append("description", values.description);
      if (values.matiereId) formData.append("matiereId", values.matiereId);
      if (values.fichier) formData.append("fichier", values.fichier);
      const { data } = await api.post(
        `/api/classes/${classeId}/documents`,
        formData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classe-documents", classeId],
      });
      toast.success("Document ajouté.");
      modalRef.current?.close();
      setForm(EMPTY_FORM);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => toast.error(getApiError(err, "Erreur lors de l'ajout.")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/api/classes/${classeId}/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classe-documents", classeId],
      });
      toast.success("Document supprimé.");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la suppression."));
      setDeleteTarget(null);
    },
  });

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, fichier: e.target.files?.[0] ?? null }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.fichier) {
      toast.error("Veuillez sélectionner un fichier.");
      return;
    }
    uploadMutation.mutate(form);
  }

  function canDelete(doc: ClasseDocument) {
    return (
      user?.role === "SUDO_ADMIN" ||
      user?.role === "ADMIN" ||
      doc.uploadedById === user?.id
    );
  }

  async function openDocument(doc: ClasseDocument) {
    const filename = doc.filePath.split(/[\\/]/).pop();
    if (!filename) return;
    setOpeningDocId(doc.id);
    try {
      const response = await api.get(`/uploads/documents/${encodeURIComponent(filename)}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.data.type || doc.mimeType,
      });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      if (!win)
        toast.error(
          "Votre navigateur a bloqué l'ouverture. Autorisez les popups.",
        );
    } catch {
      toast.error("Impossible d'ouvrir le document.");
    } finally {
      setOpeningDocId(null);
    }
  }

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
        Erreur lors du chargement des documents. Veuillez réessayer.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </span>
        </div>
        {canUpload && (
          <button
            className="btn btn-primary btn-sm gap-1"
            onClick={() => {
              setForm(EMPTY_FORM);
              if (fileInputRef.current) fileInputRef.current.value = "";
              modalRef.current?.showModal();
            }}
          >
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        )}
      </div>

      {/* Tableau */}
      {documents.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          Aucun document partagé dans cette classe.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Matière</th>
                <th>Ajouté par</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="font-medium">{doc.titre}</div>
                    {doc.description && (
                      <div className="text-xs text-base-content/60">
                        {doc.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${TYPE_BADGE[doc.type] ?? "badge-ghost"}`}
                    >
                      {TYPE_LABELS[doc.type] ?? doc.type}
                    </span>
                  </td>
                  <td>
                    {doc.matiere?.nom ?? (
                      <span className="text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    {doc.uploadedBy
                      ? `${doc.uploadedBy.prenom} ${doc.uploadedBy.nom}`
                      : "—"}
                  </td>
                  <td className="text-sm">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn btn-ghost btn-xs"
                        title="Consulter"
                        aria-label={`Consulter ${doc.titre || doc.id}`}
                        disabled={openingDocId === doc.id}
                        onClick={() => openDocument(doc)}
                      >
                        {openingDocId === doc.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {canDelete(doc) && (
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                          aria-label={`Supprimer ${doc.titre || doc.id}`}
                          onClick={() => setDeleteTarget(doc)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal upload */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Ajouter un document</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Titre *</span>
              </label>
              <input
                name="titre"
                value={form.titre}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
                maxLength={200}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Type *</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {matieres.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Matière (optionnel)</span>
                </label>
                <select
                  name="matiereId"
                  value={form.matiereId}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  <option value="">— Aucune matière —</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description (optionnel)</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full"
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  Fichier * (PDF, Word, PowerPoint, image — max 20 Mo)
                </span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx"
                onChange={handleFileChange}
                className="file-input file-input-bordered w-full"
                required
              />
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
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
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
        title="Supprimer le document"
        message={`Voulez-vous supprimer "${deleteTarget?.titre}" ? Cette action est irréversible.`}
        isOpen={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
