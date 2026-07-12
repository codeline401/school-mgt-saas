import { useState } from "react";
import {
  Banknote,
  PlusIcon,
  TrendingUp,
  TrendingDown,
  Building2,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "tableau" | "banque" | "encaissements" | "decaissements";

function TresorerieTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("tableau");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Banknote size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Trésorerie & Banque</h2>
            <p className="text-sm text-base-content/60">
              Gestion des flux de trésorerie et rapprochements
            </p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-2">
          <PlusIcon size={16} />
          Nouvelle opération
        </button>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "tableau" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("tableau")}
        >
          <Banknote size={16} className="mr-2" />
          Tableau de bord
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "banque" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("banque")}
        >
          <Building2 size={16} className="mr-2" />
          Comptes bancaires
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "encaissements" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("encaissements")}
        >
          <TrendingUp size={16} className="mr-2" />
          Encaissements
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "decaissements" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("decaissements")}
        >
          <TrendingDown size={16} className="mr-2" />
          Décaissements
        </button>
      </div>

      {activeSubTab === "tableau" && (
        <DevelopmentPlaceholder
          icon={Banknote}
          title="Tableau de bord trésorerie"
          description="Vision en temps réel de la position de trésorerie et des prévisions."
        />
      )}

      {activeSubTab === "banque" && (
        <DevelopmentPlaceholder
          icon={Building2}
          title="Comptes bancaires & Rapprochements"
          description="Gestion des comptes bancaires et rapprochements mensuels."
        />
      )}

      {activeSubTab === "encaissements" && (
        <DevelopmentPlaceholder
          icon={TrendingUp}
          title="Encaissements & Recettes"
          description="Suivi des encaissements par mode de paiement (espèces, chèques, virements)."
        />
      )}

      {activeSubTab === "decaissements" && (
        <DevelopmentPlaceholder
          icon={TrendingDown}
          title="Décaissements & Dépenses"
          description="Gestion des dépenses, ordres de paiement et justificatifs."
        />
      )}
    </div>
  );
}

export default TresorerieTab;
