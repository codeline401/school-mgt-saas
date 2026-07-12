import { useState } from "react";
import {
  DollarSign,
  PlusIcon,
  Coins,
  Shield,
  FileText,
  Receipt,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "salaires" | "cnaPS" | "ostie" | "bulletins" | "declarations";

function PaieTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("salaires");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <DollarSign size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Paie & Cotisations Sociales</h2>
            <p className="text-sm text-base-content/60">
              Gestion de la paie et cotisations CNaPS/OSTIE (Madagascar)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <FileText size={16} />
            Générer bulletins
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Nouvelle paie
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "salaires" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("salaires")}
        >
          <DollarSign size={16} className="mr-2" />
          Salaires & Primes
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "cnaPS" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("cnaPS")}
        >
          <Shield size={16} className="mr-2" />
          CNaPS
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "ostie" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("ostie")}
        >
          <Shield size={16} className="mr-2" />
          OSTIE
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "bulletins" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("bulletins")}
        >
          <Receipt size={16} className="mr-2" />
          Bulletins de paie
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "declarations" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("declarations")}
        >
          <FileText size={16} className="mr-2" />
          Déclarations fiscales
        </button>
      </div>

      {activeSubTab === "salaires" && (
        <DevelopmentPlaceholder
          icon={Coins}
          title="Salaires & Primes"
          description="Gestion des salaires de base, primes, indemnités et avantages en nature."
        />
      )}

      {activeSubTab === "cnaPS" && (
        <DevelopmentPlaceholder
          icon={Shield}
          title="Cotisations CNaPS"
          description="Caisse Nationale de Prévoyance Sociale - Calcul et déclarations."
        />
      )}

      {activeSubTab === "ostie" && (
        <DevelopmentPlaceholder
          icon={Shield}
          title="Cotisations OSTIE"
          description="Office Sanitaire Tananarivien Inter-Entreprises - Cotisations santé."
        />
      )}

      {activeSubTab === "bulletins" && (
        <DevelopmentPlaceholder
          icon={Receipt}
          title="Bulletins de paie"
          description="Génération et consultation des bulletins de salaire mensuels."
        />
      )}

      {activeSubTab === "declarations" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Déclarations fiscales"
          description="IRSA, télédéclarations et obligations fiscales."
        />
      )}
    </div>
  );
}

export default PaieTab;
