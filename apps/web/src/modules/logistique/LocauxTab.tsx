import { useState } from "react";
import {
  Building2,
  PlusIcon,
  Calendar,
  ClipboardList,
  Info,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "inventaire" | "caracteristiques" | "reservations";

/**
 * COMPOSANT LOCAUX TAB
 *
 * Gestion des locaux (salles, bâtiments) et des réservations
 */

function LocauxTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("inventaire");

  return (
    <div>
      {/* En-tête de l'onglet */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Building2 size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Gestion des Locaux</h2>
            <p className="text-sm text-base-content/60">
              Salles, bâtiments et réservations
            </p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-2">
          <PlusIcon size={16} />
          Ajouter un local
        </button>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "inventaire" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("inventaire")}
        >
          <ClipboardList size={16} className="mr-2" />
          Inventaire des salles
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "caracteristiques" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("caracteristiques")}
        >
          <Info size={16} className="mr-2" />
          Capacité & Caractéristiques
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "reservations" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("reservations")}
        >
          <Calendar size={16} className="mr-2" />
          Réservation de ressources
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "inventaire" && (
        <DevelopmentPlaceholder
          icon={ClipboardList}
          title="Inventaire des salles"
          description="Liste complète des salles et bâtiments avec leurs informations détaillées."
        />
      )}

      {activeSubTab === "caracteristiques" && (
        <DevelopmentPlaceholder
          icon={Info}
          title="Capacité & Caractéristiques"
          description="Gestion des capacités, équipements et caractéristiques de chaque local."
        />
      )}

      {activeSubTab === "reservations" && (
        <DevelopmentPlaceholder
          icon={Calendar}
          title="Réservation de ressources"
          description="Système de réservation et calendrier de disponibilité des locaux."
        />
      )}
    </div>
  );
}

export default LocauxTab;
