import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { Classe } from "@school-mgt/types";
import VueGeneraleTab from "../components/classe/VueGeneraleTab";
import EleveTab from "../components/classe/EleveTab";
import MatieresTab from "../components/classe/MatieresTab";
import NotesTab from "../components/classe/NotesTab";
import DocumentsTab from "../components/classe/DocumentsTab";
import EmploiDuTempsTab from "../components/classe/EmploiDuTempsTab";
import AbsenceTab from "../components/classe/AbsenceTab";
import AbsenceStatsTab from "../components/classe/AbsenceStatsTab";

// Définition des onglets pour la page de profil de classe
const TABS = [
  { id: "vue-generale", label: "Vue générale" },
  { id: "eleves", label: "Élèves" },
  { id: "emploi-du-temps", label: "Emploi du temps" },
  { id: "matieres", label: "Matières" },
  { id: "notes", label: "Notes" },
  { id: "absences", label: "Absences" },
  { id: "stats-absences", label: "Stats présences" },
  { id: "documents", label: "Documents" },
] as const;

type TabId = (typeof TABS)[number]["id"]; // Type pour les IDs d'onglets

export default function ClasseProfilPage() {
  const { id } = useParams<{ id: string }>(); // Récupère l'ID de la classe depuis l'URL
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user); // Récupère les informations de l'utilisateur connecté
  const [activeTab, setActiveTab] = useState<TabId>("vue-generale"); // État pour l'onglet actif

  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN"; // Vérifie si l'utilisateur a les droits d'édition

  // Chargement de la classe
  const {
    data: classe,
    isLoading,
    isError,
  } = useQuery<Classe>({
    queryKey: ["classe", id], // Clé de la requête pour le cache
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${id}`); // Requête pour récupérer les détails de la classe
      return data; // Retourne les données de la classe
    },
    enabled: !!id, // N'exécute la requête que si l'ID est présent
  });

  // Etat de chergement / erreur
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isError || !classe) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/classes")}
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft size={16} />
          Retour aux classes
        </button>
      </div>
    );
  }

  // Rendu de l'onglet actif
  const renderTab = () => {
    if (!id) return null; // Sécurité pour s'assurer que l'ID est défini avant de rendre les composants qui en dépendent
    switch (activeTab) {
      case "vue-generale":
        return (
          <VueGeneraleTab classeId={id} canEdit={canEdit} classe={classe} />
        );
      case "eleves":
        return <EleveTab classeId={id} canEdit={canEdit} />;

      case "emploi-du-temps":
        return (
          <EmploiDuTempsTab
            classeId={id}
            canManage={
              user?.role === "SUDO_ADMIN" ||
              user?.role === "ADMIN" ||
              user?.role === "USER"
            }
          />
        );
      case "matieres":
        return <MatieresTab classeId={id} canEdit={canEdit} />;
      case "notes":
        return (
          <NotesTab
            classeId={id}
            canWrite={user?.role === "PROF" || user?.role === "SUDO_ADMIN"}
            canRead={user?.role === "ADMIN" || user?.role === "SUDO_ADMIN"}
          />
        );
      case "absences":
        return (
          <AbsenceTab
            classeId={id}
            canManage={
              user?.role === "SUDO_ADMIN" ||
              user?.role === "ADMIN" ||
              user?.role === "PROF"
            }
          />
        );
      case "stats-absences":
        return <AbsenceStatsTab classeId={id} />;
      case "documents":
        return (
          <DocumentsTab
            classeId={id}
            canUpload={
              user?.role === "PROF" ||
              user?.role === "ADMIN" ||
              user?.role === "USER" ||
              user?.role === "SUDO_ADMIN"
            }
          />
        );
      default:
        return null;
    }
  };

  // RENDU PRINCIPAL
  return (
    <div className="space-y-6">
      {/** En-tête */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/classes")}
          className="btn btn-primary btn-sm gap-2"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          <h1 className="text-2xl font-bold">{classe.nom}</h1>
        </div>
      </div>

      {/** Onglets */}
      <div role="tablist" className="tabs tabs-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/** Contenu de l'onglet actif */}
      <div>{renderTab()} </div>
    </div>
  );
}
