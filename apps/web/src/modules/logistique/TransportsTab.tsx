import { useState } from "react";
import { Bus, PlusIcon, MapPin, Calendar, Users, Route } from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "flotte" | "circuits" | "sorties" | "chauffeurs";

/**
 * COMPOSANT TRANSPORTS TAB
 *
 * Gestion des transports scolaires et sorties pédagogiques
 */

function TransportsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("flotte");

  return (
    <div>
      {/* En-tête de l'onglet */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Bus size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">
              Transports & Sorties Scolaires
            </h2>
            <p className="text-sm text-base-content/60">
              Gestion de la flotte, circuits et événements
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <Calendar size={16} />
            Planifier sortie
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Ajouter véhicule
          </button>
        </div>
      </div>

      {/* Sous-onglets */}
      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "flotte" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("flotte")}
        >
          <Bus size={16} className="mr-2" />
          Flotte de véhicules
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "circuits" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("circuits")}
        >
          <Route size={16} className="mr-2" />
          Circuits & Trajets
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "sorties" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("sorties")}
        >
          <MapPin size={16} className="mr-2" />
          Sorties scolaires
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "chauffeurs" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("chauffeurs")}
        >
          <Users size={16} className="mr-2" />
          Chauffeurs & Personnel
        </button>
      </div>

      {/* Contenu des sous-onglets */}
      {activeSubTab === "flotte" && (
        <DevelopmentPlaceholder
          icon={Bus}
          title="Flotte de véhicules"
          description="Gestion des véhicules avec assurances, contrôles techniques et historique de maintenance."
        />
      )}

      {activeSubTab === "circuits" && (
        <DevelopmentPlaceholder
          icon={Route}
          title="Circuits & Trajets"
          description="Planification des circuits quotidiens, arrêts et horaires de ramassage scolaire."
        />
      )}

      {activeSubTab === "sorties" && (
        <DevelopmentPlaceholder
          icon={MapPin}
          title="Sorties scolaires"
          description="Organisation des sorties pédagogiques, voyages scolaires et événements externes."
        />
      )}

      {activeSubTab === "chauffeurs" && (
        <DevelopmentPlaceholder
          icon={Users}
          title="Chauffeurs & Personnel"
          description="Gestion du personnel de transport avec planning, formations et habilitations."
        />
      )}
    </div>
  );
}

export default TransportsTab;
