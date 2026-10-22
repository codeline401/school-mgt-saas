import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiError } from "../../../../../lib/api";

// Types et hooks pour gérer les ajournements des élèves
export type StatutAjournement =
  | "EN_ATTENTE"
  | "ACCEPTE"
  | "REFUSE"
  | "CONTRE_PROPOSITION"
  | "CONTRE_PROPOSITION_ACCEPTE"
  | "CONTRE_PROPOSITION_REFUSE"
  | "ANNULE";

// Représente une ligne d'ajournement pour un élève, incluant les informations sur l'élève, l'écollage et les dates associées
export type AjournementLigne = {
  id: string;
  eleve: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  };
  ecolage: {
    id: string;
    anneeScolaire: string;
    mois: number;
    montant: string;
    statutPaiement: string;
  };
  dateEcheanceOrigine: string;
  dateDemandee: string;
  dateProposee: string | null;
  dateAppliquee: string | null;
  estActive: boolean;
};

// Représente un ajournement complet, incluant le statut, le motif, les dates et les lignes associées
export type Ajournement = {
  id: string;
  statut: StatutAjournement;
  motif: string;
  commentaireAdmin: string | null;
  dateDecision: string | null;
  dateResponseParent: string | null;
  parent: { id: string; nom: string; prenom: string };
  traitePar: { id: string; nom: string; prenom: string } | null;
  lignes: AjournementLigne[];
  createdAt: string;
  updatedAt: string;
};

// Représente la réponse de l'API pour la liste des ajournements, incluant les données et la pagination
export type AjournementListResponse = {
  data: Ajournement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Représente les filtres utilisés pour récupérer la liste des ajournements
export type AjournementFilters = {
  page: number;
  limit: number;
  statut?: StatutAjournement;
  eleveId?: string;
  parentId?: string;
  dateDebut?: string;
  dateFin?: string;
};

// Représente les données nécessaires pour créer un nouvel ajournement
export type CreerAjournementInput = {
  motif: string;
  lignes: Array<{ ecolageId: string; dateDemandee: string }>;
};

// Représente les données nécessaires pour refuser un ajournement
export type RefuserAjournementInput = {
  id: string;
  commentaire: string;
};

// Représente les données nécessaires pour faire une contre-proposition sur un ajournement
export type ContrePropositionInput = {
  id: string;
  commentaire: string;
  lignes: Array<{ ligneId: string; dateProposee: string }>;
};

const AJOURNEMENTS_URL = "/api/eleves/ecolages/ajournements";

export const ajournementKeys = {
  // Clés de cache pour les ajournements
  all: ["ajournements"] as const,
  list: (filters: AjournementFilters) =>
    [...ajournementKeys.all, "list", filters] as const,
  mine: (page: number, limit: number) =>
    [...ajournementKeys.all, "mine", page, limit] as const,
  detail: (id: string) => [...ajournementKeys.all, "detail", id] as const,
};

/**
 * Utilise une mutation pour effectuer une opération sur un ajournement (création, acceptation, refus, contre-proposition, etc.)
 * @param request La fonction qui effectue la requête API pour l'ajournement
 * @param successMessage Le message de succès à afficher en cas de réussite de la mutation
 * @returns La mutation utilisée pour effectuer l'opération sur l'ajournement
 */
function useAjournementMutation<TInput>(
  request: (input: TInput) => Promise<unknown>,
  successMessage: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ajournementKeys.all });
      toast.success(successMessage);
    },
    onError: (error) => {
      toast.error(getApiError(error, "L'opération a échoué."));
    },
  });
}

/**
 * Utilise une requête pour récupérer la liste des ajournements en fonction des filtres spécifiés
 * @param filters Les filtres utilisés pour récupérer la liste des ajournements
 * @returns Les ajournements correspondant aux filtres spécifiés
 */
export function useAjournements(filters: AjournementFilters) {
  return useQuery({
    queryKey: ajournementKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<AjournementListResponse>(
        AJOURNEMENTS_URL,
        { params: filters },
      );
      return data;
    },
  });
}

/**
 * Utilise une requête pour récupérer la liste des ajournements de l'utilisateur en fonction de la pagination spécifiée
 * @param page Le numéro de la page à récupérer
 * @param limit Le nombre d'éléments par page
 * @returns Les ajournements de l'utilisateur correspondant à la page et au limite spécifiées
 */
export function useMesAjournements(page = 1, limit = 10) {
  return useQuery({
    queryKey: ajournementKeys.mine(page, limit),
    queryFn: async () => {
      const { data } = await api.get<AjournementListResponse>(
        `${AJOURNEMENTS_URL}/me`,
        { params: { page, limit } },
      );
      return data;
    },
  });
}

/**
 * Utilise une mutation pour créer un nouvel ajournement
 * @returns La mutation utilisée pour créer l'ajournement
 */
export function useCreerAjournement() {
  return useAjournementMutation(async (input: CreerAjournementInput) => {
    const { data } = await api.post<Ajournement>(AJOURNEMENTS_URL, input);
    return data;
  }, "Demande d'ajournement envoyée.");
}

/**
 * Utilise une mutation pour accepter un ajournement
 * @returns La mutation utilisée pour accepter l'ajournement
 */
export function useAccepterAjournement() {
  return useAjournementMutation(
    async ({ id, commentaire }: { id: string; commentaire?: string }) => {
      const { data } = await api.patch<Ajournement>(
        `${AJOURNEMENTS_URL}/${id}/accepter`,
        { commentaire },
      );
      return data;
    },
    "Demande acceptée.",
  );
}

/**
 * Utilise une mutation pour refuser un ajournement
 * @returns La mutation utilisée pour refuser l'ajournement
 */
export function useRefuserAjournement() {
  return useAjournementMutation(
    async ({ id, commentaire }: RefuserAjournementInput) => {
      const { data } = await api.patch<Ajournement>(
        `${AJOURNEMENTS_URL}/${id}/refuser`,
        { commentaire },
      );
      return data;
    },
    "Demande refusée.",
  );
}

/**
 * Utilise une mutation pour envoyer une contre-proposition pour un ajournement
 * @returns La mutation utilisée pour envoyer la contre-proposition
 */
export function useContreProposerAjournement() {
  return useAjournementMutation(
    async ({ id, ...input }: ContrePropositionInput) => {
      const { data } = await api.patch<Ajournement>(
        `${AJOURNEMENTS_URL}/${id}/contre-proposition`,
        input,
      );
      return data;
    },
    "Contre-proposition envoyée.",
  );
}

/**
 * Utilise une mutation pour annuler un ajournement
 * @returns La mutation utilisée pour annuler l'ajournement
 */
export function useAnnulerAjournement() {
  return useAjournementMutation(async (id: string) => {
    const { data } = await api.patch<Ajournement>(
      `${AJOURNEMENTS_URL}/me/${id}/annuler`,
      {},
    );
    return data;
  }, "Demande annulée.");
}

/**
 * Utilise une mutation pour répondre à une contre-proposition pour un ajournement
 * @returns La mutation utilisée pour répondre à la contre-proposition
 */
export function useRepondreContreProposition() {
  return useAjournementMutation(
    async ({
      id,
      decision,
    }: {
      id: string;
      decision: "ACCEPTER" | "REFUSER";
    }) => {
      const { data } = await api.patch<Ajournement>(
        `${AJOURNEMENTS_URL}/me/${id}/reponse`,
        { decision },
      );
      return data;
    },
    "Réponse envoyée.",
  );
}
