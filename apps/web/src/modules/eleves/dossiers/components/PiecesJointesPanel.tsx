import { Archive, ArchiveRestore, Download, FileText } from "lucide-react";
import type { StudentAttachment } from "../hooks/usePiecesJointes";
import { ouvrirStudentAttachment } from "../hooks/usePiecesJointes";

type Props = {
  eleveId: string;
  attachments: StudentAttachment[];
  archived: boolean;
  onArchive: (attachment: StudentAttachment) => void;
  onRestore: (attachment: StudentAttachment) => void;
};

const TYPE_LABELS: Record<StudentAttachment["type"], string> = {
  CERTIFICAT_NAISSANCE: "Certificat de naissance",
  CERTIFICAT_RESIDENCE: "Certificat de résidence",
  CERTIFICAT_MEDICAL: "Certificat médical",
  PIECE_IDENTITE_TUTEUR: "Pièce d’identité du tuteur",
  AUTRE: "Autre document",
};

function formaterTaille(sizeBytes: number): string {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} Ko`;
  }
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} Mo`;
}

function formaterDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR");
}

export function StudentAttachmentsPanel({
  eleveId,
  attachments,
  archived,
  onArchive,
  onRestore,
}: Props) {
  if (attachments.length === 0) {
    return (
      <div className="rounded border border-dashed border-base-300 p-8 text-center">
        <FileText className="mx-auto text-base-content/40" size={24} />
        <p className="mt-2 font-medium">
          {archived ? "Aucune pièce jointe archivée" : "Aucune pièce jointe"}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-base-200">
      <table className="table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Nom du fichier</th>
            <th>Taille</th>
            <th>Ajouté le</th>
            <th>Ajouté par</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attachments.map((attachment) => (
            <tr key={attachment.id}>
              <td>{TYPE_LABELS[attachment.type]}</td>
              <td className="max-w-64 truncate">{attachment.fileName}</td>
              <td>{formaterTaille(attachment.sizeBytes)}</td>
              <td>{formaterDate(attachment.createdAt)}</td>
              <td>
                {attachment.createdBy.prenom} {attachment.createdBy.nom}
              </td>
              <td>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    title="Télécharger"
                    aria-label={`Télécharger ${attachment.fileName}`}
                    onClick={() =>
                      void ouvrirStudentAttachment(eleveId, attachment.id)
                    }
                  >
                    <Download size={16} />
                  </button>

                  {archived ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-square"
                      title="Restaurer"
                      aria-label={`Restaurer ${attachment.fileName}`}
                      onClick={() => onRestore(attachment)}
                    >
                      <ArchiveRestore size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-square"
                      title="Archiver"
                      aria-label={`Archiver ${attachment.fileName}`}
                      onClick={() => onArchive(attachment)}
                    >
                      <Archive size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
