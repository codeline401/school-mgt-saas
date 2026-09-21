import { AlertCircle, AlertTriangle } from "lucide-react";

type ConfirmPaiementModalValues = {
  typeFrais: string;
  mois?: number | null;
  montantSaisi: number;
  modePaiement: string;
  referencePaiement?: string;
};

type ConfirmPaiementModalProps = {
  isOpen: boolean;
  values: ConfirmPaiementModalValues | null;
  isPending: boolean;
  // Montant restant dû pour le mois sélectionné, utilisé pour signaler un paiement partiel.
  montantDu?: number | null;
  isPaiementPartiel?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** Double confirmation avant encaissement définitif d'un paiement. */
export function ConfirmPaiementModal({
  isOpen,
  values,
  isPending,
  montantDu,
  isPaiementPartiel,
  onConfirm,
  onClose,
}: ConfirmPaiementModalProps) {
  if (!isOpen || !values) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <AlertCircle size={20} className="text-warning" />
          Confirmer l’encaissement
        </h3>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="text-base-content/60">Type de frais :</span>{" "}
            {values.typeFrais}
            {values.mois ? ` (mois ${values.mois})` : ""}
          </p>
          <p>
            <span className="text-base-content/60">Montant :</span>{" "}
            {values.montantSaisi}
          </p>
          <p>
            <span className="text-base-content/60">Mode de paiement :</span>{" "}
            {values.modePaiement}
          </p>
          {values.referencePaiement && (
            <p>
              <span className="text-base-content/60">Référence :</span>{" "}
              {values.referencePaiement}
            </p>
          )}
        </div>

        {isPaiementPartiel && (
          <div role="alert" className="alert alert-warning mt-4">
            <AlertTriangle size={18} />
            <span>
              Le montant saisi est inférieur au montant dû
              {montantDu != null ? ` (${montantDu})` : ""}. Ce paiement sera
              enregistré comme <strong>partiel</strong>.
            </span>
          </div>
        )}

        <p className="mt-4 text-sm text-warning">
          Cette action est définitive et génère un reçu d’encaissement.
        </p>

        <div className="modal-action">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Encaissement..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
