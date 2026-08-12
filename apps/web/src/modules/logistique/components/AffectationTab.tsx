import { useState } from "react";
import { Plus, Edit2, Trash2, UserCheck, Search } from "lucide-react";
import {
  useAffectations,
  useDeleteAffectation,
  useRoutes,
  type AffectationTransport,
  type StatutAffectation,
  type Route,
} from "../hooks/useTransport";
import AffectationModal from "./AffectationModal";
import ConfirmModal from "../../../components/ConfirmModal";

const STATUT_LABELS: Record<
  StatutAffectation,
  { label: string; color: string }
> = {
  ACTIVE: { label: "Active", color: "badge-success" },
  SUSPENDUE: { label: "Suspendue", color: "badge-warning" },
  TERMINEE: { label: "Terminée", color: "badge-ghost" },
};

export default function AffectationsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [affectationToEdit, setAffectationToEdit] =
    useState<AffectationTransport | null>(null);
  const [affectationToDelete, setAffectationToDelete] =
    useState<AffectationTransport | null>(null);
  const [routeFilter, setRouteFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutAffectation | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  const filters: Record<string, string> = {};
  if (routeFilter) filters.routeId = routeFilter;
  if (statutFilter) filters.statut = statutFilter;

  const { data: affectations = [], isLoading } = useAffectations(
    Object.keys(filters).length > 0 ? filters : undefined,
  );
  const { data: routes = [] } = useRoutes({ statut: "ACTIVE" });
  const deleteMutation = useDeleteAffectation();

  const handleCreate = () => {
    setAffectationToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (affectation: AffectationTransport) => {
    setAffectationToEdit(affectation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setAffectationToEdit(null);
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!affectationToDelete) return;

    try {
      await deleteMutation.mutateAsync(affectationToDelete.id);
      setAffectationToDelete(null);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  // Filtrer par recherche
  const filteredAffectations = affectations.filter(
    (affectation: AffectationTransport) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        affectation.eleve.nom.toLowerCase().includes(query) ||
        affectation.eleve.prenom.toLowerCase().includes(query) ||
        affectation.route.nom.toLowerCase().includes(query)
      );
    },
  );

  return (
    <div className="space-y-4">
      {/* En-tête avec filtres et bouton d'ajout */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Recherche */}
          <div className="form-control">
            <div className="input-group input-group-sm">
              <span>
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Rechercher un élève..."
                className="input input-bordered input-sm w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filtre par route */}
          <select
            className="select select-bordered select-sm"
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
          >
            <option value="">Toutes les routes</option>
            {routes.map((route: Route) => (
              <option key={route.id} value={route.id}>
                {route.nom}
              </option>
            ))}
          </select>

          {/* Filtre par statut */}
          <select
            className="select select-bordered select-sm"
            value={statutFilter}
            onChange={(e) =>
              setStatutFilter(e.target.value as StatutAffectation | "")
            }
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDUE">Suspendue</option>
            <option value="TERMINEE">Terminée</option>
          </select>
        </div>

        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
          <Plus size={18} />
          Nouvelle affectation
        </button>
      </div>

      {/* Tableau des affectations */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Classe</th>
                  <th>Route</th>
                  <th>Type</th>
                  <th>Arrêts</th>
                  <th>Statut</th>
                  <th>Période</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <span className="loading loading-spinner loading-md" />
                    </td>
                  </tr>
                ) : filteredAffectations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <UserCheck
                        size={48}
                        className="mx-auto mb-3 text-base-content/30"
                      />
                      <p className="text-base-content/50">
                        {searchQuery || routeFilter || statutFilter
                          ? "Aucune affectation trouvée"
                          : "Aucune affectation enregistrée"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAffectations.map(
                    (affectation: AffectationTransport) => (
                      <tr key={affectation.id}>
                        <td>
                          <div className="font-medium">
                            {affectation.eleve.nom} {affectation.eleve.prenom}
                          </div>
                        </td>
                        <td>
                          {affectation.eleve.classe?.nom || (
                            <span className="text-base-content/40">-</span>
                          )}
                        </td>
                        <td>
                          <div className="font-medium">
                            {affectation.route.nom}
                          </div>
                          <div className="text-xs text-base-content/60">
                            {affectation.route.vehicule.nom}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-sm badge-outline">
                            {affectation.route.typeRoute === "ALLER"
                              ? "Aller"
                              : affectation.route.typeRoute === "RETOUR"
                                ? "Retour"
                                : "Aller-Retour"}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm">
                            {affectation.arretMontee && (
                              <div>↑ {affectation.arretMontee}</div>
                            )}
                            {affectation.arretDescente && (
                              <div>↓ {affectation.arretDescente}</div>
                            )}
                            {!affectation.arretMontee &&
                              !affectation.arretDescente && (
                                <span className="text-base-content/40">-</span>
                              )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${STATUT_LABELS[affectation.statut].color}`}
                          >
                            {STATUT_LABELS[affectation.statut].label}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs">
                            Du{" "}
                            {new Date(affectation.dateDebut).toLocaleDateString(
                              "fr-FR",
                            )}
                            {affectation.dateFin && (
                              <>
                                <br />
                                Au{" "}
                                {new Date(
                                  affectation.dateFin,
                                ).toLocaleDateString("fr-FR")}
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(affectation)}
                              className="btn btn-ghost btn-xs"
                              title="Modifier"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() =>
                                setAffectationToDelete(affectation)
                              }
                              className="btn btn-ghost btn-xs text-error"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <AffectationModal
          affectation={affectationToEdit}
          onClose={handleCloseModal}
        />
      )}

      {affectationToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer l'affectation"
          message={`Êtes-vous sûr de vouloir supprimer l'affectation de ${affectationToDelete.eleve.nom} ${affectationToDelete.eleve.prenom} ?`}
          onConfirm={handleDelete}
          onCancel={() => setAffectationToDelete(null)}
          confirmLabel="Supprimer"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
