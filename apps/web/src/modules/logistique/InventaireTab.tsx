import { useState } from "react";
import { Package, PlusIcon, ClipboardList, History } from "lucide-react";
import EquipementsTab from "./components/EquipementTab";
import PretsTab from "./components/PretsTab";
import EquipementModal from "./components/EquipementModal";

type SubTab = "equipements" | "prets";

/**
 * COMPOSANT INVENTAIRE TAB
 *
 * Gestion de l'inventaire des équipements
 */
function InventaireTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("equipements");
  const [isEquipementModalOpen, setIsEquipementModalOpen] = useState(false);

  /**
   * Ouvre le modal pour créer un nouvel équipement
   */
  const handleOpenEquipementModal = () => {
    setIsEquipementModalOpen(true);
  };

  /**
   * Ferme le modal d'équipement
   */
  const handleCloseEquipementModal = () => {
    setIsEquipementModalOpen(false);
  };

  return (
    <div>
      {/* En-tête de l'onglet */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Package size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Inventaire des Équipements</h2>
            <p className="text-sm text-base-content/60">
              Gestion des équipements prêtables et historique des prêts
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenEquipementModal}
            className="btn btn-primary btn-sm gap-2"
          >
            <PlusIcon size={16} />
            Nouvel équipement
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "equipements" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("equipements")}
        >
          <ClipboardList size={16} className="mr-2" />
          Liste des équipements
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "prets" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("prets")}
        >
          <History size={16} className="mr-2" />
          Historique des prêts
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "equipements" && <EquipementsTab />}

      {activeSubTab === "prets" && <PretsTab />}

      {/* Modal pour création/modification d'équipement */}
      {isEquipementModalOpen && (
        <EquipementModal
          equipement={null}
          onClose={handleCloseEquipementModal}
        />
      )}
    </div>
  );
}

export default InventaireTab;
