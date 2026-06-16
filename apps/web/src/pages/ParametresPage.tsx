import { useState } from "react";
import { Calendar, Settings } from "lucide-react";
import PeriodesTab from "../components/parametres/PeriodesTab";

const TABS = [
  { id: "periodes", label: "Périodes scolaires", icon: Calendar },
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

      <div role="tabpanel">{activeTab === "periodes" && <PeriodesTab />}</div>
    </div>
  );
}
