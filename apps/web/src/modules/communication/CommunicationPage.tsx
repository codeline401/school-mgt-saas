import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Bell,
  Mail,
  MessageCircle,
  Calendar,
  FileText,
  Send,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab =
  | "messagerie"
  | "notifications"
  | "sms"
  | "reunions"
  | "documents"
  | "circulaires";

const PATH_TO_TAB: Record<string, SubTab> = {
  "/communication/messagerie": "messagerie",
  "/communication/notifications": "notifications",
  "/communication/sms": "sms",
  "/communication/reunions": "reunions",
  "/communication/documents": "documents",
  "/communication/circulaires": "circulaires",
};

/**
 * COMPOSANT COMMUNICATION
 *
 * Système de communication de l'établissement
 */

function CommunicationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(
    PATH_TO_TAB[location.pathname] || "messagerie",
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
          <MessageSquare size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Communication</h2>
            <p className="text-sm text-base-content/60">
              Messagerie, notifications et communication interne/externe
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <Bell size={16} />
            Créer annonce
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <Send size={16} />
            Nouveau message
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "messagerie" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("messagerie")}
        >
          <Mail size={16} className="mr-2" />
          Messagerie interne
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "notifications" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("notifications")}
        >
          <Bell size={16} className="mr-2" />
          Notifications & Annonces
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "sms" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("sms")}
        >
          <MessageCircle size={16} className="mr-2" />
          SMS aux parents
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "reunions" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("reunions")}
        >
          <Calendar size={16} className="mr-2" />
          Réunions & Événements
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "documents" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("documents")}
        >
          <FileText size={16} className="mr-2" />
          Documents partagés
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "circulaires" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("circulaires")}
        >
          <FileText size={16} className="mr-2" />
          Circulaires officielles
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "messagerie" && (
        <DevelopmentPlaceholder
          icon={Mail}
          title="Messagerie interne"
          description="Messagerie entre personnel, enseignants, administration et parents d'élèves."
        />
      )}

      {activeSubTab === "notifications" && (
        <DevelopmentPlaceholder
          icon={Bell}
          title="Notifications & Annonces"
          description="Système de notifications push et annonces générales pour tous les utilisateurs."
        />
      )}

      {activeSubTab === "sms" && (
        <DevelopmentPlaceholder
          icon={MessageCircle}
          title="SMS aux parents"
          description="Envoi de SMS groupés ou individuels aux parents (absences, retards, événements)."
        />
      )}

      {activeSubTab === "reunions" && (
        <DevelopmentPlaceholder
          icon={Calendar}
          title="Réunions & Événements"
          description="Planification de réunions, événements scolaires avec convocations et comptes-rendus."
        />
      )}

      {activeSubTab === "documents" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Documents partagés"
          description="Bibliothèque de documents partagés avec le personnel et les parents (règlements, formulaires)."
        />
      )}

      {activeSubTab === "circulaires" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Circulaires officielles"
          description="Publication et archivage des circulaires officielles du Ministère et de la Direction."
        />
      )}
    </div>
  );
}

export default CommunicationPage;
