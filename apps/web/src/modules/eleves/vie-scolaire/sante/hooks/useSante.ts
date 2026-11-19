import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiError } from "../../../../../lib/api";

export type TypeSuiviSante =
  | "ALLERGIE"
  | "VISITE_MEDICALE"
  | "SOIN"
  | "MALADIE"
  | "ACCIDENT";

export type GraviteSante = "FAIBLE" | "MODEREE" | "ELEVEE" | "URGENTE";

export type SuiviSanteBase = {
  id: string;
  schoolId: string;
  eleveId: string;
  type: TypeSuiviSante;
  titre: string;
  description: string | null;
  gravite: GraviteSante | null;
  dateEvenement: string;
  dateFin: string | null;
  parentNotifieAt: string | null;
  archiveeAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SuiviSante = SuiviSanteBase & {
  createdBy: {
    id: string;
    nom: string;
    prenom: string;
  };
};

export type CreerSuiviSanteResponse = SuiviSanteBase & {
  nbParentsNotifies: number;
};

export type ModifierSuiviSanteResponse = SuiviSanteBase;

export type SuiviSanteFiltres = {
  type?: TypeSuiviSante;
  from?: string;
  to?: string;
};

export type ListeSuiviSanteResponse = {
  data: SuiviSante[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreerSuiviSanteInput = {
  eleveId: string;
  type: TypeSuiviSante;
  titre: string;
  description?: string | null;
  gravite?: GraviteSante | null;
  dateEvenement: string;
  dateFin?: string | null;
  notifierParents?: boolean;
};

export type ModifierSuiviSanteInput = {
  titre?: string;
  description?: string | null;
  gravite?: GraviteSante | null;
  dateEvenement?: string;
  dateFin?: string | null;
};

const BASE_URL = "/api/eleves/vie-scolaire/sante";

export const santeKeys = {
  all: ["suivis-sante"] as const,
  eleve: (eleveId: string | undefined, filtres: SuiviSanteFiltres) =>
    [...santeKeys.all, eleveId ?? "", filtres] as const,
};

export function useSuivisSante(
  eleveId: string | undefined,
  filtres: SuiviSanteFiltres,
) {
  return useQuery({
    queryKey: santeKeys.eleve(eleveId, filtres),
    queryFn: async () => {
      const { data } = await api.get<ListeSuiviSanteResponse>(
        `${BASE_URL}/eleve/${eleveId}`,
        {
          params: {
            type: filtres.type || undefined,
            from: filtres.from || undefined,
            to: filtres.to || undefined,
            page: 1,
            limit: 100,
          },
        },
      );
      return data;
    },
    enabled: !!eleveId,
  });
}

export function useCreerSuiviSante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreerSuiviSanteInput) => {
      const { data } = await api.post<CreerSuiviSanteResponse>(BASE_URL, input);
      return data;
    },
    onSuccess: async (data, input) => {
      await queryClient.invalidateQueries({
        queryKey: santeKeys.all,
      });

      if (input.type === "MALADIE") {
        toast.success(
          data.nbParentsNotifies > 0
            ? `Épisode de maladie enregistré. ${data.nbParentsNotifies} parent(s) lié(s) à un compte ont été notifié(s).`
            : "Épisode de maladie enregistré. Aucun parent n’a été notifié (aucun compte parent lié).",
        );
        return;
      }

      if (input.type === "ACCIDENT" && input.notifierParents) {
        toast.success(
          data.nbParentsNotifies > 0
            ? `Incident enregistré. ${data.nbParentsNotifies} parent(s) lié(s) à un compte ont été notifié(s).`
            : "Incident enregistré. Aucun parent n’a été notifié (aucun compte parent lié).",
        );
        return;
      }

      toast.success("Information de santé enregistrée.");
    },
    onError: (error) =>
      toast.error(
        getApiError(error, "Impossible d’enregistrer l’information."),
      ),
  });
}

export function useModifierSuiviSante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      suiviId,
      input,
    }: {
      suiviId: string;
      input: ModifierSuiviSanteInput;
    }) => {
      const { data } = await api.patch<ModifierSuiviSanteResponse>(
        `${BASE_URL}/${suiviId}`,
        input,
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: santeKeys.all,
      });
      toast.success("Suivi de santé modifié.");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible de modifier le suivi.")),
  });
}

export function useArchiverSuiviSante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suiviId: string) => {
      await api.delete(`${BASE_URL}/${suiviId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: santeKeys.all,
      });
      toast.success("Suivi de santé archivé.");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Impossible d’archiver le suivi.")),
  });
}
