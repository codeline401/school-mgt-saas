import { useState } from "react";
import {
  Monitor,
  PlusIcon,
  Send,
  RotateCcw,
  ClipboardList,
  FileBarChart,
  Clock,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "equipements" | "prets" | "historique";

/**
 * COMPOSANT INVENTAIRE TAB
 *
 * Gestion de l'inventaire du matériel informatique et autres équipements
 */

function InventaireTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("equipements");

  return (
    <div>
      {/* En-tête de l'onglet */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Monitor size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Gestion de l'Inventaire</h2>
            <p className="text-sm text-base-content/60">
              Matériel informatique et suivi des prêts
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <Send size={16} />
            Prêter
          </button>
          <button className="btn btn-outline btn-sm gap-2">
            <RotateCcw size={16} />
            Retourner
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Nouvel équipement
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "equipements" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("equipements")}
        >
          <ClipboardList size={16} className="mr-2" />
          Liste des équipements
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "prets" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("prets")}
        >
          <Send size={16} className="mr-2" />
          Prêts en cours
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "historique" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("historique")}
        >
          <FileBarChart size={16} className="mr-2" />
          Historique & Statistiques
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "equipements" && (
        <DevelopmentPlaceholder
          icon={ClipboardList}
          title="Liste des équipements"
          description="Inventaire complet du matériel avec numéros de série, états et localisations."
        />
      )}

      {activeSubTab === "prets" && (
        <DevelopmentPlaceholder
          icon={Send}
          title="Prêts en cours"
          description="Suivi des équipements prêtés avec dates de retour et alertes de retard."
        />
      )}

      {activeSubTab === "historique" && (
        <DevelopmentPlaceholder
          icon={FileBarChart}
          title="Historique & Statistiques"
          description="Historique des prêts et statistiques d'utilisation des équipements."
        />
      )}
    </div>
  );
}

export default InventaireTab;
