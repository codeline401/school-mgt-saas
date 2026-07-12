import { useState } from "react";
import {
  Users,
  UserPlus,
  FileText,
  Clock,
  CalendarOff,
  Star,
  BookOpen,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab =
  | "fiches"
  | "contrats"
  | "temps-travail"
  | "conges-absences"
  | "evaluations"
  | "formations";

function PersonnelTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("fiches");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Gestion du Personnel</h2>
            <p className="text-sm text-base-content/60">
              Fichier employés, contrats et suivi administratif
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <FileText size={16} />
            Exporter
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <UserPlus size={16} />
            Nouvel employé
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "fiches" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("fiches")}
        >
          <Users size={16} className="mr-2" />
          Fiches employés
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "contrats" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("contrats")}
        >
          <FileText size={16} className="mr-2" />
          Contrats
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "temps-travail" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("temps-travail")}
        >
          <Clock size={16} className="mr-2" />
          Temps de travail & Plannings
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "conges-absences" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("conges-absences")}
        >
          <CalendarOff size={16} className="mr-2" />
          Congés & Absences
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "evaluations" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("evaluations")}
        >
          <Star size={16} className="mr-2" />
          Évaluations & Entretiens
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "formations" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("formations")}
        >
          <BookOpen size={16} className="mr-2" />
          Formations & Compétences
        </button>
      </div>

      {activeSubTab === "fiches" && (
        <DevelopmentPlaceholder
          icon={Users}
          title="Fiches employés"
          description="Liste complète du personnel avec informations personnelles, coordonnées et postes occupés."
        />
      )}

      {activeSubTab === "contrats" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Contrats de travail"
          description="Gestion des contrats CDI, CDD, avenants et renouvellements."
        />
      )}

      {activeSubTab === "temps-travail" && (
        <DevelopmentPlaceholder
          icon={Clock}
          title="Temps de travail & Plannings"
          description="Gestion des horaires, plannings, pointages et heures supplémentaires."
        />
      )}

      {activeSubTab === "conges-absences" && (
        <DevelopmentPlaceholder
          icon={CalendarOff}
          title="Congés & Absences"
          description="Suivi des congés payés, congés maladie, absences et soldes."
        />
      )}

      {activeSubTab === "evaluations" && (
        <DevelopmentPlaceholder
          icon={Star}
          title="Évaluations & Entretiens"
          description="Entretiens annuels, évaluations de performance et objectifs."
        />
      )}

      {activeSubTab === "formations" && (
        <DevelopmentPlaceholder
          icon={BookOpen}
          title="Formations & Compétences"
          description="Plan de formation, compétences acquises et développement professionnel."
        />
      )}
    </div>
  );
}

export default PersonnelTab;
