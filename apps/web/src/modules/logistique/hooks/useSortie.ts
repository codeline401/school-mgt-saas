import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";

const API_URL = "/api/logistique/sortie";

// ==========================================
// TYPES
// ==========================================

export type TypeSortie =
  | "PEDAGOGIQUE"
  | "SPORTIVE"
  | "CULTURELLE"
  | "EXCURSION"
  | "VOYAGE"
  | "AUTRE";

export type StatutSortie =
  | "PLANIFIEE"
  | "CONFIRMEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULEE";

export type TypeParticipant = "ELEVE" | "ACCOMPAGNATEUR";

export type StatutParticipant =
  | "INSCRIT"
  | "CONFIRME"
  | "ANNULE"
  | "ABSENT"
  | "PRESENT";

export interface SortieScolaire {
  id: string;
  titre: string;
  description?: string;
  type: TypeSortie;
  statut: StatutSortie;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  adresseLieu?: string;
  classeId?: string;
  classe?: {
    id: string;
    nom: string;
  };
  organisateurId: string;
  organisateur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
  };
  coutParEleve?: number;
  budgetTotal?: number;
  moyenTransport?: string;
  equipementRequis?: string;
  consignes?: string;
  dateLimiteInscription?: string;
  dateLimiteAutorisation?: string;
  participants?: ParticipantSortie[];
  autorisations?: AutorisationParent[];
  _count?: {
    participants: number;
    autorisations: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantSortie {
  id: string;
  sortieId: string;
  typeParticipant: TypeParticipant;
  eleveId?: string;
  eleve?: {
    id: string;
    nom: string;
    prenom: string;
    classe?: {
      nom: string;
    };
  };
  accompagnateurId?: string;
  accompagnateur?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    role: string;
  };
  statut: StatutParticipant;
  montantPaye?: number;
  datePaiement?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutorisationParent {
  id: string;
  sortieId: string;
  eleveId: string;
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    classe?: {
      nom: string;
    };
  };
  parentId: string;
  parent: {
    id: string;
    nom: string;
    prenom: string;
    telephone?: string;
    email?: string;
  };
  autorise: boolean;
  dateAutorisation: string;
  observations?: string;
  signatureUrl?: string;
  contactUrgence?: string;
  telUrgence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatistiquesSortie {
  totalParticipants: number;
  totalEleves: number;
  totalAccompagnateurs: number;
  autorisations: {
    accordees: number;
    refusees: number;
    enAttente: number;
  };
  paiements: {
    montantTotal: number;
    montantAttendu: number;
    montantRestant: number;
  };
  participantsParStatut: {
    inscrits: number;
    confirmes: number;
    annules: number;
    presents: number;
    absents: number;
  };
}

export interface CreateSortieInput {
  titre: string;
  description?: string;
  type: TypeSortie;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  adresseLieu?: string;
  classeId?: string;
  coutParEleve?: number;
  budgetTotal?: number;
  moyenTransport?: string;
  equipementRequis?: string;
  consignes?: string;
  dateLimiteInscription?: string;
  dateLimiteAutorisation?: string;
}

export interface UpdateSortieInput {
  titre?: string;
  description?: string;
  type?: TypeSortie;
  statut?: StatutSortie;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
  adresseLieu?: string;
  classeId?: string;
  coutParEleve?: number;
  budgetTotal?: number;
  moyenTransport?: string;
  equipementRequis?: string;
  consignes?: string;
  dateLimiteInscription?: string;
  dateLimiteAutorisation?: string;
}

export interface CreateParticipantInput {
  sortieId: string;
  typeParticipant: TypeParticipant;
  eleveId?: string;
  accompagnateurId?: string;
  observations?: string;
}

export interface UpdateParticipantInput {
  statut?: StatutParticipant;
  montantPaye?: number;
  datePaiement?: string;
  observations?: string;
}

export interface CreateAutorisationInput {
  sortieId: string;
  eleveId: string;
  parentId: string;
  autorise: boolean;
  observations?: string;
  contactUrgence?: string;
  telUrgence?: string;
  signatureUrl?: string;
}

export interface UpdateAutorisationInput {
  autorise?: boolean;
  observations?: string;
  contactUrgence?: string;
  telUrgence?: string;
  signatureUrl?: string;
}

// ==========================================
// HOOKS SORTIES
// ==========================================

export const useSorties = (filters?: {
  statut?: StatutSortie;
  type?: TypeSortie;
  classeId?: string;
  dateDebut?: string;
  dateFin?: string;
}) => {
  return useQuery({
    queryKey: ["sorties", filters],
    queryFn: async () => {
      const { data } = await api.get<SortieScolaire[]>(API_URL, {
        params: filters,
      });
      return data;
    },
  });
};

export const useSortie = (sortieId?: string) => {
  return useQuery({
    queryKey: ["sortie", sortieId],
    queryFn: async () => {
      if (!sortieId) return null;
      const { data } = await api.get<SortieScolaire>(`${API_URL}/${sortieId}`);
      return data;
    },
    enabled: !!sortieId,
  });
};

export const useCreateSortie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSortieInput) => {
      const { data } = await api.post<SortieScolaire>(API_URL, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
    },
  });
};

export const useUpdateSortie = (sortieId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSortieInput) => {
      const { data } = await api.patch<SortieScolaire>(
        `${API_URL}/${sortieId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
      queryClient.invalidateQueries({ queryKey: ["sortie", sortieId] });
    },
  });
};

export const useDeleteSortie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sortieId: string) => {
      const { data } = await api.delete(`${API_URL}/${sortieId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
    },
  });
};

export const useStatistiquesSortie = (sortieId?: string) => {
  return useQuery({
    queryKey: ["statistiques-sortie", sortieId],
    queryFn: async () => {
      if (!sortieId) return null;
      const { data } = await api.get<StatistiquesSortie>(
        `${API_URL}/${sortieId}/statistiques`,
      );
      return data;
    },
    enabled: !!sortieId,
  });
};

// ==========================================
// HOOKS PARTICIPANTS
// ==========================================

export const useParticipants = (sortieId?: string) => {
  return useQuery({
    queryKey: ["participants", sortieId],
    queryFn: async () => {
      if (!sortieId) return [];
      const { data } = await api.get<ParticipantSortie[]>(
        `${API_URL}/${sortieId}/participants`,
      );
      return data;
    },
    enabled: !!sortieId,
  });
};

export const useCreateParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateParticipantInput) => {
      const { data } = await api.post<ParticipantSortie>(
        `${API_URL}/participants`,
        input,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["participants", variables.sortieId],
      });
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
      queryClient.invalidateQueries({
        queryKey: ["sortie", variables.sortieId],
      });
    },
  });
};

export const useUpdateParticipant = (participantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateParticipantInput) => {
      const { data } = await api.patch<ParticipantSortie>(
        `${API_URL}/participants/${participantId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
    },
  });
};

export const useDeleteParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId: string) => {
      const { data } = await api.delete(
        `${API_URL}/participants/${participantId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
    },
  });
};

// ==========================================
// HOOKS AUTORISATIONS
// ==========================================

export const useAutorisations = (sortieId?: string) => {
  return useQuery({
    queryKey: ["autorisations", sortieId],
    queryFn: async () => {
      if (!sortieId) return [];
      const { data } = await api.get<AutorisationParent[]>(
        `${API_URL}/${sortieId}/autorisations`,
      );
      return data;
    },
    enabled: !!sortieId,
  });
};

export const useCreateAutorisation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAutorisationInput) => {
      const { data } = await api.post<AutorisationParent>(
        `${API_URL}/autorisations`,
        input,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["autorisations", variables.sortieId],
      });
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
      queryClient.invalidateQueries({
        queryKey: ["sortie", variables.sortieId],
      });
    },
  });
};

export const useUpdateAutorisation = (autorisationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAutorisationInput) => {
      const { data } = await api.patch<AutorisationParent>(
        `${API_URL}/autorisations/${autorisationId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autorisations"] });
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
    },
  });
};

export const useDeleteAutorisation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (autorisationId: string) => {
      const { data } = await api.delete(
        `${API_URL}/autorisations/${autorisationId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autorisations"] });
      queryClient.invalidateQueries({ queryKey: ["sorties"] });
    },
  });
};
