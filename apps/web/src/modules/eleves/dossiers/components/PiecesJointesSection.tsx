import { useState } from "react";
import { Archive, FilePlus2, Search } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import ConfirmModal from "../../../../components/ConfirmModal";
import { useAuthStore } from "../../../../store/authStore";
import { StudentSearchSelect } from "../../informations/emergencyContact/components/StudentSearchSelect";
import {
  useArchiveStudentAttachment,
  useRestoreStudentAttachment,
  useStudentAttachments,
  useUploadStudentAttachment,
  type StudentAttachment,
  type StudentAttachmentType,
} from "../hooks/usePiecesJointes";
import { StudentAttachmentUploadModal } from "./PiecesJointesUploadModal";
import { StudentAttachmentsPanel } from "./PiecesJointesPanel";

type Props = {
  initialEleveId?: string;
};

type Vue = "actifs" | "archives";

export function PiecesJointesSection({ initialEleveId }: Props) {
  const user = useAuthStore((state) => state.user);
  const peutModifier = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [eleve, setEleve] = useState<FicheEleveComplete | null>(null);
  const [eleveIdInitial, setEleveIdInitial] = useState(initialEleveId);
  const [vue, setVue] = useState<Vue>("actifs");
  const [uploadOuvert, setUploadOuvert] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    attachment: StudentAttachment;
    action: "archiver" | "restaurer";
  } | null>(null);

  const eleveId = eleve?.id ?? eleveIdInitial;
  const attachments = useStudentAttachments(eleveId, vue === "archives");
  const upload = useUploadStudentAttachment();
  const archive = useArchiveStudentAttachment();
  const restore = useRestoreStudentAttachment();

  async function envoyer(type: StudentAttachmentType, file: File) {
    if (!eleveId) return;
    await upload.mutateAsync({ eleveId, type, file });
  }

  function executerConfirmation() {
    if (!confirmation || !eleveId) return;

    const { attachment, action } = confirmation;
    const mutation = action === "archiver" ? archive : restore;

    mutation.mutate(
      { eleveId, attachmentId: attachment.id },
      {
        onSettled: () => setConfirmation(null),
      },
    );
  }

  if (!peutModifier) {
    return (
      <p role="alert" className="alert alert-warning">
        Cette section est réservée aux administrateurs.
      </p>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FilePlus2 className="text-primary" size={22} />
          <div>
            <h2 className="text-lg font-bold">Pièces jointes de l’élève</h2>
            <p className="text-sm text-base-content/60">
              Documents administratifs et pièces du dossier scolaire.
            </p>
          </div>
        </div>

        {eleveId && vue === "actifs" && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setUploadOuvert(true)}
          >
            <FilePlus2 size={16} />
            Ajouter un document
          </button>
        )}
      </header>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={(student: FicheEleveComplete) => {
          setEleve(student);
          setEleveIdInitial(undefined);
          setVue("actifs");
        }}
      />

      {!eleveId && (
        <div className="rounded border border-dashed border-base-300 p-8 text-center">
          <Search className="mx-auto text-base-content/40" size={24} />
          <p className="mt-2 font-medium">Aucun élève sélectionné</p>
          <p className="text-sm text-base-content/60">
            Recherchez un élève pour consulter ses pièces jointes.
          </p>
        </div>
      )}

      {eleveId && (
        <>
          <div role="tablist" className="tabs tabs-bordered">
            <button
              type="button"
              role="tab"
              aria-selected={vue === "actifs"}
              className={`tab gap-2 ${vue === "actifs" ? "tab-active" : ""}`}
              onClick={() => setVue("actifs")}
            >
              <FilePlus2 size={16} />
              Pièces jointes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={vue === "archives"}
              className={`tab gap-2 ${vue === "archives" ? "tab-active" : ""}`}
              onClick={() => setVue("archives")}
            >
              <Archive size={16} />
              Archives
            </button>
          </div>

          {attachments.isLoading && (
            <div className="flex justify-center py-10" aria-busy="true">
              <span className="loading loading-spinner loading-lg" />
            </div>
          )}

          {attachments.isError && (
            <p role="alert" className="alert alert-error">
              Impossible de charger les pièces jointes.
            </p>
          )}

          {attachments.data && (
            <StudentAttachmentsPanel
              eleveId={eleveId}
              attachments={attachments.data}
              archived={vue === "archives"}
              onArchive={(attachment) =>
                setConfirmation({ attachment, action: "archiver" })
              }
              onRestore={(attachment) =>
                setConfirmation({ attachment, action: "restaurer" })
              }
            />
          )}
        </>
      )}

      {uploadOuvert && eleveId && (
        <StudentAttachmentUploadModal
          pending={upload.isPending}
          onClose={() => setUploadOuvert(false)}
          onUpload={envoyer}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmation}
        title={
          confirmation?.action === "archiver"
            ? "Archiver cette pièce jointe ?"
            : "Restaurer cette pièce jointe ?"
        }
        message={
          confirmation
            ? confirmation.action === "archiver"
              ? `« ${confirmation.attachment.fileName} » sera déplacé vers les archives.`
              : `« ${confirmation.attachment.fileName} » sera restauré dans les pièces jointes actives.`
            : ""
        }
        confirmLabel={
          confirmation?.action === "archiver" ? "Archiver" : "Restaurer"
        }
        cancelLabel="Annuler"
        isLoading={archive.isPending || restore.isPending}
        onConfirm={executerConfirmation}
        onCancel={() => setConfirmation(null)}
      />
    </section>
  );
}
