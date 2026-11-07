import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../../lib/api";

export type OptionNom = { id: string; nom: string };

/**
 * Récupère la liste des classes disponibles pour les filtres des notes.
 * @returns Une liste d'options de classes sous forme de `{ id: string; nom: string }[]`
 */
export function useClassesOptions() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get<OptionNom[]>("/api/classes");
      return data;
    },
  });
}

/**
 * Récupère la liste des matières disponibles pour une classe donnée.
 * @param classeId L'identifiant de la classe pour laquelle récupérer les matières.
 * @returns Une liste d'options de matières sous forme de `{ id: string; nom: string }[]`
 */
export function useMatieresOptions(classeId: string) {
  return useQuery({
    queryKey: ["classe-matieres", classeId],
    queryFn: async () => {
      const { data } = await api.get<OptionNom[]>(
        `/api/classes/${classeId}/matieres`,
      );
      return data;
    },
    enabled: !!classeId, // La requête ne sera exécutée que si `classeId` est défini
  });
}

/**
 * Récupère la liste des périodes disponibles pour une classe donnée.
 * @param classeId L'identifiant de la classe pour laquelle récupérer les périodes.
 * @returns Une liste d'options de périodes sous forme de `{ id: string; nom: string }[]`
 */
export function usePeriodesOptions(classeId: string) {
  return useQuery({
    queryKey: ["classe-periodes", classeId],
    queryFn: async () => {
      const { data } = await api.get<OptionNom[]>(
        `/api/classes/${classeId}/notes/periodes`,
      );
      return data;
    },
    enabled: !!classeId, // La requête ne sera exécutée que si `classeId` est défini
  });
}
