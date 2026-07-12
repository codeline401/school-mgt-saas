import { useState } from "react";
import {
  Package,
  PlusIcon,
  TrendingDown,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
  History,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "articles" | "mouvements" | "alertes";

/**
 * COMPOSANT STOCKS TAB
 *
 * Gestion des stocks de fournitures pédagogiques
 */

function StocksTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("articles");

  return (
    <div>
      {/* En-tête de l'onglet */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Package size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Gestion des Stocks</h2>
            <p className="text-sm text-base-content/60">
              Fournitures pédagogiques et alertes de seuil
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <TrendingUp size={16} />
            Entrée
          </button>
          <button className="btn btn-outline btn-sm gap-2">
            <TrendingDown size={16} />
            Sortie
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Nouvel article
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "articles" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("articles")}
        >
          <ClipboardList size={16} className="mr-2" />
          Articles en stock
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "mouvements" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("mouvements")}
        >
          <History size={16} className="mr-2" />
          Mouvements de stock
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "alertes" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("alertes")}
        >
          <AlertTriangle size={16} className="mr-2" />
          Alertes de seuil
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "articles" && (
        <DevelopmentPlaceholder
          icon={ClipboardList}
          title="Articles en stock"
          description="Gestion des articles avec quantités disponibles, catégories et unités de mesure."
        />
      )}

      {activeSubTab === "mouvements" && (
        <DevelopmentPlaceholder
          icon={History}
          title="Mouvements de stock"
          description="Historique complet des entrées et sorties de stock avec traçabilité."
        />
      )}

      {activeSubTab === "alertes" && (
        <DevelopmentPlaceholder
          icon={AlertTriangle}
          title="Alertes de seuil"
          description="Notifications pour les articles en dessous du seuil minimal défini."
        />
      )}
    </div>
  );
}

export default StocksTab;
