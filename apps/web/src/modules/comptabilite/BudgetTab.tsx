import { useState } from "react";
import {
  PieChart,
  PlusIcon,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "elaboration" | "suivi" | "analyses" | "alertes";

function BudgetTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("elaboration");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <PieChart size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Budget & Prévisions</h2>
            <p className="text-sm text-base-content/60">
              Élaboration et suivi du budget annuel
            </p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-2">
          <PlusIcon size={16} />
          Nouveau budget
        </button>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "elaboration" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("elaboration")}
        >
          <FileText size={16} className="mr-2" />
          Élaboration budget
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "suivi" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("suivi")}
        >
          <TrendingUp size={16} className="mr-2" />
          Suivi & Exécution
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "analyses" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("analyses")}
        >
          <PieChart size={16} className="mr-2" />
          Analyses & Écarts
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "alertes" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("alertes")}
        >
          <AlertTriangle size={16} className="mr-2" />
          Alertes budgétaires
        </button>
      </div>

      {activeSubTab === "elaboration" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Élaboration du budget"
          description="Création du budget prévisionnel annuel par postes de recettes et dépenses."
        />
      )}

      {activeSubTab === "suivi" && (
        <DevelopmentPlaceholder
          icon={TrendingUp}
          title="Suivi de l'exécution budgétaire"
          description="Comparaison réalisé vs prévisionnel avec taux d'exécution par ligne."
        />
      )}

      {activeSubTab === "analyses" && (
        <DevelopmentPlaceholder
          icon={PieChart}
          title="Analyses & Écarts budgétaires"
          description="Analyse des écarts budgétaires avec graphiques et commentaires."
        />
      )}

      {activeSubTab === "alertes" && (
        <DevelopmentPlaceholder
          icon={AlertTriangle}
          title="Alertes & Dépassements"
          description="Notifications automatiques en cas de dépassement budgétaire."
        />
      )}
    </div>
  );
}

export default BudgetTab;
