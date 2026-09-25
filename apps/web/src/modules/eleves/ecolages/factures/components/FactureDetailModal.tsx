import { X, Printer } from "lucide-react";
import { useFactureDetail, usePrintFacture } from "../hooks/useFacturesEleve";
import toast from "react-hot-toast";

type Props = {
  factureId: string | null;
  onClose: () => void;
};

function formatMontant(value: string | number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function FactureDetailModal({ factureId, onClose }: Props) {
  const { data, isLoading, isError } = useFactureDetail(factureId as string);
  const printFacture = usePrintFacture();

  if (!factureId) return null;

  async function handlePrint(format: "A5" | "THERMAL") {
    if (!factureId) return;
    try {
      // fix review
      await printFacture(factureId, format);
    } catch {
      toast.error("Impossible de générer le reçu.");
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Détail du reçu</h3>

          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="loading loading-spinner" />
          </div>
        )}

        {isError && (
          <p className="py-8 text-error">
            Impossible de charger le détail du reçu.
          </p>
        )}

        {data && (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-base-content/60">Numéro de reçu</p>
                <p className="font-semibold">{data.numeroRecu}</p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">Date</p>
                <p className="font-semibold">{formatDate(data.datePaiement)}</p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">Élève</p>
                <p className="font-semibold">
                  {data.eleve.nom} {data.eleve.prenom}
                </p>
                <p className="text-sm text-base-content/60">
                  Matricule : {data.eleve.matricule}
                </p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">Classe</p>
                <p className="font-semibold">
                  {data.eleve.classe?.nom ?? "Non renseignée"}
                </p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">Montant encaissé</p>
                <p className="font-semibold text-primary">
                  {formatMontant(data.montant)}
                </p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">Mode de paiement</p>
                <p className="font-semibold">{data.modePaiement}</p>
              </div>

              {data.referencePaiement && (
                <div>
                  <p className="text-sm text-base-content/60">Référence</p>
                  <p className="font-semibold">{data.referencePaiement}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-base-content/60">Agent encaisseur</p>
                <p className="font-semibold">
                  {data.agent.prenom} {data.agent.nom}
                </p>
              </div>
            </div>

            {data.remarque && (
              <div className="mt-4 rounded-lg border border-base-200 p-3">
                <p className="text-sm text-base-content/60">Remarque</p>
                <p>{data.remarque}</p>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-outline gap-2"
                onClick={() => void handlePrint("THERMAL")}
              >
                <Printer size={16} />
                Ticket 80 mm
              </button>

              <button
                type="button"
                className="btn btn-primary gap-2"
                onClick={() => void handlePrint("A5")}
              >
                <Printer size={16} />
                Imprimer A5
              </button>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Fermer"
      />
    </div>
  );
}
