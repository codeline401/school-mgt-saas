import { useState } from "react";
import { Bell, Megaphone, Smartphone, History, Settings } from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "actuelles" | "push" | "historique" | "parametres";

function NotificationsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("actuelles");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Bell size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Notifications & Annonces</h2>
            <p className="text-sm text-base-content/60">
              Diffusion d'annonces et notifications importantes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <History size={16} />
            Historique
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <Megaphone size={16} />
            Nouvelle annonce
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "actuelles" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("actuelles")}
        >
          <Megaphone size={16} className="mr-2" />
          Annonces actuelles
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "push" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("push")}
        >
          <Smartphone size={16} className="mr-2" />
          Notifications push
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "historique" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("historique")}
        >
          <History size={16} className="mr-2" />
          Historique
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "parametres" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("parametres")}
        >
          <Settings size={16} className="mr-2" />
          Paramètres
        </button>
      </div>

      {activeSubTab === "actuelles" && (
        <DevelopmentPlaceholder
          icon={Megaphone}
          title="Annonces actuelles"
          description="Annonces en cours diffusées à l'ensemble de l'établissement."
        />
      )}

      {activeSubTab === "push" && (
        <DevelopmentPlaceholder
          icon={Smartphone}
          title="Notifications push"
          description="Gestion des notifications mobiles urgentes."
        />
      )}

      {activeSubTab === "historique" && (
        <DevelopmentPlaceholder
          icon={History}
          title="Historique des annonces"
          description="Archive des annonces et notifications passées."
        />
      )}

      {activeSubTab === "parametres" && (
        <DevelopmentPlaceholder
          icon={Settings}
          title="Paramètres de notification"
          description="Configuration des canaux et préférences de notification."
        />
      )}
    </div>
  );
}

export default NotificationsTab;
