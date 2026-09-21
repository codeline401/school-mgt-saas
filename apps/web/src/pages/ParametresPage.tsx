import { useState } from "react";
import { Calendar, GraduationCap, Settings, Wallet } from "lucide-react";
import PeriodesTab from "../components/parametres/PeriodesTab";
import StructuresScolairesTab from "../components/parametres/StructuresScolairesTab";
import EcolageConfigTab from "../components/parametres/EcolageConfigTab";

const TABS = [
  { id: "periodes", label: "Périodes scolaires", icon: Calendar },
  {
    id: "structures",
    label: "Structures scolaires",
    icon: GraduationCap,
  },
  { id: "ecolage", label: "Écolage", icon: Wallet },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<TabId>("periodes");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={22} className="text-primary" />
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>

      <div role="tablist" className="tabs tabs-border flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`tab gap-1.5 ${activeTab === id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === "periodes" && <PeriodesTab />}
        {activeTab === "structures" && <StructuresScolairesTab />}
        {activeTab === "ecolage" && <EcolageConfigTab />}
      </div>
    </div>
  );
}
