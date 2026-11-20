import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiError } from "../../../lib/api";

export type JourSemaine =
  | "LUNDI"
  | "MARDI"
  | "MERCREDI"
  | "JEUDI"
  | "VENDREDI"
  | "SAMEDI"
  | "DIMANCHE";

export type OffreCantine = {
  id: string;
  nom: string;
  description: string | null;
  anneeScolaire: string;
  tarifMensuel: number | string;
  joursSemaine: JourSemaine[];
  actif: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
};

export type OffreCantineInput = {
  nom: string;
  description?: string | null;
  anneeScolaire: string;
  tarifMensuel: number;
  joursSemaine: JourSemaine[];
};

export type ModifierOffreCantineInput = Partial<OffreCantineInput> & {
  actif?: boolean;
};

const BASE_URL = "/api/logistique/cantine/offres";

export const cantineKeys = {
  all: ["logistique-cantine-offres"] as const,
  list: (filters?: { anneeScolaire?: string; actif?: boolean }) =>
    [...cantineKeys.all, filters] as const,
};

export function useOffresCantine(filters?: {
  anneeScolaire?: string;
  actif?: boolean;
}) {
  return useQuery({
    queryKey: cantineKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<OffreCantine[]>(BASE_URL, {
        params: {
          anneeScolaire: filters?.anneeScolaire || undefined,
          actif:
            filters?.actif === undefined ? undefined : String(filters.actif),
        },
      });
      return data;
    },
  });
}

export function useCreerOffreCantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OffreCantineInput) => {
      const { data } = await api.post<OffreCantine>(BASE_URL, input);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cantineKeys.all });
      toast.success("Forfait cantine créé.");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible de créer le forfait.")),
  });
}

export function useModifierOffreCantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offreId,
      input,
    }: {
      offreId: string;
      input: ModifierOffreCantineInput;
    }) => {
      const { data } = await api.patch<OffreCantine>(
        `${BASE_URL}/${offreId}`,
        input,
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cantineKeys.all });
      toast.success("Forfait cantine modifié.");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible de modifier le forfait.")),
  });
}

export function useDesactiverOffreCantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offreId: string) => {
      await api.delete(`${BASE_URL}/${offreId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cantineKeys.all });
      toast.success("Forfait cantine désactivé.");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible de désactiver le forfait.")),
  });
}
