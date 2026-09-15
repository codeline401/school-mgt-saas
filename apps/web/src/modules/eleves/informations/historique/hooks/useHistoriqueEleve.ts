import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../../lib/api";

type HistoriqueClasseRef = {
  id: string;
  nom: string;
} | null;

export type HistoriqueAcademicEntry = {
  id: string;
  anneeScolaire: string;
  classe:
    | (HistoriqueClasseRef & {
        niveau: string | null;
        section: string | null;
        option: string | null;
      })
    | null;
  statut: string | null;
  dateInscription: string;
  source: "INSCRIPTION" | "HISTORIQUE_CLASSE";
};

export type HistoriqueClassChangeEntry = {
  id: string;
  anneeScolaire: string;
  type: string;
  motif: string | null;
  ancienneClasse: HistoriqueClasseRef;
  nouvelleClasse: HistoriqueClasseRef;
  changedAt: string;
};

export type HistoriqueAdministrativeEvent = {
  id: string;
  type: "ADMISSION" | "STATUT_ELEVE" | "FIN_ANNEE";
  status: string | null;
  description: string;
  date: string;
};

export type HistoriquePaymentEntry = {
  id: string;
  anneeScolaire: string;
  mois: number;
  montant: string;
  classe: HistoriqueClasseRef;
  createdAt: string;
  updatedAt: string;
};

export type HistoriqueEleve = {
  eleve: {
    id: string;
    matricule: number;
    nom: string;
    prenom: string;
    statut: string;
    situationFinAnnee: string | null;
    createdAt: string;
    updatedAt: string;
  };
  academicHistory: HistoriqueAcademicEntry[];
  classChanges: HistoriqueClassChangeEntry[];
  administrativeEvents: HistoriqueAdministrativeEvent[];
  paymentHistory: HistoriquePaymentEntry[];
  keyDates: {
    firstCreatedAt: string;
    lastUpdatedAt: string;
  };
};

export const historiqueEleveKeys = {
  all: ["historique-eleve"] as const,
  detail: (eleveId: string) =>
    [...historiqueEleveKeys.all, "detail", eleveId] as const,
};

/**
 * Charge le parcours et l'historique complet d'un élève.
 */
export function useHistoriqueEleve(eleveId?: string) {
  return useQuery({
    queryKey: historiqueEleveKeys.detail(eleveId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<HistoriqueEleve>(
        `/api/eleves/informations/historique/${eleveId}`,
      );
      return data;
    },
    enabled: !!eleveId,
  });
}
