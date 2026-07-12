import { useState } from "react";
import { MessageSquare, Inbox, Send, FileText, Users } from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "reception" | "envoyes" | "brouillons" | "contacts";

function MessagerieTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("reception");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Messagerie Interne</h2>
            <p className="text-sm text-base-content/60">
              Échanges entre personnel, enseignants et administration
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <Users size={16} />
            Contacts
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <Send size={16} />
            Nouveau message
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "reception" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("reception")}
        >
          <Inbox size={16} className="mr-2" />
          Boîte de réception
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "envoyes" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("envoyes")}
        >
          <Send size={16} className="mr-2" />
          Messages envoyés
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
          className={`tab ${activeSubTab === "contacts" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("contacts")}
        >
          <Users size={16} className="mr-2" />
          Contacts
        </button>
      </div>

      {activeSubTab === "reception" && (
        <DevelopmentPlaceholder
          icon={Inbox}
          title="Boîte de réception"
          description="Messages reçus du personnel, enseignants et administration."
        />
      )}

      {activeSubTab === "envoyes" && (
        <DevelopmentPlaceholder
          icon={Send}
          title="Messages envoyés"
          description="Historique des messages que vous avez envoyés."
        />
      )}

      {activeSubTab === "brouillons" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Brouillons"
          description="Messages en cours de rédaction non envoyés."
        />
      )}

      {activeSubTab === "contacts" && (
        <DevelopmentPlaceholder
          icon={Users}
          title="Carnet de contacts"
          description="Annuaire du personnel avec coordonnées et fonctions."
        />
      )}
    </div>
  );
}

export default MessagerieTab;
