import { Trash } from "lucide-react";
import { useEffect, useRef } from "react"; // Importation de useEffect et useRef depuis React;

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null); // Référence au composant dialog

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal(); // Affiche le modal lorsque isOpen est true
    } else {
      modalRef.current?.close(); // Ferme le modal lorsque isOpen est false
    }
  }, [isOpen]);

  return (
    <dialog ref={modalRef} className="modal" onClose={onCancel}>
      <div className="modal-box max-w-sm">
        {/* Icône + Titre */}
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="bg-error/10 text-error rounded-full p-3">
            <Trash size={24} />
          </div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-base-content/60 text-sm">{message}</p>
        </div>

        {/* Actions */}
        <div className="modal-action justify-center gap-3 mt-4">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>

        {/*Fermeture en cliquant en dehors */}
        <form method="dialog" className="modal-backdrop">
          <button type="submit" onClick={onCancel}>
            Fermer
          </button>
        </form>
      </div>
    </dialog>
  );
}
