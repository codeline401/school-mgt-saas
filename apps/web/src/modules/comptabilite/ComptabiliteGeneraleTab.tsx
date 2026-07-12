import { useState } from "react";
import {
  FileText,
  PlusIcon,
  BookOpen,
  FileBarChart,
  Calculator,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "plan" | "journal" | "grandlivre" | "etats";

function ComptabiliteGeneraleTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("plan");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Comptabilité générale</h2>
            <p className="text-sm text-base-content/60">
              Plan comptable SYSCOHADA et états financiers
            </p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-2">
          <PlusIcon size={16} />
          Nouvelle écriture
        </button>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "plan" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("plan")}
        >
          <Calculator size={16} className="mr-2" />
          Plan comptable
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "journal" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("journal")}
        >
          <BookOpen size={16} className="mr-2" />
          Journal des écritures
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "grandlivre" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("grandlivre")}
        >
          <FileText size={16} className="mr-2" />
          Grand livre
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "etats" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("etats")}
        >
          <FileBarChart size={16} className="mr-2" />
          États financiers
        </button>
      </div>

      {activeSubTab === "plan" && (
        <DevelopmentPlaceholder
          icon={Calculator}
          title="Plan comptable SYSCOHADA"
          description="Plan de comptes conforme au référentiel SYSCOHADA pour Madagascar."
        />
      )}

      {activeSubTab === "journal" && (
        <DevelopmentPlaceholder
          icon={BookOpen}
          title="Journal des écritures comptables"
          description="Saisie et consultation du journal général et journaux auxiliaires."
        />
      )}

      {activeSubTab === "grandlivre" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Grand livre des comptes"
          description="Consultation du grand livre avec soldes et mouvements par compte."
        />
      )}

      {activeSubTab === "etats" && (
        <DevelopmentPlaceholder
          icon={FileBarChart}
          title="États financiers"
          description="Bilan, compte de résultat, annexes et tableau de flux de trésorerie."
        />
      )}
    </div>
  );
}

export default ComptabiliteGeneraleTab;
