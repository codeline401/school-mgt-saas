import { useState } from "react";
import {
  Package,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  DollarSign,
} from "lucide-react";
import {
  useEquipements,
  useStatistiquesEquipements,
  useDeleteEquipement,
  type Equipement,
} from "../hooks/useEquipements";
import ConfirmModal from "../../../components/ConfirmModal";
import EquipementModal from "./EquipementModal";
import PretModal from "./PretModal";

/**
 * COMPOSANT EQUIPEMENTS TAB
 *
 * Liste des équipements de l'école
 */
function EquipementsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipement, setSelectedEquipement] =
    useState<Equipement | null>(null);
  const [isEquipementModalOpen, setIsEquipementModalOpen] = useState(false);
  const [isPretModalOpen, setIsPretModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [equipementToDelete, setEquipementToDelete] = useState<{
    id: string;
    nom: string;
  } | null>(null);

  // ─── Queries ──────────────────────────────────────────────
  const { data: equipements = [], isLoading, error } = useEquipements();
  const { data: stats } = useStatistiquesEquipements();

  // ─── Mutations ────────────────────────────────────────────
  const deleteMutation = useDeleteEquipement();

  // ─── Filtrage ─────────────────────────────────────────────
  const filteredEquipements = equipements.filter((eq) =>
    eq.nom.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ─── Handlers ─────────────────────────────────────────────
  const handleEdit = (equipement: Equipement) => {
    setSelectedEquipement(equipement);
    setIsEquipementModalOpen(true);
  };

  const handleCloseEquipementModal = () => {
    setSelectedEquipement(null);
    setIsEquipementModalOpen(false);
  };

  const handleDeleteClick = (equipementId: string, equipementNom: string) => {
    setEquipementToDelete({ id: equipementId, nom: equipementNom });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (equipementToDelete) {
      await deleteMutation.mutateAsync(equipementToDelete.id);
      setIsConfirmModalOpen(false);
      setEquipementToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setEquipementToDelete(null);
  };

  const handlePret = (equipement: Equipement) => {
    setSelectedEquipement(equipement);
    setIsPretModalOpen(true);
  };

  const handleClosePretModal = () => {
    setSelectedEquipement(null);
    setIsPretModalOpen(false);
  };

  // ─── Utilitaires ──────────────────────────────────────────
  const getCategorieLabel = (categorie: string) => {
    const labels: Record<string, string> = {
      AUDIOVISUEL: "Audiovisuel",
      INFORMATIQUE: "Informatique",
      SPORT: "Sport",
      LABORATOIRE: "Laboratoire",
      MOBILIER: "Mobilier",
      OUTILLAGE: "Outillage",
      AUTRE: "Autre",
    };
    return labels[categorie] || categorie;
  };

  const getEtatBadge = (etat: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      NEUF: { class: "badge-success", label: "Neuf" },
      BON: { class: "badge-info", label: "Bon état" },
      MOYEN: { class: "badge-warning", label: "État moyen" },
      MAUVAIS: { class: "badge-error", label: "Mauvais état" },
      HORS_SERVICE: { class: "badge-error", label: "Hors service" },
    };
    return badges[etat] || { class: "badge-ghost", label: etat };
  };

  const formatValeur = (valeur: number | null) => {
    if (valeur === null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(valeur);
  };

  // ─── Rendu ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="alert alert-error">
        <AlertTriangle size={20} />
        <span>Erreur lors du chargement des équipements</span>
      </div>
    );
  }

  return (
    <div>
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-primary">
            <Package size={32} />
          </div>
          <div className="stat-title">Total équipements</div>
          <div className="stat-value text-primary">
            {stats?.totalEquipement || equipements.length}
          </div>
          <div className="stat-desc">Dans l'inventaire</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-success">
            <CheckCircle size={32} />
          </div>
          <div className="stat-title">Disponibles</div>
          <div className="stat-value text-success">
            {stats?.equipementsDisponibles || 0}
          </div>
          <div className="stat-desc">Prêts à utiliser</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-warning">
            <Calendar size={32} />
          </div>
          <div className="stat-title">En cours</div>
          <div className="stat-value text-warning">
            {stats?.pretsEnCours || 0}
          </div>
          <div className="stat-desc">Prêts actifs</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-error">
            <XCircle size={32} />
          </div>
          <div className="stat-title">Hors service</div>
          <div className="stat-value text-error">
            {stats?.equipementHS || 0}
          </div>
          <div className="stat-desc">À réparer</div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-4 mb-6">
        <div className="form-control flex-1">
          <div className="input-group">
            <span className="bg-base-200">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Rechercher un équipement..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="text-sm text-base-content/60">
          {filteredEquipements.length} équipement(s)
        </div>
      </div>

      {/* Tableau des équipements */}
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Équipement</th>
              <th>Catégorie</th>
              <th>État</th>
              <th>Statut</th>
              <th>Emplacement</th>
              <th>Valeur</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </td>
              </tr>
            ) : filteredEquipements.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-base-content/60"
                >
                  {searchTerm
                    ? "Aucun équipement ne correspond à votre recherche"
                    : "Aucun équipement dans l'inventaire"}
                </td>
              </tr>
            ) : (
              filteredEquipements.map((equipement) => {
                const etatBadge = getEtatBadge(equipement.etat);

                return (
                  <tr key={equipement.id}>
                    <td>
                      <div>
                        <div className="font-semibold">{equipement.nom}</div>
                        {equipement.reference && (
                          <div className="text-xs text-base-content/60">
                            Réf: {equipement.reference}
                          </div>
                        )}
                        {equipement.numeroSerie && (
                          <div className="text-xs text-base-content/60">
                            N°: {equipement.numeroSerie}
                          </div>
                        )}
                        {equipement.description && (
                          <div className="text-xs text-base-content/60 mt-1">
                            {equipement.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline badge-sm">
                        {getCategorieLabel(equipement.categorie)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${etatBadge.class} badge-sm`}>
                        {etatBadge.label}
                      </span>
                    </td>
                    <td>
                      {equipement.disponible ? (
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle size={16} />
                          <span className="text-sm font-semibold">
                            Disponible
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1 text-warning">
                            <Calendar size={16} />
                            <span className="text-sm font-semibold">
                              En prêt
                            </span>
                          </div>
                          {equipement.pretEnCours && (
                            <div className="text-xs text-base-content/60 mt-1">
                              {equipement.pretEnCours.emprunteurNom}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {equipement.emplacement ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin size={14} className="text-base-content/60" />
                          {equipement.emplacement}
                        </div>
                      ) : (
                        <span className="text-base-content/40">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign
                          size={14}
                          className="text-base-content/60"
                        />
                        {formatValeur(equipement.valeur)}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {equipement.disponible &&
                          equipement.etat !== "HORS_SERVICE" && (
                            <button
                              onClick={() => handlePret(equipement)}
                              className="btn btn-success btn-xs"
                              title="Prêter"
                            >
                              Prêter
                            </button>
                          )}
                        <button
                          onClick={() => handleEdit(equipement)}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteClick(equipement.id, equipement.nom)
                          }
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'équipement */}
      {isEquipementModalOpen && (
        <EquipementModal
          equipement={selectedEquipement}
          onClose={handleCloseEquipementModal}
        />
      )}

      {/* Modal de prêt */}
      {isPretModalOpen && selectedEquipement && (
        <PretModal
          equipement={selectedEquipement}
          onClose={handleClosePretModal}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Supprimer l'équipement"
        message={`Êtes-vous sûr de vouloir supprimer l'équipement "${equipementToDelete?.nom}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default EquipementsTab;
