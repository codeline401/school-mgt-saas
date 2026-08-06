import { useState } from "react";
import {
  Wrench,
  PlusIcon,
  CheckCircle,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import TicketsMaintenanceTab from "./components/TicketMaintenanceTab";
import TicketMaintenanceModal from "./components/TicketMaintenanceModal";
import InterventionsTab from "./components/InterventionTab";
import StatistiquesMaintenanceTab from "./components/StatistiquesMaintenanceTab";

type SubTab = "tickets" | "interventions" | "statistiques";

/**
 * COMPOSANT MAINTENANCE TAB
 *
 * Gestion des tickets de maintenance et suivi des interventions
 */

function MaintenanceTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("tickets");
  const [isTicketMaintenanceModal, setIsTicketMaintenanceModal] =
    useState(false);

  /**
   * Ouvre le modal de création de ticket de maintenance
   */
  const handleOpenTicketMaintenanceModal = () => {
    setIsTicketMaintenanceModal(true);
  };

  /**
   * Ferme ne modal de création de ticket de maintenance
   */
  const handleCloseTicketMaintenanceModal = () => {
    setIsTicketMaintenanceModal(false);
  };

  return (
    <div>
      {/* En-tête de l'onglet */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Wrench size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Gestion de la Maintenance</h2>
            <p className="text-sm text-base-content/60">
              Tickets de pannes et suivi des interventions
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={handleOpenTicketMaintenanceModal}
        >
          <PlusIcon size={16} />
          Créer un ticket
        </button>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "tickets" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("tickets")}
        >
          <ClipboardList size={16} className="mr-2" />
          Tickets de maintenance
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "interventions" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("interventions")}
        >
          <CheckCircle size={16} className="mr-2" />
          Suivi des interventions
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "statistiques" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("statistiques")}
        >
          <BarChart3 size={16} className="mr-2" />
          Rapports & Statistiques
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "tickets" && <TicketsMaintenanceTab />}

      {activeSubTab === "interventions" && <InterventionsTab />}

      {activeSubTab === "statistiques" && <StatistiquesMaintenanceTab />}

      {isTicketMaintenanceModal && (
        <TicketMaintenanceModal
          ticket={null}
          onClose={handleCloseTicketMaintenanceModal}
        />
      )}
    </div>
  );
}

export default MaintenanceTab;
