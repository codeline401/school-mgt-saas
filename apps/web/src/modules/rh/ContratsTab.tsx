import { useState } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  FilePlus,
  FileStack,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "actifs" | "expires" | "avenants" | "modeles";

function ContratsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("actifs");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Contrats & Dossiers</h2>
            <p className="text-sm text-base-content/60">
              Gestion des contrats de travail et documents administratifs
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <FileStack size={16} />
            Voir modèles
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <FilePlus size={16} />
            Nouveau contrat
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "actifs" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("actifs")}
        >
          <CheckCircle size={16} className="mr-2" />
          Contrats actifs
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "expires" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("expires")}
        >
          <XCircle size={16} className="mr-2" />
          Contrats expirés
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "avenants" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("avenants")}
        >
          <FilePlus size={16} className="mr-2" />
          Avenants & Modifications
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "modeles" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("modeles")}
        >
          <FileStack size={16} className="mr-2" />
          Modèles de contrats
        </button>
      </div>

      {activeSubTab === "actifs" && (
        <DevelopmentPlaceholder
          icon={CheckCircle}
          title="Contrats actifs"
          description="Liste des contrats en cours (CDI, CDD) avec dates de début et fin."
        />
      )}

      {activeSubTab === "expires" && (
        <DevelopmentPlaceholder
          icon={XCircle}
          title="Contrats expirés"
          description="Contrats arrivés à terme et archive des anciens employés."
        />
      )}

      {activeSubTab === "avenants" && (
        <DevelopmentPlaceholder
          icon={FilePlus}
          title="Avenants & Modifications"
          description="Avenants, modifications de contrat et renouvellements."
        />
      )}

      {activeSubTab === "modeles" && (
        <DevelopmentPlaceholder
          icon={FileStack}
          title="Modèles de contrats"
          description="Bibliothèque de modèles pour CDI, CDD, stages et contrats spécifiques."
        />
      )}
    </div>
  );
}

export default ContratsTab;
