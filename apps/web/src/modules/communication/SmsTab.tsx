import { useState } from "react";
import { MessageCircle, Send, FileText, BarChart3, Users } from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "envoyer" | "envoyes" | "modeles" | "statistiques";

function SmsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("envoyer");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">SMS aux Parents</h2>
            <p className="text-sm text-base-content/60">
              Envoi de SMS groupés aux parents d'élèves
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <BarChart3 size={16} />
            Statistiques
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <Send size={16} />
            Envoyer SMS
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "envoyer" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("envoyer")}
        >
          <Send size={16} className="mr-2" />
          Envoyer SMS
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "envoyes" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("envoyes")}
        >
          <MessageCircle size={16} className="mr-2" />
          Messages envoyés
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "modeles" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("modeles")}
        >
          <FileText size={16} className="mr-2" />
          Modèles de SMS
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "statistiques" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("statistiques")}
        >
          <BarChart3 size={16} className="mr-2" />
          Statistiques
        </button>
      </div>

      {activeSubTab === "envoyer" && (
        <DevelopmentPlaceholder
          icon={Send}
          title="Envoyer SMS"
          description="Composer et envoyer des SMS à un groupe de parents ou classe spécifique."
        />
      )}

      {activeSubTab === "envoyes" && (
        <DevelopmentPlaceholder
          icon={MessageCircle}
          title="Messages envoyés"
          description="Historique des SMS envoyés avec statut de livraison."
        />
      )}

      {activeSubTab === "modeles" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Modèles de SMS"
          description="Bibliothèque de modèles pré-rédigés pour envois rapides."
        />
      )}

      {activeSubTab === "statistiques" && (
        <DevelopmentPlaceholder
          icon={BarChart3}
          title="Statistiques SMS"
          description="Nombre de SMS envoyés, taux de livraison et coûts."
        />
      )}
    </div>
  );
}

export default SmsTab;
