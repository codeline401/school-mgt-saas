import { useState } from "react";
import { TrendingUp, PlusIcon, Users, CheckCircle, Clock } from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "attribution" | "suivi" | "demandes";

function BoursesTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("attribution");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Bourses & Aides financières</h2>
            <p className="text-sm text-base-content/60">
              Attribution et gestion des bourses scolaires
            </p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-2">
          <PlusIcon size={16} />
          Nouvelle bourse
        </button>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "attribution" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("attribution")}
        >
          <Users size={16} className="mr-2" />
          Bourses attribuées
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "suivi" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("suivi")}
        >
          <CheckCircle size={16} className="mr-2" />
          Suivi & Paiements
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "demandes" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("demandes")}
        >
          <Clock size={16} className="mr-2" />
          Demandes en cours
        </button>
      </div>

      {activeSubTab === "attribution" && (
        <DevelopmentPlaceholder
          icon={Users}
          title="Bourses attribuées"
          description="Liste des élèves bénéficiaires avec types et montants de bourses."
        />
      )}

      {activeSubTab === "suivi" && (
        <DevelopmentPlaceholder
          icon={CheckCircle}
          title="Suivi & Versements"
          description="Calendrier des versements et suivi des décaissements de bourses."
        />
      )}

      {activeSubTab === "demandes" && (
        <DevelopmentPlaceholder
          icon={Clock}
          title="Demandes en attente"
          description="Traitement des nouvelles demandes de bourses et aides sociales."
        />
      )}
    </div>
  );
}

export default BoursesTab;
