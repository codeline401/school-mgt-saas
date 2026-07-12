import { useState } from "react";
import { Award, BookOpen, Users, BarChart3, DollarSign } from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "catalogue" | "inscriptions" | "suivi" | "budget";

function FormationsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("catalogue");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Award size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Formations Continues</h2>
            <p className="text-sm text-base-content/60">
              Plan de formation et développement des compétences
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <BarChart3 size={16} />
            Statistiques
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <BookOpen size={16} />
            Nouvelle formation
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "catalogue" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("catalogue")}
        >
          <BookOpen size={16} className="mr-2" />
          Catalogue formations
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "inscriptions" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("inscriptions")}
        >
          <Users size={16} className="mr-2" />
          Inscriptions
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "suivi" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("suivi")}
        >
          <BarChart3 size={16} className="mr-2" />
          Suivi & Évaluations
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "budget" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("budget")}
        >
          <DollarSign size={16} className="mr-2" />
          Budget formation
        </button>
      </div>

      {activeSubTab === "catalogue" && (
        <DevelopmentPlaceholder
          icon={BookOpen}
          title="Catalogue des formations"
          description="Catalogue des formations disponibles (internes et externes) avec objectifs et prérequis."
        />
      )}

      {activeSubTab === "inscriptions" && (
        <DevelopmentPlaceholder
          icon={Users}
          title="Inscriptions aux formations"
          description="Gestion des inscriptions, convocations et présences."
        />
      )}

      {activeSubTab === "suivi" && (
        <DevelopmentPlaceholder
          icon={BarChart3}
          title="Suivi & Évaluations"
          description="Évaluation des formations, satisfaction et acquisition de compétences."
        />
      )}

      {activeSubTab === "budget" && (
        <DevelopmentPlaceholder
          icon={DollarSign}
          title="Budget formation"
          description="Budget alloué, dépenses et plan de formation pluriannuel."
        />
      )}
    </div>
  );
}

export default FormationsTab;
