import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../../../../lib/api";

export type StatutPresence = "PRESENT" | "ABSENT" | "RETARD";

export type SuiviFiltres = {
  from: string;
  to: string;
  statut?: StatutPresence;
  page: number;
  limit: number;
};

export type SuiviLigne = {
  id: string;
  date: string;
  statut: StatutPresence;
  heureDebut: string;
  heureFin: string;
  matiere: string | null;
  intitule: string | null;
};

export type SuiviResponse = {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    classe: { id: string; nom: string } | null;
  };
  periode: { from: string; to: string };
  resume: {
    totalAppels: number;
    present: number;
    absent: number;
    retard: number;
    tauxPresence: number;
  };
  data: SuiviLigne[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const suiviAbsenceKeys = {
  all: ["suivi-absences"] as const,
  detail: (eleveId: string, filtres: SuiviFiltres) =>
    [...suiviAbsenceKeys.all, eleveId, filtres] as const,
};

export function useSuiviAbsences(
  eleveId: string | undefined,
  filtres: SuiviFiltres,
) {
  return useQuery({
    queryKey: suiviAbsenceKeys.detail(eleveId ?? "", filtres),
    queryFn: async () => {
      const { data } = await api.get<SuiviResponse>(
        `/api/eleves/absences/suivi/${eleveId}`,
        { params: filtres },
      );
      return data;
    },
    enabled: !!eleveId && filtres.from <= filtres.to,
    placeholderData: keepPreviousData, // Keep the previous data while fetching new data, ça évite le clignotement côté frontend
  });
}
