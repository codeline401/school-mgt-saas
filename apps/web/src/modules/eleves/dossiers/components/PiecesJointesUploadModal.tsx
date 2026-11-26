import { useEffect, useRef, useState, type FormEvent } from "react";
import type { StudentAttachmentType } from "../hooks/usePiecesJointes";

type Props = {
  pending: boolean;
  onClose: () => void;
  onUpload: (type: StudentAttachmentType, file: File) => Promise<void>;
};

const TYPES: Array<{ value: StudentAttachmentType; label: string }> = [
  { value: "CERTIFICAT_NAISSANCE", label: "Certificat de naissance" },
  { value: "CERTIFICAT_RESIDENCE", label: "Certificat de résidence" },
  { value: "CERTIFICAT_MEDICAL", label: "Certificat médical" },
  { value: "PIECE_IDENTITE_TUTEUR", label: "Pièce d’identité du tuteur" },
  { value: "AUTRE", label: "Autre document" },
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function StudentAttachmentUploadModal({
  pending,
  onClose,
  onUpload,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<StudentAttachmentType>(
    "CERTIFICAT_NAISSANCE",
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choisirFichier(candidate: File | null) {
    setError(null);

    if (!candidate) {
      setFile(null);
      return;
    }
    if (!MIME_TYPES.includes(candidate.type)) {
      setFile(null);
      setError("Formats acceptés : PDF, JPEG et PNG.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("La taille maximale autorisée est de 2 Mo.");
      return;
    }

    setFile(candidate);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Sélectionnez un fichier.");
      return;
    }

    try {
      await onUpload(type, file);
      onClose();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Impossible d'envoyer le fichier.",
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClose={() => {
        if (!pending && !dialogRef.current?.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">Ajouter une pièce jointe</h3>

        <form className="mt-4 space-y-4" onSubmit={soumettre}>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Type de document</legend>
            <select
              className="select select-bordered w-full"
              value={type}
              onChange={(event) =>
                setType(event.target.value as StudentAttachmentType)
              }
            >
              {TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Fichier</legend>
            <input
              className="file-input file-input-bordered w-full"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) =>
                choisirFichier(event.target.files?.[0] ?? null)
              }
            />
            <span className="label">PDF, JPEG ou PNG · 2 Mo maximum</span>
          </fieldset>

          {file && (
            <p className="text-sm text-base-content/70">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} Mo
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={pending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending || !file}
            >
              {pending && (
                <span className="loading loading-spinner loading-sm" />
              )}
              Envoyer
            </button>
          </div>
        </form>
      </div>

    </dialog>
  );
}
