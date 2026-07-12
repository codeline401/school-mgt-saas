import { useState } from "react";
import {
  UserCheck,
  Calendar,
  Target,
  ClipboardCheck,
  History,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "entretiens" | "objectifs" | "grilles" | "historique";

function EvaluationsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("entretiens");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <UserCheck size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Évaluations & Entretiens</h2>
            <p className="text-sm text-base-content/60">
              Entretiens annuels et évaluation des performances
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <History size={16} />
            Historique
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <Calendar size={16} />
            Planifier entretien
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "entretiens" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("entretiens")}
        >
          <Calendar size={16} className="mr-2" />
          Entretiens annuels
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "objectifs" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("objectifs")}
        >
          <Target size={16} className="mr-2" />
          Objectifs
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "grilles" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("grilles")}
        >
          <ClipboardCheck size={16} className="mr-2" />
          Grilles d'évaluation
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "historique" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("historique")}
        >
          <History size={16} className="mr-2" />
          Historique
        </button>
      </div>

      {activeSubTab === "entretiens" && (
        <DevelopmentPlaceholder
          icon={Calendar}
          title="Entretiens annuels"
          description="Planification et suivi des entretiens individuels d'évaluation."
        />
      )}

      {activeSubTab === "objectifs" && (
        <DevelopmentPlaceholder
          icon={Target}
          title="Objectifs individuels"
          description="Définition, suivi et atteinte des objectifs par employé."
        />
      )}

      {activeSubTab === "grilles" && (
        <DevelopmentPlaceholder
          icon={ClipboardCheck}
          title="Grilles d'évaluation"
          description="Modèles de grilles d'évaluation par poste et compétences."
        />
      )}

      {activeSubTab === "historique" && (
        <DevelopmentPlaceholder
          icon={History}
          title="Historique des évaluations"
          description="Archive des évaluations précédentes et évolution des performances."
        />
      )}
    </div>
  );
}

export default EvaluationsTab;
