import { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  CalendarClock,
  History,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "demandes" | "planning" | "historique" | "soldes";

function CongesTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("demandes");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Congés & Absences</h2>
            <p className="text-sm text-base-content/60">
              Gestion des demandes de congés et suivi des absences
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <CalendarClock size={16} />
            Voir planning
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <CheckCircle size={16} />
            Valider demandes
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "demandes" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("demandes")}
        >
          <Clock size={16} className="mr-2" />
          Demandes en attente
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "planning" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("planning")}
        >
          <CalendarClock size={16} className="mr-2" />
          Planning des congés
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "historique" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("historique")}
        >
          <History size={16} className="mr-2" />
          Historique
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "soldes" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("soldes")}
        >
          <Calendar size={16} className="mr-2" />
          Soldes de congés
        </button>
      </div>

      {activeSubTab === "demandes" && (
        <DevelopmentPlaceholder
          icon={Clock}
          title="Demandes en attente"
          description="Liste des demandes de congés à valider par type (payés, maladie, sans solde)."
        />
      )}

      {activeSubTab === "planning" && (
        <DevelopmentPlaceholder
          icon={CalendarClock}
          title="Planning des congés"
          description="Calendrier visuel des congés validés et prévisions d'absence."
        />
      )}

      {activeSubTab === "historique" && (
        <DevelopmentPlaceholder
          icon={History}
          title="Historique des congés"
          description="Historique complet des congés et absences par employé."
        />
      )}

      {activeSubTab === "soldes" && (
        <DevelopmentPlaceholder
          icon={Calendar}
          title="Soldes de congés"
          description="Compteurs de jours de congés acquis et restants par employé."
        />
      )}
    </div>
  );
}

export default CongesTab;
