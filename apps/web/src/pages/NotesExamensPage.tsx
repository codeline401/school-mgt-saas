import { useState } from "react";
import {
  ClipboardList,
  FileText,
  Calculator,
  Trophy,
  Gavel,
  BookMarked,
  Download,
  PenLine,
} from "lucide-react";
import SaisieNotesTab from "../components/notes/SaisieNotesTab";
import BulletinsTab from "../components/notes/BulletinsTab";
import MoyenneAutoTab from "../components/notes/MoyenneAutoTab";
import ClassementTab from "../components/notes/ClassementTab";
import DeliberationTab from "../components/notes/DeliberationTab";
import GestionExamensTab from "../components/notes/GestionExamensTab";
import ExportPdfTab from "../components/notes/ExportPdfTab";
import SignatureNumeriqueTab from "../components/notes/SignatureNumeriqueTab";

// ─── Définition des onglets ───────────────────────────────────────────────────

const TABS = [
  { id: "saisie-notes", label: "Saisie des notes", icon: ClipboardList },
  { id: "bulletins", label: "Bulletins", icon: FileText },
  { id: "moyenne-auto", label: "Moyenne auto", icon: Calculator },
  { id: "classement", label: "Classement", icon: Trophy },
  { id: "deliberation", label: "Délibération", icon: Gavel },
  { id: "gestion-examens", label: "Gestion des examens", icon: BookMarked },
  { id: "export-pdf", label: "Export PDF", icon: Download },
  { id: "signature", label: "Signature numérique", icon: PenLine },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Page principale ──────────────────────────────────────────────────────────

/**
 * Page du module "Gestion des notes & examens".
 *
 * Chaque onglet est un composant isolé dans `components/notes/`.
 * L'ensemble du module est actuellement en maintenance ; les composants
 * affichent un placeholder en attendant leur implémentation.
 */
export default function NotesExamensPage() {
  const [activeTab, setActiveTab] = useState<TabId>("saisie-notes");

  // Rendu conditionnel de l'onglet actif
  const renderTab = () => {
    switch (activeTab) {
      case "saisie-notes":
        return <SaisieNotesTab />;
      case "bulletins":
        return <BulletinsTab />;
      case "moyenne-auto":
        return <MoyenneAutoTab />;
      case "classement":
        return <ClassementTab />;
      case "deliberation":
        return <DeliberationTab />;
      case "gestion-examens":
        return <GestionExamensTab />;
      case "export-pdf":
        return <ExportPdfTab />;
      case "signature":
        return <SignatureNumeriqueTab />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── En-tête ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <ClipboardList size={22} className="text-primary" />
        <h1 className="text-2xl font-bold">Notes &amp; Examens</h1>
        {/* Badge indiquant que le module est en cours de développement */}
      </div>

      {/* ── Navigation par onglets ────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Onglets du module Notes & Examens"
        className="tabs tabs-border flex-wrap"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
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
        aria-labelledby={`tab-${activeTab}`}
        aria-label={TABS.find((t) => t.id === activeTab)?.label}
      >
        {renderTab()}
      </div>
    </div>
  );
}
