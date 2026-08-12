import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Route as RouteIcon,
  Clock,
  Users,
} from "lucide-react";
import {
  useRoutes,
  useDeleteRoute,
  type Route,
  type StatutRoute,
  type TypeRoute,
} from "../hooks/useTransport";
import RouteModal from "./RoutesModal";
import ConfirmModal from "../../../components/ConfirmModal";

const STATUT_LABELS: Record<StatutRoute, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "badge-success" },
  SUSPENDUE: { label: "Suspendue", color: "badge-warning" },
  ANNULEE: { label: "Annulée", color: "badge-error" },
};

const TYPE_LABELS: Record<TypeRoute, string> = {
  ALLER: "Aller",
  RETOUR: "Retour",
  ALLER_RETOUR: "Aller-Retour",
  SORTIE: "Sortie",
};

export default function RoutesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [statutFilter, setStatutFilter] = useState<StatutRoute | "">("");
  const [typeFilter, setTypeFilter] = useState<TypeRoute | "">("");

  const filters: Record<string, string> = {};
  if (statutFilter) filters.statut = statutFilter;
  if (typeFilter) filters.typeRoute = typeFilter;

  const { data: routes = [], isLoading } = useRoutes(
    Object.keys(filters).length > 0 ? filters : undefined,
  );
  const deleteMutation = useDeleteRoute();

  const handleCreate = () => {
    setRouteToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (route: Route) => {
    setRouteToEdit(route);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setRouteToEdit(null);
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!routeToDelete) return;

    try {
      await deleteMutation.mutateAsync(routeToDelete.id);
      setRouteToDelete(null);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return time;
    }
  };

  const parseJoursActifs = (joursActifs: string) => {
    try {
      const jours = JSON.parse(joursActifs);
      return Array.isArray(jours) ? jours.join(", ") : joursActifs;
    } catch {
      return joursActifs;
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec filtres et bouton d'ajout */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="select select-bordered select-sm"
            value={statutFilter}
            onChange={(e) =>
              setStatutFilter(e.target.value as StatutRoute | "")
            }
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDUE">Suspendue</option>
            <option value="ANNULEE">Annulée</option>
          </select>

          <select
            className="select select-bordered select-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeRoute | "")}
          >
            <option value="">Tous les types</option>
            <option value="ALLER">Aller</option>
            <option value="RETOUR">Retour</option>
            <option value="ALLER_RETOUR">Aller-Retour</option>
            <option value="SORTIE">Sortie</option>
          </select>
        </div>

        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
          <Plus size={18} />
          Nouvelle route
        </button>
      </div>

      {/* Liste des routes */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : routes.length === 0 ? (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body text-center py-12">
              <RouteIcon
                size={48}
                className="mx-auto mb-3 text-base-content/30"
              />
              <p className="text-base-content/50">Aucune route enregistrée</p>
            </div>
          </div>
        ) : (
          routes.map((route: Route) => (
            <div
              key={route.id}
              className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow"
            >
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* En-tête de la route */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{route.nom}</h3>
                      <span className="badge badge-primary">
                        {TYPE_LABELS[route.typeRoute]}
                      </span>
                      <span
                        className={`badge ${STATUT_LABELS[route.statut].color}`}
                      >
                        {STATUT_LABELS[route.statut].label}
                      </span>
                    </div>

                    {/* Informations du véhicule et chauffeur */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-start gap-2">
                        <RouteIcon size={16} className="mt-1 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            {route.vehicule.nom}
                          </div>
                          <div className="text-xs text-base-content/60">
                            {route.vehicule.immatriculation} •{" "}
                            {route.vehicule.capacite} places
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Users size={16} className="mt-1 text-secondary" />
                        <div>
                          <div className="text-sm font-medium">
                            {route.chauffeur.nom} {route.chauffeur.prenom}
                          </div>
                          <div className="text-xs text-base-content/60">
                            {route.chauffeur.telephone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horaires et jours */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span className="font-medium">Départ:</span>
                        <span>{formatTime(route.heureDepart)}</span>
                      </div>
                      {route.heureArrivee && (
                        <>
                          <span>→</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Arrivée:</span>
                            <span>{formatTime(route.heureArrivee)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="text-xs text-base-content/60 mt-2">
                      Jours: {parseJoursActifs(route.joursActifs)}
                    </div>

                    {/* Affectations */}
                    <div className="mt-3">
                      <div className="badge badge-outline gap-1">
                        <Users size={12} />
                        {route._count?.affectations || 0} élève(s) affecté(s)
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(route)}
                      className="btn btn-ghost btn-sm btn-square"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setRouteToDelete(route)}
                      className="btn btn-ghost btn-sm btn-square text-error"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <RouteModal route={routeToEdit} onClose={handleCloseModal} />
      )}

      {routeToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer la route"
          message={`Êtes-vous sûr de vouloir supprimer la route "${routeToDelete.nom}" ?`}
          onConfirm={handleDelete}
          onCancel={() => setRouteToDelete(null)}
          confirmLabel="Supprimer"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
