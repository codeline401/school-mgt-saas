import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  PlusIcon,
  Users,
  DollarSign,
  FileText,
  Calendar,
  Award,
  UserCheck,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab =
  | "personnel"
  | "paie"
  | "conges"
  | "contrats"
  | "formations"
  | "evaluations";

const PATH_TO_TAB: Record<string, SubTab> = {
  "/rh/personnel": "personnel",
  "/rh/paie": "paie",
  "/rh/conges": "conges",
  "/rh/contrats": "contrats",
  "/rh/formations": "formations",
  "/rh/evaluations": "evaluations",
};

/**
 * COMPOSANT RESSOURCES HUMAINES
 *
 * Gestion du personnel (Madagascar)
 */

function RessourcesHumainesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(
    PATH_TO_TAB[location.pathname] || "personnel",
  );

  useEffect(() => {
    const tab = PATH_TO_TAB[location.pathname];
    if (tab) setActiveSubTab(tab);
  }, [location.pathname]);

  const handleTabChange = (tab: SubTab) => {
    const path = Object.keys(PATH_TO_TAB).find(
      (key) => PATH_TO_TAB[key] === tab,
    );
    if (path) navigate(path);
  };

  return (
    <div>
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Briefcase size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Ressources Humaines</h2>
            <p className="text-sm text-base-content/60">
              Gestion du personnel enseignant et administratif
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <FileText size={16} />
            Bulletins de paie
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Nouveau employé
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "personnel" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("personnel")}
        >
          <Users size={16} className="mr-2" />
          Gestion du personnel
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "paie" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("paie")}
        >
          <DollarSign size={16} className="mr-2" />
          Paie & Cotisations
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "conges" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("conges")}
        >
          <Calendar size={16} className="mr-2" />
          Congés & Absences
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "contrats" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("contrats")}
        >
          <FileText size={16} className="mr-2" />
          Contrats & Dossiers
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "formations" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("formations")}
        >
          <Award size={16} className="mr-2" />
          Formations continues
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "evaluations" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("evaluations")}
        >
          <UserCheck size={16} className="mr-2" />
          Évaluations
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "personnel" && (
        <DevelopmentPlaceholder
          icon={Users}
          title="Gestion du personnel"
          description="Fichier du personnel avec informations personnelles, postes et historiques."
        />
      )}

      {activeSubTab === "paie" && (
        <DevelopmentPlaceholder
          icon={DollarSign}
          title="Paie & Cotisations sociales (CNaPS, OSTIE)"
          description="Traitement de la paie, cotisations CNaPS/OSTIE et déclarations sociales."
        />
      )}

      {activeSubTab === "conges" && (
        <DevelopmentPlaceholder
          icon={Calendar}
          title="Congés & Absences"
          description="Gestion des demandes de congés, absences, RTT et planning des remplacements."
        />
      )}

      {activeSubTab === "contrats" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Contrats & Dossiers administratifs"
          description="Contrats de travail (CDI, CDD, vacataires), avenants et dossiers du personnel."
        />
      )}

      {activeSubTab === "formations" && (
        <DevelopmentPlaceholder
          icon={Award}
          title="Formations continues"
          description="Plan de formation, sessions organisées, certifications et développement des compétences."
        />
      )}

      {activeSubTab === "evaluations" && (
        <DevelopmentPlaceholder
          icon={UserCheck}
          title="Évaluations & Performances"
          description="Entretiens annuels, évaluations de performance et plans d'amélioration."
        />
      )}
    </div>
  );
}

export default RessourcesHumainesPage;
