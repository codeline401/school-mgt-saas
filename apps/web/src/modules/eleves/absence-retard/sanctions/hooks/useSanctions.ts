import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../../../../../lib/api";
import toast from "react-hot-toast";

export type TypeSanction =
  | "AVERTISSEMENT"
  | "BLAME"
  | "RETENUE"
  | "EXCLUSION_TEMPORAIRE"
  | "CONVOCATION_PARENT"
  | "AUTRE";

export type StatutSanction = "EN_COURS" | "TERMINEE" | "ANNULEE";

export type Sanction = {
  id: string;
  eleveId: string;
  type: TypeSanction;
  motif: string;
  details: string | null;
  dateSanction: string;
  dateFin: string | null;
  statut: StatutSanction;
  createdAt: string;
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
  };
  createdBy?: {
    id: string;
    nom: string;
    prenom: string;
  };
};

export type SanctionFiltres = {
  eleveId?: string;
  type?: TypeSanction;
  statut?: StatutSanction;
  from?: string;
  to?: string;
  page: number;
  limit: number;
};

export type ListeSanctionsResponse = {
  data: Sanction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreerSanctionInput = {
  eleveId: string;
  type: TypeSanction;
  motif: string;
  details?: string | null;
  dateSanction: string;
  dateFin?: string | null;
};

export type ModifierSanctionInput = Omit<CreerSanctionInput, "eleveId">; // Les champs nécessaires pour modifier une sanction, sans l'ID de l'élève

const BASE_URL = "/api/eleves/absences/sanctions";

export const sanctionKeys = {
  all: ["sanctions-eleves"] as const,
  liste: (filtre: SanctionFiltres) =>
    [...sanctionKeys.all, "liste", filtre] as const, //
};

export function useSanctions(filtres: SanctionFiltres) {
  return useQuery({
    queryKey: sanctionKeys.liste(filtres), //
    queryFn: async () => {
      const { data } = await api.get<ListeSanctionsResponse>(BASE_URL, {
        params: {
          ...filtres,
          eleveId: filtres.eleveId || undefined,
          type: filtres.type || undefined,
          statut: filtres.statut || undefined,
          from: filtres.from || undefined,
          to: filtres.to || undefined,
        },
      });
      return data;
    },
    placeholderData: (previous) => previous, //
  });
}

function useInvalidateSancions() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: sanctionKeys.all });
}

export function useCreerSanction() {
  const invalidate = useInvalidateSancions(); //

  return useMutation({
    mutationFn: async (input: CreerSanctionInput) => {
      const { data } = await api.post(BASE_URL, input);
      return data;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Sanction enregistrée");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible d'enregistrer la sanction")),
  });
}

export function useModifierSanction() {
  const invalidate = useInvalidateSancions();

  return useMutation({
    mutationFn: async ({
      sanctionId,
      input,
    }: {
      sanctionId: string;
      input: ModifierSanctionInput;
    }) => {
      const { data } = await api.put<Sanction>(
        `${BASE_URL}/${sanctionId}`,
        input,
      );
      return data;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Sanction modifiée");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible de modifier la sanction")),
  });
}

export function useChangerStatutSanction() {
  const invalidate = useInvalidateSancions();

  return useMutation({
    mutationFn: async ({
      sanctionId,
      statut,
    }: {
      sanctionId: string;
      statut: Exclude<StatutSanction, "EN_COURS">;
    }) => {
      const { data } = await api.patch<Sanction>(
        `${BASE_URL}/${sanctionId}/statut`,
        { statut },
      );
      return data;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Statut de la sanction mis à jour");
    },
    onError: (error) =>
      toast.error(
        getApiError(error, "Impossible de changer le statut de la sanction"),
      ),
  });
}
