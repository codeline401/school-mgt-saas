import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Calendar,
} from "lucide-react";
import { useStatistiquesMaintenance } from "../hooks/useMaintenance";

const TYPE_LABELS: Record<string, string> = {
  EQUIPEMENT: "Équipement",
  BATIMENT: "Bâtiment",
  SALLE: "Salle",
  RESEAU: "Réseau",
  PLOMBERIE: "Plomberie",
  ELECTRICITE: "Électricité",
  MOBILIER: "Mobilier",
  AUTRE: "Autre",
};

const PRIORITE_LABELS: Record<string, string> = {
  BASSE: "Basse",
  NORMALE: "Normale",
  HAUTE: "Haute",
  URGENTE: "Urgente",
};

const PRIORITE_COLORS: Record<string, string> = {
  BASSE: "bg-info",
  NORMALE: "bg-success",
  HAUTE: "bg-warning",
  URGENTE: "bg-error",
};

export default function StatistiquesMaintenanceTab() {
  const { data: stats, isLoading } = useStatistiquesMaintenance();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="alert alert-warning">
        <AlertTriangle size={20} />
        <span>Impossible de charger les statistiques</span>
      </div>
    );
  }

  // Calculer le taux de résolution
  const tauxResolution =
    stats.totalTickets > 0
      ? ((stats.ticketsResolus / stats.totalTickets) * 100).toFixed(1)
      : "0";

  // Calculer le pourcentage d'interventions terminées
  const totalInterventions =
    stats.interventionsEnCours + stats.interventionsTerminees;
  const tauxInterventionsTerminees =
    totalInterventions > 0
      ? ((stats.interventionsTerminees / totalInterventions) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Vue d'ensemble
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total tickets */}
          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-primary">
                <AlertTriangle size={32} />
              </div>
              <div className="stat-title">Total tickets</div>
              <div className="stat-value text-primary">
                {stats.totalTickets}
              </div>
              <div className="stat-desc">Depuis le début</div>
            </div>
          </div>

          {/* Tickets ouverts */}
          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-error">
                <AlertTriangle size={32} />
              </div>
              <div className="stat-title">Tickets ouverts</div>
              <div className="stat-value text-error">
                {stats.ticketsOuverts}
              </div>
              <div className="stat-desc">En attente d'intervention</div>
            </div>
          </div>

          {/* Tickets en cours */}
          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-warning">
                <Clock size={32} />
              </div>
              <div className="stat-title">En cours</div>
              <div className="stat-value text-warning">
                {stats.ticketsEnCours}
              </div>
              <div className="stat-desc">Intervention en cours</div>
            </div>
          </div>

          {/* Tickets résolus */}
          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-success">
                <CheckCircle2 size={32} />
              </div>
              <div className="stat-title">Résolus</div>
              <div className="stat-value text-success">
                {stats.ticketsResolus}
              </div>
              <div className="stat-desc">{tauxResolution}% de résolution</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interventions */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Wrench size={20} />
          Interventions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total interventions */}
          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-info">
                <Wrench size={32} />
              </div>
              <div className="stat-title">Total interventions</div>
              <div className="stat-value text-info">{totalInterventions}</div>
              <div className="stat-desc">Depuis le début</div>
            </div>
          </div>

          {/* Interventions en cours */}
          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-warning">
                <Clock size={32} />
              </div>
              <div className="stat-title">En cours</div>
              <div className="stat-value text-warning">
                {stats.interventionsEnCours}
              </div>
              <div className="stat-desc">Interventions actives</div>
            </div>
          </div>

          {/* Interventions terminées */}
          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-success">
                <CheckCircle2 size={32} />
              </div>
              <div className="stat-title">Terminées</div>
              <div className="stat-value text-success">
                {stats.interventionsTerminees}
              </div>
              <div className="stat-desc">
                {tauxInterventionsTerminees}% complétées
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance et coûts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temps moyen de résolution */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-base flex items-center gap-2">
              <Calendar size={18} />
              Performance
            </h3>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {stats.tempsMoyenResolution.toFixed(1)}
                </p>
                <p className="text-sm text-base-content/60">jours en moyenne</p>
              </div>
              <div
                className="radial-progress text-primary"
                style={
                  {
                    "--value": Math.min(
                      (7 / stats.tempsMoyenResolution) * 100,
                      100,
                    ),
                  } as React.CSSProperties
                }
              >
                {stats.tempsMoyenResolution < 7 ? "Rapide" : "Lent"}
              </div>
            </div>
            <p className="text-xs text-base-content/50 mt-2">
              Temps moyen entre l'ouverture et la résolution d'un ticket
            </p>
          </div>
        </div>

        {/* Coût total */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-base flex items-center gap-2">
              <DollarSign size={18} />
              Coûts
            </h3>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-3xl font-bold text-accent">
                  {new Intl.NumberFormat("fr-MG", {
                    style: "currency",
                    currency: "MGA",
                  }).format(Number(stats.coutTotal) || 0)}
                </p>
                <p className="text-sm text-base-content/60">
                  Coût total des interventions
                </p>
              </div>
              <TrendingUp size={48} className="text-accent opacity-20" />
            </div>
            <p className="text-xs text-base-content/50 mt-2">
              Somme des coûts de toutes les interventions
            </p>
          </div>
        </div>
      </div>

      {/* Répartition par priorité */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h3 className="card-title text-base mb-4">
            Répartition par priorité
          </h3>
          <div className="space-y-3">
            {stats.ticketsParPriorite.length === 0 ? (
              <p className="text-center text-base-content/50 py-4">
                Aucune donnée disponible
              </p>
            ) : (
              stats.ticketsParPriorite.map((item) => {
                const percentage =
                  stats.totalTickets > 0
                    ? (item.count / stats.totalTickets) * 100
                    : 0;

                return (
                  <div key={item.priorite}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">
                        {PRIORITE_LABELS[item.priorite]}
                      </span>
                      <span className="text-sm text-base-content/60">
                        {item.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${PRIORITE_COLORS[item.priorite]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Répartition par type */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h3 className="card-title text-base mb-4">Répartition par type</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Type</th>
                  <th className="text-right">Nombre</th>
                  <th className="text-right">Pourcentage</th>
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {stats.ticketsParType.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      <span className="text-base-content/50">
                        Aucune donnée disponible
                      </span>
                    </td>
                  </tr>
                ) : (
                  [...stats.ticketsParType]
                    .sort((a, b) => b.count - a.count)
                    .map((item) => {
                      const percentage =
                        stats.totalTickets > 0
                          ? (item.count / stats.totalTickets) * 100
                          : 0;

                      return (
                        <tr key={item.type}>
                          <td className="font-medium">
                            {TYPE_LABELS[item.type]}
                          </td>
                          <td className="text-right">{item.count}</td>
                          <td className="text-right">
                            {percentage.toFixed(1)}%
                          </td>
                          <td>
                            <div className="w-full bg-base-300 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Indicateurs de performance */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h3 className="card-title text-base mb-4">
            Indicateurs de performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Taux de résolution</div>
              <div className="stat-value text-2xl">{tauxResolution}%</div>
              <div className="stat-desc">
                {stats.ticketsResolus} / {stats.totalTickets} tickets
              </div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Tickets actifs</div>
              <div className="stat-value text-2xl">
                {stats.ticketsOuverts + stats.ticketsEnCours}
              </div>
              <div className="stat-desc">
                Ouverts: {stats.ticketsOuverts} | En cours:{" "}
                {stats.ticketsEnCours}
              </div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">Coût moyen</div>
              <div className="stat-value text-2xl">
                {totalInterventions > 0
                  ? new Intl.NumberFormat("fr-MG", {
                      style: "currency",
                      currency: "MGA",
                      maximumFractionDigits: 0,
                    }).format(Number(stats.coutTotal) / totalInterventions || 0)
                  : "0 Ar"}
              </div>
              <div className="stat-desc">Par intervention</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
