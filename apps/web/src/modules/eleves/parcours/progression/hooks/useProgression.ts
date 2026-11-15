import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../../lib/api";

export type ProgressionFiltres = {
  classeId?: string;
  periodeId?: string;
  matiereId?: string;
};

export type ProgressionOption = {
  id: string;
  nom: string;
};

export type ProgressionPeriodeOption = ProgressionOption & {
  anneeScolaire: string;
};

export type ProgressionPoint = {
  periode: {
    id: string;
    nom: string;
    anneeScolaire: string;
  } | null;
  date: string | null;
  moyenne: number | null;
  matiere?: {
    id: string;
    nom: string;
  };
};

export type ProgressionMatiere = {
  id: string;
  nom: string;
  moyenne: number | null;
};

export type ProgressionResponse = {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    matricule: number;
    classe: {
      id: string;
      nom: string;
    } | null;
  };
  points: ProgressionPoint[];
  resume: {
    moyenneGenerale: number | null;
    meilleureMatiere: ProgressionMatiere | null;
    moinsBonneMatiere: ProgressionMatiere | null;
    tendance: "HAUSSE" | "BAISSE" | "STABLE" | null;
  };
};

export const progressionKeys = {
  all: ["parcours-progression"] as const,
  eleve: (eleveId: string | undefined, filtres: ProgressionFiltres) =>
    [...progressionKeys.all, "eleve", eleveId ?? "", filtres] as const,
  periodes: (classeId: string) =>
    [...progressionKeys.all, "periodes", classeId] as const,
};

/**
 *
 * @param eleveId
 * @param filtres
 * @returns
 */
export function useProgression(
  eleveId: string | undefined,
  filtres: ProgressionFiltres,
) {
  return useQuery({
    queryKey: progressionKeys.eleve(eleveId, filtres),
    queryFn: async () => {
      const { data } = await api.get<ProgressionResponse>(
        `/api/eleves/parcours/progression/${eleveId}`,
        {
          params: {
            classeId: filtres.classeId || undefined,
            periodeId: filtres.periodeId || undefined,
            matiereId: filtres.matiereId || undefined,
          },
        },
      );
      return data;
    },
    enabled: !!eleveId, //
  });
}

/**
 *
 * @param classeId
 * @returns
 */
export function useProgressionPeriodes(classeId: string) {
  return useQuery({
    queryKey: progressionKeys.periodes(classeId),
    queryFn: async () => {
      const { data } = await api.get<ProgressionPeriodeOption[]>(
        `/api/classes/${classeId}/notes/periodes`,
      );
      return data; //
    },
    enabled: !!classeId,
  });
}
