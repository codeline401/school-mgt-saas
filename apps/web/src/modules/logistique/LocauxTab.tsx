import { useState } from "react";
import { Building2, BarChart3, Calendar } from "lucide-react";
import InventaireBatimentsTab from "./components/InventaireBatimentsTab";
import StatistiquesTab from "./components/StatistiquesTab";
import ReservationsTab from "./components/ReservationsTab";

type SubTab = "inventaire" | "statistiques" | "reservations";

/**
 * COMPOSANT LOCAUX TAB
 *
 * Gestion des locaux (salles, bâtiments) et des réservations
 * Architecture refactorisée avec hooks personnalisés et composants modulaires
 */
export default function LocauxTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("inventaire");

  return (
    <div className="p-4 space-y-4">
      {/* Navigation des sous-onglets */}
      <div className="border-b border-base-300">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab("inventaire")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === "inventaire"
                ? "border-primary text-primary"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <Building2 size={18} />
            Inventaire
          </button>

          <button
            onClick={() => setActiveSubTab("statistiques")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === "statistiques"
                ? "border-primary text-primary"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <BarChart3 size={18} />
            Statistiques
          </button>

          <button
            onClick={() => setActiveSubTab("reservations")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === "reservations"
                ? "border-primary text-primary"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            <Calendar size={18} />
            Réservations
          </button>
        </div>
      </div>

      {/* Contenu du sous-onglet actif */}
      <div>
        {activeSubTab === "inventaire" && <InventaireBatimentsTab />}
        {activeSubTab === "statistiques" && <StatistiquesTab />}
        {activeSubTab === "reservations" && <ReservationsTab />}
      </div>
    </div>
  );
}
