import { CheckCircle2, AlertTriangle, Wallet2, Siren } from "lucide-react";
import {
  useEcolagesEleve,
  calculerStatutFinancier,
} from "../hooks/usePaiementEcolage";

type StatutFinancierCardProps = {
  eleveId: string;
};

function formatMontant(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0,
  }).format(value);
}

/** Carte récapitulative de la situation financière (écolage) d'un élève. */
export function StatutFinancierCard({ eleveId }: StatutFinancierCardProps) {
  const { data: ecolages, isLoading, isError } = useEcolagesEleve(eleveId);

  if (isLoading) {
    return (
      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body">
          <span className="loading loading-spinner loading-sm" />
        </div>
      </div>
    );
  }

  if (isError || !ecolages) {
    return (
      <div className="card border border-error/30 bg-base-100 shadow-sm">
        <div className="card-body">
          <p className="text-error">
            Impossible de charger la situation financière.
          </p>
        </div>
      </div>
    );
  }

  const { moisPayes, moisEnRetard, resteAPayer, penalitesCumulees } =
    calculerStatutFinancier(ecolages);

  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-base">Situation financière</h2>

        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-3">
            <CheckCircle2 size={20} className="text-success" />
            <div>
              <p className="text-sm text-base-content/60">Mois payés</p>
              <p className="font-semibold">{moisPayes}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-error/20 bg-error/5 p-3">
            <AlertTriangle size={20} className="text-error" />
            <div>
              <p className="text-sm text-base-content/60">Mois en retard</p>
              <p className="font-semibold">{moisEnRetard}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
            <Wallet2 size={20} className="text-warning" />
            <div>
              <p className="text-sm text-base-content/60">Reste à payer</p>
              <p className="font-semibold">{formatMontant(resteAPayer)}</p>
            </div>
          </div>
        </div>

        {/* N'apparaît que si la classe a une pénalité de retard configurée (> 0) et effectivement due. */}
        {penalitesCumulees > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-error/30 bg-error/10 p-3">
            <Siren size={20} className="text-error" />
            <div>
              <p className="text-sm text-base-content/60">
                Pénalités de retard cumulées
              </p>
              <p className="font-semibold text-error">
                {formatMontant(penalitesCumulees)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
