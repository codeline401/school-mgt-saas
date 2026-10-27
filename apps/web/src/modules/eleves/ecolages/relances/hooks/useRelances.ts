import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../../../../../lib/api";
import toast from "react-hot-toast";

export type TypeRelance = "MANUELLE" | "AUTOMATIQUE";
export type CanalRelance = "NOTIFICATION" | "EMAIL" | "SMS" | "WHATSAPP";
export type CiblageRelance = "ELEVES" | "CLASSE" | "TOUS_RETARDS";
export type StatutRelance =
  | "EN_ATTENTE"
  | "EN_COURS"
  | "ENVOYE"
  | "ECHOUE"
  | "ANNULEE";

export type Relance = {
  id: string;
  type: TypeRelance;
  canal: CanalRelance;
  ciblage: CiblageRelance;
  cibleIds: string[];
  message: string;
  statut: StatutRelance;
  dateProgrammee: string | null;
  dateExecution: string | null;
  recurrent: boolean;
  jourMois: number | null;
  nbDestinataires: number;
  nbEchecs: number;
  createdAt: string;
};

export type RelancesResponse = {
  data: Relance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FiltreDestinataires = {
  ciblage: CiblageRelance;
  cibleIds: string[];
};

export type CreerRelanceInput = FiltreDestinataires & {
  type: TypeRelance;
  canal: CanalRelance;
  message: string;
  dateProgrammee?: string;
  recurrent?: boolean;
  jourMois?: number;
};

export type ApercuRelance = {
  nbEleves: number;
  montantTotal: number;
  sansCompteParent: number;
};

const BASE_URL = "/api/eleves/ecolages/relances";

// Clés de cache pour les relances d'écolage
export const relanceKeys = {
  all: ["relances-ecolage"] as const,
  list: (page: number) => [...relanceKeys.all, "list", page] as const,
  apercu: (filtre: FiltreDestinataires) =>
    [...relanceKeys.all, "apercu", filtre] as const,
};

/**
 * Hook pour récupérer les relances d'écolage avec pagination
 * @param page Le numéro de la page des relances à récupérer
 * @returns Les relances d'écolage pour la page spécifiée, avec pagination
 */
export function useRelances(page: number) {
  return useQuery({
    queryKey: relanceKeys.list(page),
    queryFn: async () => {
      const { data } = await api.get<RelancesResponse>(BASE_URL, {
        params: { page, limit: 10 },
      });
      return data;
    },
  });
}

/**
 * Hook pour récupérer l'aperçu d'une relance d'écolage en fonction des destinataires filtrés
 * @param filtre Le filtre des destinataires pour l'aperçu de la relance
 * @param enabled Indique si la requête doit être activée ou non
 * @returns Les données de l'aperçu de la relance pour les destinataires filtrés
 */
export function useApercuRelance(
  filtre: FiltreDestinataires,
  enabled: boolean,
) {
  return useQuery({
    queryKey: relanceKeys.apercu(filtre),
    queryFn: async () => {
      const { data } = await api.post<ApercuRelance>(
        `${BASE_URL}/apercu`,
        filtre,
      );
      return data;
    },
    enabled,
  });
}

/**
 * Hook pour créer une relance d'écolage
 * @returns La mutation pour créer une relance d'écolage, avec gestion des succès et des erreurs
 */
export function useCreerRelance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreerRelanceInput) => {
      const { data } = await api.post<Relance>(BASE_URL, input, {
        timeout: 60_000, // review : set a 60-second timeout for creating a relance to handle potential delays in the API response
      });
      return data;
    },
    onSuccess: (relance) => {
      queryClient.invalidateQueries({ queryKey: relanceKeys.all });
      toast.success(
        relance.type === "MANUELLE"
          ? `Relance envoyée à ${relance.nbDestinataires} destinataire(s)`
          : "Relance programmée",
      );
    },
    onError: (error) => {
      toast.error(
        getApiError(
          error,
          "Une erreur est survenue lors de la création de la relance",
        ),
      );
    },
  });
}

/**
 * Hook pour annuler une relance d'écolage
 * @returns La mutation pour annuler une relance d'écolage, avec gestion des succès et des erreurs
 */
export function useAnnulerRelance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (relanceId: string) => {
      await api.patch(`${BASE_URL}/${relanceId}/annuler`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relanceKeys.all });
      toast.success("Relance programmée annulée");
    },
    onError: (error) => {
      toast.error(
        getApiError(
          error,
          "Une erreur est survenue lors de l'annulation de la relance",
        ),
      );
    },
  });
}
