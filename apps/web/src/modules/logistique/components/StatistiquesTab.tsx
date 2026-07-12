import { Building2, DoorOpen, Users, PieChart } from "lucide-react";
import { useStatistiques } from "../hooks/useLocaux";

export default function StatistiquesTab() {
  const { data: stats, isLoading } = useStatistiques();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nombre de bâtiments */}
        <div className="stats shadow-sm bg-base-100">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Building2 size={32} />
            </div>
            <div className="stat-title">Bâtiments</div>
            <div className="stat-value text-primary">
              {stats.nombreBatiments}
            </div>
            <div className="stat-desc">Total des bâtiments</div>
          </div>
        </div>

        {/* Nombre de salles */}
        <div className="stats shadow-sm bg-base-100">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <DoorOpen size={32} />
            </div>
            <div className="stat-title">Salles</div>
            <div className="stat-value text-secondary">{stats.nombreSalles}</div>
            <div className="stat-desc">Total des salles</div>
          </div>
        </div>

        {/* Capacité totale */}
        <div className="stats shadow-sm bg-base-100">
          <div className="stat">
            <div className="stat-figure text-accent">
              <Users size={32} />
            </div>
            <div className="stat-title">Capacité totale</div>
            <div className="stat-value text-accent">
              {stats.capaciteTotale}
            </div>
            <div className="stat-desc">Places disponibles</div>
          </div>
        </div>
      </div>

      {/* Répartition par type et statut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition par type */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={20} className="text-primary" />
              <h3 className="card-title text-base">Répartition par type</h3>
            </div>

            <div className="space-y-3">
              {stats.sallesParType.map((item) => {
                const percentage = Math.round(
                  (item.nombre / stats.nombreSalles) * 100,
                );
                return (
                  <div key={item.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-base-content/70">
                        {item.type.replace("_", " ")}
                      </span>
                      <span className="font-semibold">
                        {item.nombre} ({percentage}%)
                      </span>
                    </div>
                    <progress
                      className="progress progress-primary w-full"
                      value={item.nombre}
                      max={stats.nombreSalles}
                    ></progress>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={20} className="text-secondary" />
              <h3 className="card-title text-base">Répartition par statut</h3>
            </div>

            <div className="space-y-3">
              {stats.sallesParStatut.map((item) => {
                const percentage = Math.round(
                  (item.nombre / stats.nombreSalles) * 100,
                );
                const progressClass =
                  item.statut === "DISPONIBLE"
                    ? "progress-success"
                    : item.statut === "MAINTENANCE"
                      ? "progress-error"
                      : "progress-warning";

                return (
                  <div key={item.statut}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-base-content/70">
                        {item.statut === "DISPONIBLE"
                          ? "Disponible"
                          : item.statut === "MAINTENANCE"
                            ? "En maintenance"
                            : "Réservée"}
                      </span>
                      <span className="font-semibold">
                        {item.nombre} ({percentage}%)
                      </span>
                    </div>
                    <progress
                      className={`progress ${progressClass} w-full`}
                      value={item.nombre}
                      max={stats.nombreSalles}
                    ></progress>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="alert bg-base-200">
        <div>
          <div className="font-semibold mb-1">Résumé global</div>
          <div className="text-sm text-base-content/70">
            Votre établissement dispose de <strong>{stats.nombreBatiments}</strong>{" "}
            bâtiment{stats.nombreBatiments > 1 ? "s" : ""} contenant un total de{" "}
            <strong>{stats.nombreSalles}</strong> salle
            {stats.nombreSalles > 1 ? "s" : ""}, pour une capacité d'accueil totale
            de <strong>{stats.capaciteTotale}</strong> personnes.
          </div>
        </div>
      </div>
    </div>
  );
}
