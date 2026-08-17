import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartPulse,
  Landmark,
  School,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import DevelopmentPlaceholder from "../../components/common/DevelopmentPlaceholder";
import FicheElevePage from "./informations/fiche/pages/FicheElevePage";
import FicheEleveFormModal from "./informations/fiche/components/FicheEleveFormModal";
import ResponsablesPage from "./informations/responsable/pages/ResponsablesPage";

type MainTab =
  | "informations"
  | "ecolage"
  | "absences"
  | "parcours"
  | "vie-scolaire"
  | "documents";

type InformationSubTab =
  | "fiche"
  | "responsables"
  | "classe"
  | "urgence"
  | "historique";

type EcolageSubTab =
  | "paiements"
  | "factures"
  | "bourses"
  | "relances"
  | "garanties";

type AbsenceSubTab =
  | "suivi"
  | "justifications"
  | "retards"
  | "alertes"
  | "sanctions";

type ParcoursSubTab =
  | "notes"
  | "bulletins"
  | "progression"
  | "orientation"
  | "projets";

type VieScolaireSubTab =
  | "discipline"
  | "activites"
  | "recompenses"
  | "sante"
  | "transport";

type DocumentSubTab =
  | "pieces"
  | "fichiers"
  | "contrats"
  | "attestations"
  | "archives";

const PATH_TO_TAB: Record<string, MainTab> = {
  "/eleves/informations": "informations",
  "/eleves/ecolage": "ecolage",
  "/eleves/absences": "absences",
  "/eleves/parcours": "parcours",
  "/eleves/vie-scolaire": "vie-scolaire",
  "/eleves/documents": "documents",
};

type TabItem<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
};

const informationTabs: TabItem<InformationSubTab>[] = [
  { value: "fiche", label: "Fiche élève", icon: UserRound },
  { value: "responsables", label: "Responsables", icon: Users },
  { value: "classe", label: "Classe & affectation", icon: School },
  { value: "urgence", label: "Contacts d’urgence", icon: ShieldCheck },
  { value: "historique", label: "Historique", icon: BookOpen },
];

const ecolageTabs: TabItem<EcolageSubTab>[] = [
  { value: "paiements", label: "Paiements", icon: Wallet },
  { value: "factures", label: "Factures", icon: FileText },
  { value: "bourses", label: "Bourses", icon: Landmark },
  { value: "relances", label: "Relances", icon: CalendarClock },
  { value: "garanties", label: "Garanties", icon: ShieldCheck },
];

const absenceTabs: TabItem<AbsenceSubTab>[] = [
  { value: "suivi", label: "Suivi", icon: Calendar },
  { value: "justifications", label: "Justifications", icon: FileText },
  { value: "retards", label: "Retards", icon: CalendarClock },
  { value: "alertes", label: "Alertes", icon: Star },
  { value: "sanctions", label: "Sanctions", icon: BriefcaseBusiness },
];

const parcoursTabs: TabItem<ParcoursSubTab>[] = [
  { value: "notes", label: "Notes", icon: BookOpen },
  { value: "bulletins", label: "Bulletins", icon: FileText },
  { value: "progression", label: "Progression", icon: GraduationCap },
  { value: "orientation", label: "Orientation", icon: Star },
  { value: "projets", label: "Projets", icon: Trophy },
];

const vieScolaireTabs: TabItem<VieScolaireSubTab>[] = [
  { value: "discipline", label: "Discipline", icon: ClipboardCheck },
  { value: "activites", label: "Activités", icon: Trophy },
  { value: "recompenses", label: "Récompenses", icon: Star },
  { value: "sante", label: "Santé & sécurité", icon: HeartPulse },
  { value: "transport", label: "Transport & cantine", icon: CalendarClock },
];

const documentTabs: TabItem<DocumentSubTab>[] = [
  { value: "pieces", label: "Pièces jointes", icon: FileText },
  { value: "fichiers", label: "Fichiers élèves", icon: School },
  { value: "contrats", label: "Contrats", icon: BriefcaseBusiness },
  { value: "attestations", label: "Attestations", icon: ShieldCheck },
  { value: "archives", label: "Archives", icon: BookOpen },
];

function GestionElevesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<MainTab>(
    PATH_TO_TAB[location.pathname] || "informations",
  );
  const [activeInfoSubTab, setActiveInfoSubTab] =
    useState<InformationSubTab>("fiche");
  const [activeEcolageSubTab, setActiveEcolageSubTab] =
    useState<EcolageSubTab>("paiements");
  const [activeAbsenceSubTab, setActiveAbsenceSubTab] =
    useState<AbsenceSubTab>("suivi");
  const [activeParcoursSubTab, setActiveParcoursSubTab] =
    useState<ParcoursSubTab>("notes");
  const [activeVieScolaireSubTab, setActiveVieScolaireSubTab] =
    useState<VieScolaireSubTab>("discipline");
  const [activeDocumentSubTab, setActiveDocumentSubTab] =
    useState<DocumentSubTab>("pieces");
  const [isCreateEleveModalOpen, setIsCreateEleveModalOpen] = useState(false);

  useEffect(() => {
    const tab = PATH_TO_TAB[location.pathname];
    if (tab) setActiveSubTab(tab);
  }, [location.pathname]);

  const handleTabChange = (tab: MainTab) => {
    const path = Object.keys(PATH_TO_TAB).find(
      (key) => PATH_TO_TAB[key] === tab,
    );
    if (path) navigate(path);
  };

  const renderInformationContent = () => {
    switch (activeInfoSubTab) {
      case "fiche":
        return <FicheElevePage />;
      case "responsables":
        return <ResponsablesPage />;
      case "classe":
        return (
          <DevelopmentPlaceholder
            icon={School}
            title="Classe & affectation"
            description="Affectation par classe, niveau, section, options et changement de classe."
          />
        );
      case "urgence":
        return (
          <DevelopmentPlaceholder
            icon={ShieldCheck}
            title="Contacts d’urgence"
            description="Numéros d’urgence, contacts à prévenir et informations médicales de sécurité."
          />
        );
      case "historique":
        return (
          <DevelopmentPlaceholder
            icon={BookOpen}
            title="Historique administratif"
            description="Anciennes classes, réinscriptions, changements, événements et parcours de l’élève."
          />
        );
      default:
        return null;
    }
  };

  const renderEcolageContent = () => {
    switch (activeEcolageSubTab) {
      case "paiements":
        return (
          <DevelopmentPlaceholder
            icon={Wallet}
            title="Paiements & encaissements"
            description="Suivi des versements, soldes, échéances et régularisation du compte élève."
          />
        );
      case "factures":
        return (
          <DevelopmentPlaceholder
            icon={FileText}
            title="Factures & reçus"
            description="Génération, consultation et archivage des documents financiers de l’élève."
          />
        );
      case "bourses":
        return (
          <DevelopmentPlaceholder
            icon={Landmark}
            title="Bourses & aides"
            description="Droits à bourse, montants, conditions, décisions et suivi des aides sociales."
          />
        );
      case "relances":
        return (
          <DevelopmentPlaceholder
            icon={CalendarClock}
            title="Relances & rappels"
            description="Plan de relance, échéances à venir, impayés et alertes automatiques."
          />
        );
      case "garanties":
        return (
          <DevelopmentPlaceholder
            icon={ShieldCheck}
            title="Garanties & remboursements"
            description="Cautions, avances, remboursements et suivi des montants spécifiques."
          />
        );
      default:
        return null;
    }
  };

  const renderAbsenceContent = () => {
    switch (activeAbsenceSubTab) {
      case "suivi":
        return (
          <DevelopmentPlaceholder
            icon={Calendar}
            title="Suivi des absences"
            description="Historique des absences, taux de présence, jours manqués et synthèse globale."
          />
        );
      case "justifications":
        return (
          <DevelopmentPlaceholder
            icon={FileText}
            title="Justifications"
            description="Pièces justificatives, motifs d’absence, suivis validés ou refusés."
          />
        );
      case "retards":
        return (
          <DevelopmentPlaceholder
            icon={CalendarClock}
            title="Retards & arrivées tardives"
            description="Suivi des retards, motifs, fréquence et incidence sur la présence."
          />
        );
      case "alertes":
        return (
          <DevelopmentPlaceholder
            icon={Star}
            title="Alertes & notification"
            description="Déclenchement d’alertes sur les absences répétées et transmission aux parents."
          />
        );
      case "sanctions":
        return (
          <DevelopmentPlaceholder
            icon={BriefcaseBusiness}
            title="Sanctions & discipline"
            description="Avertissements, convocations, incidents et suivi disciplinaire associé."
          />
        );
      default:
        return null;
    }
  };

  const renderParcoursContent = () => {
    switch (activeParcoursSubTab) {
      case "notes":
        return (
          <DevelopmentPlaceholder
            icon={BookOpen}
            title="Notes & devoirs"
            description="Moyennes, matières, épreuves, coefficients et progression académique."
          />
        );
      case "bulletins":
        return (
          <DevelopmentPlaceholder
            icon={FileText}
            title="Bulletins & relevés"
            description="Téléchargement, consultation et historique des bulletins trimestriels."
          />
        );
      case "progression":
        return (
          <DevelopmentPlaceholder
            icon={GraduationCap}
            title="Progression scolaire"
            description="Suivi des performances, évolutions, points forts et axes d’amélioration."
          />
        );
      case "orientation":
        return (
          <DevelopmentPlaceholder
            icon={Star}
            title="Orientation & parcours"
            description="Filières, options, conseils d’orientation et trajectoires de formation."
          />
        );
      case "projets":
        return (
          <DevelopmentPlaceholder
            icon={Trophy}
            title="Projets & réalisations"
            description="Travaux, concours, projets personnels, participations et résultats remarquables."
          />
        );
      default:
        return null;
    }
  };

  const renderVieScolaireContent = () => {
    switch (activeVieScolaireSubTab) {
      case "discipline":
        return (
          <DevelopmentPlaceholder
            icon={ClipboardCheck}
            title="Discipline & comportement"
            description="Observations, incidents, avertissements et suivi des comportements scolaires."
          />
        );
      case "activites":
        return (
          <DevelopmentPlaceholder
            icon={Trophy}
            title="Activités extrascolaires"
            description="Clubs, sport, culture, clubs digitaux, stages et participation associée."
          />
        );
      case "recompenses":
        return (
          <DevelopmentPlaceholder
            icon={Star}
            title="Récompenses & distinctions"
            description="Médailles, félicitations, badges, encouragements et distinctions."
          />
        );
      case "sante":
        return (
          <DevelopmentPlaceholder
            icon={HeartPulse}
            title="Santé & sécurité"
            description="Allergies, soins, visites médicales, accident et procédures de sécurité."
          />
        );
      case "transport":
        return (
          <DevelopmentPlaceholder
            icon={CalendarClock}
            title="Transport & cantine"
            description="Abonnement, repas, suivi quotidien, règles et service annexe de l’établissement."
          />
        );
      default:
        return null;
    }
  };

  const renderDocumentContent = () => {
    switch (activeDocumentSubTab) {
      case "pieces":
        return (
          <DevelopmentPlaceholder
            icon={FileText}
            title="Pièces jointes"
            description="Documents d’inscription, pièces administratives, certificats et justificatifs."
          />
        );
      case "fichiers":
        return (
          <DevelopmentPlaceholder
            icon={School}
            title="Fichiers élèves"
            description="Dossier numérique, documents générés, reçus, attestations et fichiers téléversés."
          />
        );
      case "contrats":
        return (
          <DevelopmentPlaceholder
            icon={BriefcaseBusiness}
            title="Contrats & engagements"
            description="Contrat d’inscription, conventions, engagements de participation et accords."
          />
        );
      case "attestations":
        return (
          <DevelopmentPlaceholder
            icon={ShieldCheck}
            title="Attestations"
            description="Attestation de scolarité, de présence, de stage et autres documents officiels."
          />
        );
      case "archives":
        return (
          <DevelopmentPlaceholder
            icon={BookOpen}
            title="Archives"
            description="Historique complet des documents, dates, versions et archivage administrative."
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <FicheEleveFormModal
        key={
          isCreateEleveModalOpen ? "create-eleve-modal" : "closed-eleve-modal"
        }
        isOpen={isCreateEleveModalOpen}
        onClose={() => setIsCreateEleveModalOpen(false)}
      />

      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap size={28} className="text-primary" />
            <div>
              <h2 className="text-xl font-bold">Gestion d’élève</h2>
              <p className="text-sm text-base-content/60">
                Suivi administratif, financier et scolaire des élèves
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm gap-2">
              <FileText size={16} />
              Exporter
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm gap-2"
              onClick={() => setIsCreateEleveModalOpen(true)}
            >
              <UserRound size={16} />
              Nouvel élève
            </button>
          </div>
        </div>

        <div role="tablist" className="tabs tabs-bordered mb-6">
          <button
            role="tab"
            className={`tab ${activeSubTab === "informations" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("informations")}
          >
            <UserRound size={16} className="mr-2" />
            Informations
          </button>
          <button
            role="tab"
            className={`tab ${activeSubTab === "ecolage" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("ecolage")}
          >
            <Wallet size={16} className="mr-2" />
            Écolage
          </button>
          <button
            role="tab"
            className={`tab ${activeSubTab === "absences" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("absences")}
          >
            <Calendar size={16} className="mr-2" />
            Absences & retards
          </button>
          <button
            role="tab"
            className={`tab ${activeSubTab === "parcours" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("parcours")}
          >
            <BookOpen size={16} className="mr-2" />
            Parcours & évaluations
          </button>
          <button
            role="tab"
            className={`tab ${activeSubTab === "vie-scolaire" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("vie-scolaire")}
          >
            <ClipboardCheck size={16} className="mr-2" />
            Vie scolaire
          </button>
          <button
            role="tab"
            className={`tab ${activeSubTab === "documents" ? "tab-active" : ""}`}
            onClick={() => handleTabChange("documents")}
          >
            <FileText size={16} className="mr-2" />
            Dossiers & documents
          </button>
        </div>

        {activeSubTab === "informations" && (
          <div>
            <div role="tablist" className="tabs tabs-boxed mb-6">
              {informationTabs.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  role="tab"
                  className={`tab ${activeInfoSubTab === value ? "tab-active" : ""}`}
                  onClick={() => setActiveInfoSubTab(value)}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
            {renderInformationContent()}
          </div>
        )}

        {activeSubTab === "ecolage" && (
          <div>
            <div role="tablist" className="tabs tabs-boxed mb-6">
              {ecolageTabs.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  role="tab"
                  className={`tab ${activeEcolageSubTab === value ? "tab-active" : ""}`}
                  onClick={() => setActiveEcolageSubTab(value)}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
            {renderEcolageContent()}
          </div>
        )}

        {activeSubTab === "absences" && (
          <div>
            <div role="tablist" className="tabs tabs-boxed mb-6">
              {absenceTabs.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  role="tab"
                  className={`tab ${activeAbsenceSubTab === value ? "tab-active" : ""}`}
                  onClick={() => setActiveAbsenceSubTab(value)}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
            {renderAbsenceContent()}
          </div>
        )}

        {activeSubTab === "parcours" && (
          <div>
            <div role="tablist" className="tabs tabs-boxed mb-6">
              {parcoursTabs.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  role="tab"
                  className={`tab ${activeParcoursSubTab === value ? "tab-active" : ""}`}
                  onClick={() => setActiveParcoursSubTab(value)}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
            {renderParcoursContent()}
          </div>
        )}

        {activeSubTab === "vie-scolaire" && (
          <div>
            <div role="tablist" className="tabs tabs-boxed mb-6">
              {vieScolaireTabs.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  role="tab"
                  className={`tab ${activeVieScolaireSubTab === value ? "tab-active" : ""}`}
                  onClick={() => setActiveVieScolaireSubTab(value)}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
            {renderVieScolaireContent()}
          </div>
        )}

        {activeSubTab === "documents" && (
          <div>
            <div role="tablist" className="tabs tabs-boxed mb-6">
              {documentTabs.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  role="tab"
                  className={`tab ${activeDocumentSubTab === value ? "tab-active" : ""}`}
                  onClick={() => setActiveDocumentSubTab(value)}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
            {renderDocumentContent()}
          </div>
        )}
      </div>
    </>
  );
}

export default GestionElevesPage;
