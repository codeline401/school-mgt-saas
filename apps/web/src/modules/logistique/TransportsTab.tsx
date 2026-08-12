import { useState } from "react";
import { Bus, Users, Route as RouteIcon, UserCheck } from "lucide-react";
import VehiculesTab from "./components/VehiculesTab";
import ChauffeursTab from "./components/ChauffeurTab";
import RoutesTab from "./components/RoutesTab";
import AffectationsTab from "./components/AffectationTab";

type TabType = "vehicules" | "chauffeurs" | "routes" | "affectations";

export default function TransportTab() {
  const [activeTab, setActiveTab] = useState<TabType>("vehicules");

  return (
    <div className="space-y-6">
      {/* En-tête avec tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transport Scolaire</h2>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs tabs-boxed bg-base-200 p-1">
        <button
          className={`tab gap-2 ${activeTab === "vehicules" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("vehicules")}
        >
          <Bus size={18} />
          Véhicules
        </button>
        <button
          className={`tab gap-2 ${activeTab === "chauffeurs" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("chauffeurs")}
        >
          <Users size={18} />
          Chauffeurs
        </button>
        <button
          className={`tab gap-2 ${activeTab === "routes" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("routes")}
        >
          <RouteIcon size={18} />
          Routes
        </button>
        <button
          className={`tab gap-2 ${activeTab === "affectations" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("affectations")}
        >
          <UserCheck size={18} />
          Affectations
        </button>
      </div>

      {/* Contenu des tabs */}
      <div className="mt-6">
        {activeTab === "vehicules" && <VehiculesTab />}
        {activeTab === "chauffeurs" && <ChauffeursTab />}
        {activeTab === "routes" && <RoutesTab />}
        {activeTab === "affectations" && <AffectationsTab />}
      </div>
    </div>
  );
}
