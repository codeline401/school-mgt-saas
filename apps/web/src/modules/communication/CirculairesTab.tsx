import { useState } from "react";
import { FileText, Send, CheckCheck, Archive, PlusIcon } from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "publiees" | "brouillons" | "accuses" | "archives";

function CirculairesTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("publiees");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Circulaires Officielles</h2>
            <p className="text-sm text-base-content/60">
              Diffusion de circulaires et notes administratives
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <Archive size={16} />
            Archives
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <PlusIcon size={16} />
            Nouvelle circulaire
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "publiees" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("publiees")}
        >
          <Send size={16} className="mr-2" />
          Circulaires publiées
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "brouillons" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("brouillons")}
        >
          <FileText size={16} className="mr-2" />
          Brouillons
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "accuses" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("accuses")}
        >
          <CheckCheck size={16} className="mr-2" />
          Accusés de réception
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "archives" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("archives")}
        >
          <Archive size={16} className="mr-2" />
          Archives
        </button>
      </div>

      {activeSubTab === "publiees" && (
        <DevelopmentPlaceholder
          icon={Send}
          title="Circulaires publiées"
          description="Circulaires officielles diffusées au personnel et aux parents."
        />
      )}

      {activeSubTab === "brouillons" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Brouillons de circulaires"
          description="Circulaires en cours de rédaction non publiées."
        />
      )}

      {activeSubTab === "accuses" && (
        <DevelopmentPlaceholder
          icon={CheckCheck}
          title="Accusés de réception"
          description="Suivi des lectures et confirmations de réception."
        />
      )}

      {activeSubTab === "archives" && (
        <DevelopmentPlaceholder
          icon={Archive}
          title="Archives des circulaires"
          description="Circulaires archivées des années antérieures."
        />
      )}
    </div>
  );
}

export default CirculairesTab;
