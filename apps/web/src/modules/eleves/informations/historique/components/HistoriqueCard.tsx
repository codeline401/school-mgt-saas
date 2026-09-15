import {
  BookOpen,
  CalendarClock,
  FileText,
  GraduationCap,
  Wallet,
} from "lucide-react";
import { useHistoriqueEleve } from "../hooks/useHistoriqueEleve";
import { HistoriqueSkeleton } from "./HistoriqueSkeleton";

type HistoriqueCardProps = {
  eleveId?: string;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Affiche le parcours académique complet d'un élève sélectionné.
 */
export function HistoriqueCard({ eleveId }: HistoriqueCardProps) {
  const { data, isLoading, isError } = useHistoriqueEleve(eleveId);

  if (isLoading) {
    return <HistoriqueSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="card border border-error/30 bg-base-100 shadow-sm">
        <div className="card-body">
          <p className="text-error">
            Impossible de charger l'historique de cet élève.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" />
            Parcours académique
          </h2>

          {data.academicHistory.length === 0 ? (
            <p className="text-sm text-base-content/60">
              Aucune inscription enregistrée.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.academicHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-base-200 p-3"
                >
                  <p className="font-medium">
                    {entry.anneeScolaire} —{" "}
                    {entry.classe?.nom ?? "Classe inconnue"}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {entry.statut ?? "Statut non renseigné"} · Inscrit le{" "}
                    {formatDate(entry.dateInscription)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base flex items-center gap-2">
            <CalendarClock size={18} className="text-primary" />
            Changements de classe
          </h2>

          {data.classChanges.length === 0 ? (
            <p className="text-sm text-base-content/60">
              Aucun changement de classe enregistré.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.classChanges.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-base-200 p-3"
                >
                  <p className="font-medium">
                    {entry.ancienneClasse?.nom ?? "—"} →{" "}
                    {entry.nouvelleClasse?.nom ?? "—"}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {entry.type} · {entry.anneeScolaire} ·{" "}
                    {formatDate(entry.changedAt)}
                  </p>
                  {entry.motif && (
                    <p className="text-sm text-base-content/60">
                      Motif : {entry.motif}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            Historique administratif
          </h2>

          {data.administrativeEvents.length === 0 ? (
            <p className="text-sm text-base-content/60">
              Aucun événement administratif enregistré.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.administrativeEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-base-200 p-3"
                >
                  <p className="font-medium">{event.description}</p>
                  <p className="text-sm text-base-content/60">
                    {formatDate(event.date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base flex items-center gap-2">
            <Wallet size={18} className="text-primary" />
            Historique des paiements
          </h2>

          {data.paymentHistory.length === 0 ? (
            <p className="text-sm text-base-content/60">
              Aucun paiement enregistré.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.paymentHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-base-200 p-3"
                >
                  <p className="font-medium">
                    {entry.anneeScolaire} · Mois {entry.mois}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {entry.montant} · {entry.classe?.nom ?? "Classe inconnue"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            Dates clés
          </h2>

          <p className="text-sm text-base-content/60">
            Créée le {formatDate(data.keyDates.firstCreatedAt)} · Dernière mise
            à jour le {formatDate(data.keyDates.lastUpdatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
