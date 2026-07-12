import { useState } from "react";
import {
  Calendar,
  Video,
  FileText,
  CalendarCheck,
  PartyPopper,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";

type SubTab = "reunions" | "comptes-rendus" | "calendrier" | "evenements";

function ReunionsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("reunions");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={28} className="text-primary" />
          <div>
            <h2 className="text-xl font-bold">Réunions & Événements</h2>
            <p className="text-sm text-base-content/60">
              Organisation de réunions et événements scolaires
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm gap-2">
            <CalendarCheck size={16} />
            Voir calendrier
          </button>
          <button className="btn btn-primary btn-sm gap-2">
            <Video size={16} />
            Nouvelle réunion
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-bordered mb-6">
        <button
          role="tab"
          className={`tab ${activeSubTab === "reunions" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("reunions")}
        >
          <Video size={16} className="mr-2" />
          Réunions à venir
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "comptes-rendus" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("comptes-rendus")}
        >
          <FileText size={16} className="mr-2" />
          Comptes-rendus
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "calendrier" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("calendrier")}
        >
          <CalendarCheck size={16} className="mr-2" />
          Calendrier annuel
        </button>
        <button
          role="tab"
          className={`tab ${activeSubTab === "evenements" ? "tab-active" : ""}`}
          onClick={() => setActiveSubTab("evenements")}
        >
          <PartyPopper size={16} className="mr-2" />
          Événements scolaires
        </button>
      </div>

      {activeSubTab === "reunions" && (
        <DevelopmentPlaceholder
          icon={Video}
          title="Réunions à venir"
          description="Liste des réunions planifiées avec convocations et ordres du jour."
        />
      )}

      {activeSubTab === "comptes-rendus" && (
        <DevelopmentPlaceholder
          icon={FileText}
          title="Comptes-rendus de réunions"
          description="Archive des comptes-rendus et décisions prises."
        />
      )}

      {activeSubTab === "calendrier" && (
        <DevelopmentPlaceholder
          icon={CalendarCheck}
          title="Calendrier annuel"
          description="Vue d'ensemble des réunions et conseils de l'année scolaire."
        />
      )}

      {activeSubTab === "evenements" && (
        <DevelopmentPlaceholder
          icon={PartyPopper}
          title="Événements scolaires"
          description="Fêtes, portes ouvertes, kermesses et événements exceptionnels."
        />
      )}
    </div>
  );
}

export default ReunionsTab;
