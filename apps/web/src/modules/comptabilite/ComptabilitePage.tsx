import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Wallet,
  PlusIcon,
  CreditCard,
  TrendingUp,
  FileText,
  PieChart,
  Banknote,
} from "lucide-react";
import FraisScolairesTab from "./FraisScolairesTab";
import BoursesTab from "./BoursesTab";
import ComptabiliteGeneraleTab from "./ComptabiliteGeneraleTab";
import TresorerieTab from "./TresorerieTab";
import BudgetTab from "./BudgetTab";

type SubTab = "frais" | "bourses" | "generale" | "tresorerie" | "budget";

const PATH_TO_TAB: Record<string, SubTab> = {
  "/comptabilite/frais-scolaires": "frais",
  "/comptabilite/bourses": "bourses",
  "/comptabilite/generale": "generale",
  "/comptabilite/tresorerie": "tresorerie",
  "/comptabilite/budget": "budget",
};

/**
 * COMPOSANT COMPTABILITÉ & FINANCE
 *
 * Gestion financière et comptable (Madagascar)
 */
function ComptabilitePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(
    PATH_TO_TAB[location.pathname] || "frais",
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
          <Wallet size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Comptabilité & Finance</h2>
            <p className="text-sm text-base-content/60">
              Gestion financière et comptable de l'établissement
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <FileText size={16} />
            Rapport mensuel
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Nouvelle transaction
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "frais" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("frais")}
        >
          <CreditCard size={16} className="mr-2" />
          Frais scolaires
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "bourses" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("bourses")}
        >
          <TrendingUp size={16} className="mr-2" />
          Bourses & Aides
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "generale" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("generale")}
        >
          <FileText size={16} className="mr-2" />
          Comptabilité générale
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "tresorerie" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("tresorerie")}
        >
          <Banknote size={16} className="mr-2" />
          Trésorerie
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "budget" ? "tab-active" : ""}`}
          onClick={() => handleTabChange("budget")}
        >
          <PieChart size={16} className="mr-2" />
          Budget
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "frais" && <FraisScolairesTab />}
      {activeSubTab === "bourses" && <BoursesTab />}
      {activeSubTab === "generale" && <ComptabiliteGeneraleTab />}
      {activeSubTab === "tresorerie" && <TresorerieTab />}
      {activeSubTab === "budget" && <BudgetTab />}
    </div>
  );
}

export default ComptabilitePage;
