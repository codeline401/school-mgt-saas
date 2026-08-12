import { useState } from "react";
import { Plus, Edit2, Trash2, Bus } from "lucide-react";
import {
  useVehicules,
  useDeleteVehicule,
  type Vehicule,
  type StatutVehicule,
  type TypeVehicule,
} from "../hooks/useTransport";
import VehiculeModal from "./VehiculesModal";
import ConfirmModal from "../../../components/ConfirmModal";

const STATUT_LABELS: Record<StatutVehicule, { label: string; color: string }> =
  {
    ACTIF: { label: "Actif", color: "badge-success" },
    MAINTENANCE: { label: "En maintenance", color: "badge-warning" },
    HORS_SERVICE: { label: "Hors service", color: "badge-error" },
    VENDU: { label: "Vendu", color: "badge-ghost" },
  };

const TYPE_LABELS: Record<TypeVehicule, string> = {
  BUS: "Bus",
  MINIBUS: "Minibus",
  VOITURE: "Voiture",
  VAN: "Van",
};

export default function VehiculesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehiculeToEdit, setVehiculeToEdit] = useState<Vehicule | null>(null);
  const [vehiculeToDelete, setVehiculeToDelete] = useState<Vehicule | null>(
    null,
  );
  const [statutFilter, setStatutFilter] = useState<StatutVehicule | "">("");

  const { data: vehicules = [], isLoading } = useVehicules(
    statutFilter ? { statut: statutFilter } : undefined,
  );
  const deleteMutation = useDeleteVehicule();

  const handleCreate = () => {
    setVehiculeToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vehicule: Vehicule) => {
    setVehiculeToEdit(vehicule);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setVehiculeToEdit(null);
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!vehiculeToDelete) return;

    try {
      await deleteMutation.mutateAsync(vehiculeToDelete.id);
      setVehiculeToDelete(null);
    } catch (error) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      alert(
        err.message ||
          err.response?.data?.message ||
          "Erreur lors de la suppression",
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec filtres et bouton d'ajout */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            className="select select-bordered select-sm"
            value={statutFilter}
            onChange={(e) =>
              setStatutFilter(e.target.value as StatutVehicule | "")
            }
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="MAINTENANCE">En maintenance</option>
            <option value="HORS_SERVICE">Hors service</option>
            <option value="VENDU">Vendu</option>
          </select>
        </div>

        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
          <Plus size={18} />
          Nouveau véhicule
        </button>
      </div>

      {/* Tableau des véhicules */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Type</th>
                  <th>Plaque</th>
                  <th>Capacité</th>
                  <th>Statut</th>
                  <th>Routes</th>
                  <th>Révision</th>
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
                ) : vehicules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <Bus
                        size={48}
                        className="mx-auto mb-3 text-base-content/30"
                      />
                      <p className="text-base-content/50">
                        Aucun véhicule enregistré
                      </p>
                    </td>
                  </tr>
                ) : (
                  vehicules.map((vehicule) => (
                    <tr key={vehicule.id}>
                      <td>
                        <div className="font-medium">{vehicule.nom}</div>
                        {vehicule.marque && vehicule.modele && (
                          <div className="text-xs text-base-content/60">
                            {vehicule.marque} {vehicule.modele}
                            {vehicule.annee && ` (${vehicule.annee})`}
                          </div>
                        )}
                      </td>
                      <td>{TYPE_LABELS[vehicule.typeVehicule]}</td>
                      <td>
                        <span className="badge badge-outline">
                          {vehicule.immatriculation}
                        </span>
                      </td>
                      <td>{vehicule.capacite} places</td>
                      <td>
                        <span
                          className={`badge badge-sm ${STATUT_LABELS[vehicule.statut].color}`}
                        >
                          {STATUT_LABELS[vehicule.statut].label}
                        </span>
                      </td>
                      <td>{vehicule._count?.routes || 0} route(s)</td>
                      <td>
                        {vehicule.prochaineRevision ? (
                          <div className="text-sm">
                            {new Date(
                              vehicule.prochaineRevision,
                            ).toLocaleDateString("fr-FR")}
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(vehicule)}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setVehiculeToDelete(vehicule)}
                            className="btn btn-ghost btn-xs text-error"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <VehiculeModal vehicule={vehiculeToEdit} onClose={handleCloseModal} />
      )}

      {vehiculeToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer le véhicule"
          message={`Êtes-vous sûr de vouloir supprimer le véhicule "${vehiculeToDelete.nom}" ?`}
          onConfirm={handleDelete}
          onCancel={() => setVehiculeToDelete(null)}
          confirmLabel="Supprimer"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
