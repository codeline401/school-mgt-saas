import { useState } from "react";
import { Plus, Edit2, Trash2, Users, Phone } from "lucide-react";
import {
  useChauffeurs,
  useDeleteChauffeur,
  type Chauffeur,
  type StatutChauffeur,
} from "../hooks/useTransport";
import ChauffeurModal from "./ChauffeurModal";
import ConfirmModal from "../../../components/ConfirmModal";

const STATUT_LABELS: Record<StatutChauffeur, { label: string; color: string }> =
  {
    ACTIF: { label: "Actif", color: "badge-success" },
    CONGE: { label: "En congé", color: "badge-info" },
    SUSPENDU: { label: "Suspendu", color: "badge-warning" },
    INACTIF: { label: "Inactif", color: "badge-ghost" },
  };

export default function ChauffeursTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chauffeurToEdit, setChauffeurToEdit] = useState<Chauffeur | null>(
    null,
  );
  const [chauffeurToDelete, setChauffeurToDelete] = useState<Chauffeur | null>(
    null,
  );
  const [statutFilter, setStatutFilter] = useState<StatutChauffeur | "">("");

  const { data: chauffeurs = [], isLoading } = useChauffeurs(
    statutFilter ? { statut: statutFilter } : undefined,
  );
  const deleteMutation = useDeleteChauffeur();

  const handleCreate = () => {
    setChauffeurToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (chauffeur: Chauffeur) => {
    setChauffeurToEdit(chauffeur);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setChauffeurToEdit(null);
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!chauffeurToDelete) return;

    try {
      await deleteMutation.mutateAsync(chauffeurToDelete.id);
      setChauffeurToDelete(null);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Erreur lors de la suppression");
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
              setStatutFilter(e.target.value as StatutChauffeur | "")
            }
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="CONGE">En congé</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="INACTIF">Inactif</option>
          </select>
        </div>

        <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
          <Plus size={18} />
          Nouveau chauffeur
        </button>
      </div>

      {/* Tableau des chauffeurs */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Chauffeur</th>
                  <th>Téléphone</th>
                  <th>Permis</th>
                  <th>Expiration</th>
                  <th>Statut</th>
                  <th>Routes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <span className="loading loading-spinner loading-md" />
                    </td>
                  </tr>
                ) : chauffeurs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <Users
                        size={48}
                        className="mx-auto mb-3 text-base-content/30"
                      />
                      <p className="text-base-content/50">
                        Aucun chauffeur enregistré
                      </p>
                    </td>
                  </tr>
                ) : (
                  chauffeurs.map((chauffeur: Chauffeur) => (
                    <tr key={chauffeur.id}>
                      <td>
                        <div className="font-medium">
                          {chauffeur.nom} {chauffeur.prenom}
                        </div>
                        {chauffeur.adresse && (
                          <div className="text-xs text-base-content/60">
                            {chauffeur.adresse}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          {chauffeur.telephone}
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="badge badge-outline">
                            {chauffeur.typePermis}
                          </span>
                        </div>
                        <div className="text-xs text-base-content/60 mt-1">
                          {chauffeur.numeroPermis}
                        </div>
                      </td>
                      <td>
                        {chauffeur.dateExpirationPermis ? (
                          <div className="text-sm">
                            {new Date(
                              chauffeur.dateExpirationPermis,
                            ).toLocaleDateString("fr-FR")}
                          </div>
                        ) : (
                          <span className="text-base-content/40">-</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge badge-sm ${STATUT_LABELS[chauffeur.statut].color}`}
                        >
                          {STATUT_LABELS[chauffeur.statut].label}
                        </span>
                      </td>
                      <td>{chauffeur._count?.routes || 0} route(s)</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(chauffeur)}
                            className="btn btn-ghost btn-xs"
                            title="Modifier"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setChauffeurToDelete(chauffeur)}
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
        <ChauffeurModal
          chauffeur={chauffeurToEdit}
          onClose={handleCloseModal}
        />
      )}

      {chauffeurToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer le chauffeur"
          message={`Êtes-vous sûr de vouloir supprimer le chauffeur "${chauffeurToDelete.nom} ${chauffeurToDelete.prenom}" ?`}
          onConfirm={handleDelete}
          onCancel={() => setChauffeurToDelete(null)}
          confirmLabel="Supprimer"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
