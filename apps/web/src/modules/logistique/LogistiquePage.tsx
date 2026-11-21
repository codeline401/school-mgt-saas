import { useRef, useState, type KeyboardEvent } from "react";
import { Building2, Package, Monitor, Wrench, Utensils } from "lucide-react";
import LocauxTab from "./LocauxTab";
import StocksTab from "./StocksTab";
import InventaireTab from "./InventaireTab";
import MaintenanceTab from "./MaintenanceTab";
import CantineTab from "./CantineTab";

type TabType = "locaux" | "stocks" | "inventaire" | "maintenance" | "cantine";

const TABS: {
  id: TabType;
  label: string;
  Icon: typeof Building2;
}[] = [
  { id: "locaux", label: "Locaux", Icon: Building2 },
  { id: "stocks", label: "Stocks", Icon: Package },
  { id: "inventaire", label: "Inventaire", Icon: Monitor },
  { id: "maintenance", label: "Maintenance", Icon: Wrench },
  { id: "cantine", label: "Cantine", Icon: Utensils },
];

function LogistiquePage() {
  const [activeTab, setActiveTab] = useState<TabType>("locaux");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectAndFocusTab = (index: number) => {
    const normalizedIndex = (index + TABS.length) % TABS.length;
    const nextTab = TABS[normalizedIndex];
    setActiveTab(nextTab.id);
    tabRefs.current[normalizedIndex]?.focus();
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        selectAndFocusTab(index + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        selectAndFocusTab(index - 1);
        break;
      case "Home":
        e.preventDefault();
        selectAndFocusTab(0);
        break;
      case "End":
        e.preventDefault();
        selectAndFocusTab(TABS.length - 1);
        break;
    }
  };

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
      <div
        role="tablist"
        aria-label="Sections de gestion logistique"
        className="tabs tabs-boxed bg-base-200 mb-6"
      >
        {TABS.map(({ id, label, Icon }, index) => {
          const isSelected = activeTab === id;
          const tabId = `logistique-tab-${id}`;
          const panelId = `logistique-panel-${id}`;

          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              className={`tab gap-2 ${isSelected ? "tab-active" : ""}`}
              onClick={() => setActiveTab(id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === "locaux" && (
          <div
            id="logistique-panel-locaux"
            role="tabpanel"
            aria-labelledby="logistique-tab-locaux"
          >
            <LocauxTab />
          </div>
        )}
        {activeTab === "stocks" && (
          <div
            id="logistique-panel-stocks"
            role="tabpanel"
            aria-labelledby="logistique-tab-stocks"
          >
            <StocksTab />
          </div>
        )}
        {activeTab === "inventaire" && (
          <div
            id="logistique-panel-inventaire"
            role="tabpanel"
            aria-labelledby="logistique-tab-inventaire"
          >
            <InventaireTab />
          </div>
        )}
        {activeTab === "maintenance" && (
          <div
            id="logistique-panel-maintenance"
            role="tabpanel"
            aria-labelledby="logistique-tab-maintenance"
          >
            <MaintenanceTab />
          </div>
        )}
        {activeTab === "cantine" && (
          <div
            id="logistique-panel-cantine"
            role="tabpanel"
            aria-labelledby="logistique-tab-cantine"
          >
            <CantineTab />
          </div>
        )}
      </div>
    </div>
  );
}

export default LogistiquePage;
