import { useState } from "react";
import {
  UtensilsCrossed,
  PlusIcon,
  Calendar,
  Users,
  ClipboardList,
  ShoppingCart,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "menus" | "inscriptions" | "personnel" | "stock";

/**
 * COMPOSANT CANTINE TAB
 *
 * Gestion de la cantine et de la restauration scolaire
 */

function CantineTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("menus");

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
          <button className="btn btn-outline btn-sm gap-2">
            <Calendar size={16} />
            Planning hebdo
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Créer menu
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "menus" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("menus")}
        >
          <ClipboardList size={16} className="mr-2" />
          Menus de la semaine
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "inscriptions" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("inscriptions")}
        >
          <Users size={16} className="mr-2" />
          Inscriptions & Régimes
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "personnel" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("personnel")}
        >
          <Users size={16} className="mr-2" />
          Personnel de cuisine
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "stock" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("stock")}
        >
          <ShoppingCart size={16} className="mr-2" />
          Stock alimentaire
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "menus" && (
        <DevelopmentPlaceholder
          icon={ClipboardList}
          title="Menus de la semaine"
          description="Planification et publication des menus hebdomadaires avec compositions nutritionnelles."
        />
      )}

      {activeSubTab === "inscriptions" && (
        <DevelopmentPlaceholder
          icon={Users}
          title="Inscriptions & Régimes alimentaires"
          description="Gestion des inscriptions cantine avec allergies, régimes spéciaux et restrictions."
        />
      )}

      {activeSubTab === "personnel" && (
        <DevelopmentPlaceholder
          icon={Users}
          title="Personnel de cuisine"
          description="Planning du personnel, équipes, formations hygiène et certifications HACCP."
        />
      )}

      {activeSubTab === "stock" && (
        <DevelopmentPlaceholder
          icon={ShoppingCart}
          title="Stock alimentaire & Approvisionnement"
          description="Suivi des stocks alimentaires, commandes fournisseurs et dates de péremption."
        />
      )}
    </div>
  );
}

export default CantineTab;
