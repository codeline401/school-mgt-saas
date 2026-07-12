import { useState } from "react";
import { Building2, Package, Monitor, Wrench } from "lucide-react";
import LocauxTab from "./LocauxTab";
import StocksTab from "./StocksTab";
import InventaireTab from "./InventaireTab";
import MaintenanceTab from "./MaintenanceTab";

type TabType = "locaux" | "stocks" | "inventaire" | "maintenance";

function LogistiquePage() {
  const [activeTab, setActiveTab] = useState<TabType>("locaux");

  return (
    <div className="container mx-auto px-4 py-6">
      {/* En-tête de la page */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion Logistique</h1>
        <p className="text-base-content/60">
          Gérez les locaux, stocks, inventaire et maintenance de votre
          établissement
        </p>
      </div>

      {/* Navigation par onglets (Tabs) avec DaisyUI */}
      <div role="tablist" className="tabs tabs-boxed bg-base-200 mb-6">
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "locaux" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("locaux")}
        >
          <Building2 size={18} />
          Locaux
        </button>

        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "stocks" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("stocks")}
        >
          <Package size={18} />
          Stocks
        </button>

        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "inventaire" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("inventaire")}
        >
          <Monitor size={18} />
          Inventaire
        </button>

        <button
          role="tab"
          className={`tab gap-2 ${activeTab === "maintenance" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("maintenance")}
        >
          <Wrench size={18} />
          Maintenance
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === "locaux" && <LocauxTab />}
        {activeTab === "stocks" && <StocksTab />}
        {activeTab === "inventaire" && <InventaireTab />}
        {activeTab === "maintenance" && <MaintenanceTab />}
      </div>
    </div>
  );
}

export default LogistiquePage;
