import { useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Layers,
  FolderOpen,
  MonitorPlay,
  NotebookPen,
} from "lucide-react";
import ProgrammeRealiseTab from "../components/cahierTexte/ProgrammeRealiseTab";
import DevoirsDonnesTab from "../components/cahierTexte/DevoirsDonnesTab";
import SuiviChapitresTab from "../components/cahierTexte/SuiviChapitresTab";
import DocumentsPedagogiquesTab from "../components/cahierTexte/DocumentsPedagogiquesTab";
import ELearningTab from "../components/cahierTexte/ELearningTab";

// ─── Définition des onglets ───────────────────────────────────────────────────

const TABS = [
  { id: "programme-realise", label: "Programme réalisé", icon: ClipboardCheck },
  { id: "devoirs-donnes", label: "Devoirs donnés", icon: BookOpen },
  { id: "suivi-chapitres", label: "Suivi des chapitres", icon: Layers },
  {
    id: "documents-pedagogiques",
    label: "Documents pédagogiques",
    icon: FolderOpen,
  },
  { id: "e-learning", label: "E-learning", icon: MonitorPlay },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Page principale ──────────────────────────────────────────────────────────

/**
 * Page du module "Cahier de texte & suivi pédagogique".
 *
 * Chaque onglet est un composant isolé dans `components/cahierTexte/`.
 * L'ensemble du module est actuellement en maintenance ; les composants
 * affichent un placeholder en attendant leur implémentation.
 */
export default function CahierTextePage() {
  const [activeTab, setActiveTab] = useState<TabId>("programme-realise");

  // Rendu conditionnel de l'onglet actif
  const renderTab = () => {
    switch (activeTab) {
      case "programme-realise":
        return <ProgrammeRealiseTab />;
      case "devoirs-donnes":
        return <DevoirsDonnesTab />;
      case "suivi-chapitres":
        return <SuiviChapitresTab />;
      case "documents-pedagogiques":
        return <DocumentsPedagogiquesTab />;
      case "e-learning":
        return <ELearningTab />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── En-tête ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <NotebookPen size={22} className="text-primary" />
        <h1 className="text-2xl font-bold">
          Cahier de texte &amp; suivi pédagogique
        </h1>
        {/* Badge indiquant que le module est en cours de développement */}
      </div>

      {/* ── Navigation par onglets ────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Onglets du module Cahier de texte"
        className="tabs tabs-border flex-wrap"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`tabpanel-${id}`}
            className={`tab gap-1.5 ${activeTab === id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenu de l'onglet actif ─────────────────────────────────────── */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-label={TABS.find((t) => t.id === activeTab)?.label}
      >
        {renderTab()}
      </div>
    </div>
  );
}
