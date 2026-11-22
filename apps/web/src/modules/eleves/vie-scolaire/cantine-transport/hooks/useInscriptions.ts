import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useOffresCantine,
  type OffreCantine,
} from "../../../../logistique/hooks/useCantine";
import {
  useAffectations,
  useCreateAffectation,
  useRoutes,
  type AffectationTransport,
  type CreateAffectationInput,
  type Route,
} from "../../../../logistique/hooks/useTransport";
import { api, getApiError } from "../../../../../lib/api";
import toast from "react-hot-toast";

export type AffectationCantine = {
  id: string;
  eleveId: string;
  offreCantineId: string;
  schoolId: string;
  statut: "ACTIVE" | "SUSPENDUE" | "TERMINEE";
  dateDebut: string;
  dateFin: string | null;
  regimeSpecial: string | null;
  offreCantine: OffreCantine;
  createdAt: string;
};

const CANTINE_URL = "/api/eleves/vie-scolaire/cantine/affectations";

export const inscriptonsCantineKeys = {
  all: ["eleve-inscriptions-cantine"] as const,
  cantine: (eleveId: string | undefined) =>
    [...inscriptonsCantineKeys.all, "cantine", eleveId ?? ""] as const,
};

/**
 * Récupère les offres de cantine actives pour une année scolaire donnée.
 * @param anneeScolaire L'année scolaire pour laquelle récupérer les offres de cantine actives.
 * @returns Les offres de cantine actives pour l'année scolaire spécifiée.
 */
export function useOffresCantineActives(anneeScolaire: string) {
  return useOffresCantine({
    anneeScolaire,
    actif: true,
  });
}

/**
 * Récupère les routes de transport scolaire qui sont actuellement actives.
 * @returns Les routes actives pour le transport scolaire.
 */
export function useRoutesActives() {
  return useRoutes({ statut: "ACTIVE" });
}

/**
 * Récupère l'affectation de transport active pour un élève donné.
 * @param eleveId L'identifiant de l'élève pour lequel récupérer l'affectation de transport active.
 * @returns L'affectation de transport active de l'élève, si elle existe.
 */
export function useAffectationTransportEleve(eleveId: string | undefined) {
  return useAffectations(eleveId ? { eleveId, statut: "ACTIVE" } : undefined);
}

/**
 * Récupère l'affectation de cantine pour un élève donné.
 * @param eleveId L'identifiant de l'élève pour lequel récupérer l'affectation de cantine.
 * @returns L'affectation de cantine de l'élève, si elle existe.
 */
export function useAffectationCantineEleve(eleveId: string | undefined) {
  return useQuery({
    queryKey: inscriptonsCantineKeys.cantine(eleveId), // Clé unique pour l'affectation de cantine de l'élève
    queryFn: async () => {
      const { data } = await api.get<AffectationCantine[]>(
        `${CANTINE_URL}/eleve/${eleveId}`,
      );
      return data;
    },
    enabled: !!eleveId, // La requête ne s'exécute que si eleveId est défini
  });
}

/**
 * Crée une nouvelle affectation de cantine pour un élève donné.
 * @returns Un objet de mutation permettant de créer une affectation de cantine et de gérer les états de succès et d'erreur.
 */
export function useCreerAffectationCantine() {
  const queryClient = useQueryClient(); // Permet de gérer le cache des requêtes après la création d'une affectation de cantine

  return useMutation({
    mutationFn: async (input: {
      eleveId: string;
      offreCantineId: string;
      dateDebut: string;
      dateFin?: string | null;
      regimeSpecial?: string | null;
    }) => {
      const { data } = await api.post<AffectationCantine>(CANTINE_URL, input);
      return data; // Retourne l'affectation de cantine créée
    },
    onSuccess: async (_, input) => {
      await queryClient.invalidateQueries({
        queryKey: inscriptonsCantineKeys.cantine(input.eleveId), // Invalide le cache pour l'affectation de cantine de l'élève
      });
      toast.success("Affectation de l'élève à la cantine créée avec succès"); // Affiche un message de succès après la création de l'affectation de cantine
    },
    onError: (error) => {
      toast.error(
        getApiError(error, "Impossible d'inscrire l'élève à la cantine"),
      );
    },
  });
}

/**
 * Termine l'affectation de cantine pour un élève donné.
 * @param eleveId L'identifiant de l'élève pour lequel terminer l'affectation de cantine.
 * @returns Un objet de mutation permettant de terminer l'affectation de cantine et de gérer les états de succès et d'erreur.
 */
export function useTerminerAffectationCantine(eleveId: string | undefined) {
  const queryClient = useQueryClient(); // Permet de gérer le cache des requêtes après la terminaison d'une affectation de cantine

  return useMutation({
    mutationFn: async (affectationId: string) => {
      await api.patch(`${CANTINE_URL}/${affectationId}/terminer`, {}); // Termine l'affectation de cantine pour l'élève
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: inscriptonsCantineKeys.cantine(eleveId), // Invalide le cache pour l'affectation de cantine de l'élève
      });
      toast.success("Affectation de l'élève à la cantine terminée avec succès"); // Affiche un message de succès après la terminaison de l'affectation de cantine
    },
    onError: (error) => {
      toast.error(
        getApiError(
          error,
          "Impossible de terminer l'affectation de l'élève à la cantine",
        ),
      );
    },
  });
}

export type {
  AffectationTransport,
  CreateAffectationInput,
  OffreCantine,
  Route,
}; // Types exportés pour les affectations de transport et de cantine, ainsi que pour les routes et les offres de cantine
export { useCreateAffectation }; // Permet de créer une nouvelle affectation de cantine pour un élève donné
