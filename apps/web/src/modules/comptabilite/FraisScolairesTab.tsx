import { useState } from "react";
import {
  CreditCard,
  PlusIcon,
  Search,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "liste" | "paiements" | "impayés" | "reçus";

function FraisScolairesTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("liste");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <CreditCard size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Frais scolaires & Écolage</h2>
            <p className="text-sm text-base-content/60">
              Gestion des frais d'inscription et écolage mensuel
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <Search size={16} />
            Rechercher
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Enregistrer paiement
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "liste" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("liste")}
        >
          Liste des élèves
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "paiements" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("paiements")}
        >
          <CheckCircle size={16} className="mr-2" />
          Paiements reçus
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "impayés" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("impayés")}
        >
          <AlertCircle size={16} className="mr-2" />
          Impayés & Retards
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "reçus" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("reçus")}
        >
          <Download size={16} className="mr-2" />
          Reçus & Factures
        </button>
      </div>

      {activeSubTab === "liste" && (
        <DevelopmentPlaceholder
          icon={CreditCard}
          title="Liste des élèves et frais"
          description="Vue d'ensemble des frais scolaires par élève avec statut de paiement."
        />
      )}

      {activeSubTab === "paiements" && (
        <DevelopmentPlaceholder
          icon={CheckCircle}
          title="Paiements reçus"
          description="Historique complet des paiements effectués avec modes de règlement."
        />
      )}

      {activeSubTab === "impayés" && (
        <DevelopmentPlaceholder
          icon={AlertCircle}
          title="Impayés & Retards"
          description="Suivi des impayés, relances automatiques et gestion des échéances."
        />
      )}

      {activeSubTab === "reçus" && (
        <DevelopmentPlaceholder
          icon={Download}
          title="Reçus & Factures"
          description="Génération et téléchargement des reçus de paiement et factures."
        />
      )}
    </div>
  );
}

export default FraisScolairesTab;
