import { useState } from "react";
import {
  Wrench,
  PlusIcon,
  AlertCircle,
  CheckCircle,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "tickets" | "interventions" | "statistiques";

/**
 * COMPOSANT MAINTENANCE TAB
 *
 * Gestion des tickets de maintenance et suivi des interventions
 */

function MaintenanceTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("tickets");

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
        <button className="btn btn-primary btn-sm gap-2">
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
      {activeSubTab === "tickets" && (
        <DevelopmentPlaceholder
          icon={AlertCircle}
          title="Tickets de maintenance"
          description="Gestion des demandes d'intervention avec priorités et statuts."
        />
      )}

      {activeSubTab === "interventions" && (
        <DevelopmentPlaceholder
          icon={CheckCircle}
          title="Suivi des interventions"
          description="Assignation, suivi et clôture des interventions de maintenance."
        />
      )}

      {activeSubTab === "statistiques" && (
        <DevelopmentPlaceholder
          icon={BarChart3}
          title="Rapports & Statistiques"
          description="Temps moyen de résolution, performance et analyse des pannes récurrentes."
        />
      )}
    </div>
  );
}

export default MaintenanceTab;
