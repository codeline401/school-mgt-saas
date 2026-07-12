import { useState } from "react";
import { FileText, FolderOpen, Archive, Lock, Upload } from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "bibliotheque" | "partages" | "archives" | "permissions";

function DocumentsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("bibliotheque");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Documents Partagés</h2>
            <p className="text-sm text-base-content/60">
              Bibliothèque de documents et partage de fichiers
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <FolderOpen size={16} />
            Parcourir
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <Upload size={16} />
            Téléverser document
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "bibliotheque" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("bibliotheque")}
        >
          <FolderOpen size={16} className="mr-2" />
          Bibliothèque
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "partages" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("partages")}
        >
          <FileText size={16} className="mr-2" />
          Documents partagés
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "archives" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("archives")}
        >
          <Archive size={16} className="mr-2" />
          Archives
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "permissions" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("permissions")}
        >
          <Lock size={16} className="mr-2" />
          Gestion des droits
        </button>
      </div>

      {activeSubTab === "bibliotheque" && (
        <DevelopmentPlaceholder
          icon={FolderOpen}
          title="Bibliothèque de documents"
          description="Organisation des documents par dossiers et catégories."
        />
      )}

      {activeSubTab === "partages" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Documents partagés"
          description="Fichiers partagés avec le personnel et les enseignants."
        />
      )}

      {activeSubTab === "archives" && (
        <DevelopmentPlaceholder
          icon={Archive}
          title="Archives"
          description="Documents archivés des années précédentes."
        />
      )}

      {activeSubTab === "permissions" && (
        <DevelopmentPlaceholder
          icon={Lock}
          title="Gestion des droits d'accès"
          description="Configuration des permissions de lecture et modification."
        />
      )}
    </div>
  );
}

export default DocumentsTab;
