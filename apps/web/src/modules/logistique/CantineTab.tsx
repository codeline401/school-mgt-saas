import { useRef, useState, type KeyboardEvent } from "react";
import {
  UtensilsCrossed,
  PlusIcon,
  Calendar,
  Users,
  ClipboardList,
  ShoppingCart,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";
import { CantineOffresTab } from "./components/CantineTab";

type SubTab = "menus" | "inscriptions" | "forfaits" | "personnel" | "stock";

const SUB_TABS: {
  id: SubTab;
  label: string;
  Icon: typeof ClipboardList;
}[] = [
  { id: "menus", label: "Menus de la semaine", Icon: ClipboardList },
  { id: "inscriptions", label: "Inscriptions & Régimes", Icon: Users },
  { id: "forfaits", label: "Forfaits", Icon: UtensilsCrossed },
  { id: "personnel", label: "Personnel de cuisine", Icon: Users },
  { id: "stock", label: "Stock alimentaire", Icon: ShoppingCart },
];

function CantineTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("menus");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectAndFocusTab = (index: number) => {
    const normalizedIndex = (index + SUB_TABS.length) % SUB_TABS.length;
    const nextTab = SUB_TABS[normalizedIndex];
    setActiveSubTab(nextTab.id);
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
        selectAndFocusTab(SUB_TABS.length - 1);
        break;
    }
  };

  return (
    <div>
      {/* En-tête de l'onglet */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <UtensilsCrossed size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Cantine & Restauration</h2>
            <p className="text-sm text-base-content/60">
              Gestion des repas, menus et inscriptions
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-outline btn-sm gap-2">
            <Calendar size={16} />
            Planning hebdo
          </button>
          <button type="button" className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Créer menu
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div
        role="tablist"
        aria-label="Sections de la cantine"
        className="tabs tabs-bordered mb-6"
      >
        {SUB_TABS.map(({ id, label, Icon }, index) => {
          const isSelected = activeSubTab === id;
          const tabId = `cantine-tab-${id}`;
          const panelId = `cantine-panel-${id}`;

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
              className={`tab ${isSelected ? "tab-active" : ""}`}
              onClick={() => setActiveSubTab(id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <Icon size={16} className="mr-2" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Panneau actif */}
      {activeSubTab === "menus" && (
        <div
          id="cantine-panel-menus"
          role="tabpanel"
          aria-labelledby="cantine-tab-menus"
        >
          <DevelopmentPlaceholder
            icon={ClipboardList}
            title="Menus de la semaine"
            description="Planification et publication des menus hebdomadaires avec compositions nutritionnelles."
          />
        </div>
      )}

      {activeSubTab === "inscriptions" && (
        <div
          id="cantine-panel-inscriptions"
          role="tabpanel"
          aria-labelledby="cantine-tab-inscriptions"
        >
          <DevelopmentPlaceholder
            icon={Users}
            title="Inscriptions & Régimes alimentaires"
            description="Gestion des inscriptions cantine avec allergies, régimes spéciaux et restrictions."
          />
        </div>
      )}

      {activeSubTab === "forfaits" && (
        <div
          id="cantine-panel-forfaits"
          role="tabpanel"
          aria-labelledby="cantine-tab-forfaits"
        >
          <CantineOffresTab />
        </div>
      )}

      {activeSubTab === "personnel" && (
        <div
          id="cantine-panel-personnel"
          role="tabpanel"
          aria-labelledby="cantine-tab-personnel"
        >
          <DevelopmentPlaceholder
            icon={Users}
            title="Personnel de cuisine"
            description="Planning du personnel, équipes, formations hygiène et certifications HACCP."
          />
        </div>
      )}

      {activeSubTab === "stock" && (
        <div
          id="cantine-panel-stock"
          role="tabpanel"
          aria-labelledby="cantine-tab-stock"
        >
          <DevelopmentPlaceholder
            icon={ShoppingCart}
            title="Stock alimentaire & Approvisionnement"
            description="Suivi des stocks alimentaires, commandes fournisseurs et dates de péremption."
          />
        </div>
      )}
    </div>
  );
}

export default CantineTab;
