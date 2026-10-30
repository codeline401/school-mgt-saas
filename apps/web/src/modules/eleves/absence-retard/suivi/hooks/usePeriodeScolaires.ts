import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../../lib/api";
import type { PeriodeScolaire } from "../utils/periode";

/**
 * Hook pour récupérer les périodes scolaires depuis l'API.
 * @returns Une requête React Query contenant les périodes scolaires.
 */
export function usePeriodesScolaires() {
  return useQuery({
    queryKey: ["periodes-scolaires"],
    queryFn: async () => {
      const { data } = await api.get<PeriodeScolaire[]>("/api/periodes");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
