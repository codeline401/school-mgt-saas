import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";

// ─── Types ───────────────────────────────────────────────────

export type TypeTicket =
  | "EQUIPEMENT"
  | "BATIMENT"
  | "SALLE"
  | "RESEAU"
  | "PLOMBERIE"
  | "ELECTRICITE"
  | "MOBILIER"
  | "AUTRE";

export type PrioriteTicket = "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";

export type StatutTicket =
  | "OUVERT"
  | "EN_COURS"
  | "RESOLU"
  | "FERME"
  | "ANNULE";

export type TypeLocalisation = "SALLE" | "BATIMENT" | "EQUIPEMENT";

export type StatutIntervention =
  | "PLANIFIEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULEE";

export interface TicketMaintenance {
  id: string;
  titre: string;
  description?: string;
  type: TypeTicket;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  localisationId?: string;
  typeLocalisation?: TypeLocalisation;
  localisationNom?: string;
  dateOuverture: string;
  dateResolution?: string;
  creeParId: string;
  creePar: {
    nom: string;
    prenom: string;
    email: string;
  };
  assigneAId?: string;
  assigneA?: {
    nom: string;
    prenom: string;
    email: string;
  };
  interventions: Array<{
    id: string;
    statut: StatutIntervention;
    dateDebut: string;
    dateFin?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionMaintenance {
  id: string;
  ticketId: string;
  dateDebut: string;
  dateFin?: string;
  technicienId: string;
  technicien: {
    nom: string;
    prenom: string;
    email: string;
  };
  description?: string;
  observations?: string;
  statut: StatutIntervention;
  cout?: number;
  piecesUtilisees?: string;
  ticket: {
    titre: string;
    type: TypeTicket;
    priorite?: PrioriteTicket;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StatistiquesMaintenance {
  totalTickets: number;
  ticketsOuverts: number;
  ticketsEnCours: number;
  ticketsResolus: number;
  interventionsEnCours: number;
  interventionsTerminees: number;
  coutTotal: number;
  tempsMoyenResolution: number;
  ticketsParPriorite: Array<{
    priorite: PrioriteTicket;
    count: number;
  }>;
  ticketsParType: Array<{
    type: TypeTicket;
    count: number;
  }>;
}

export interface CreateTicketMaintenanceInput {
  titre: string;
  description?: string;
  type: TypeTicket;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  localisationId?: string;
  typeLocalisation?: TypeLocalisation;
  localisationNom?: string;
  assigneAId?: string;
}

export interface UpdateTicketMaintenanceInput {
  titre?: string;
  description?: string;
  type?: TypeTicket;
  priorite?: PrioriteTicket;
  statut?: StatutTicket;
  localisationId?: string;
  typeLocalisation?: TypeLocalisation;
  localisationNom?: string;
  assigneAId?: string;
  dateResolution?: string;
}

export interface CreateInterventionInput {
  ticketId: string;
  dateDebut: string;
  dateFin?: string;
  technicienId: string;
  description?: string;
  observations?: string;
  statut: StatutIntervention;
  cout?: number;
  piecesUtilisees?: string;
}

export interface UpdateInterventionInput {
  dateDebut?: string;
  dateFin?: string;
  technicienId?: string;
  description?: string;
  observations?: string;
  statut?: StatutIntervention;
  cout?: number;
  piecesUtilisees?: string;
}

// ─── Hooks pour les tickets ──────────────────────────────────

export function useTickets(filters?: {
  statut?: StatutTicket;
  priorite?: PrioriteTicket;
  type?: TypeTicket;
  assigneAId?: string;
  search?: string;
}) {
  return useQuery<TicketMaintenance[]>({
    queryKey: ["tickets-maintenance", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.statut) params.append("statut", filters.statut);
      if (filters?.priorite) params.append("priorite", filters.priorite);
      if (filters?.type) params.append("type", filters.type);
      if (filters?.assigneAId) params.append("assigneAId", filters.assigneAId);
      if (filters?.search) params.append("search", filters.search);

      const { data } = await api.get(
        `/api/logistique/maintenance/tickets?${params.toString()}`,
      );
      return data;
    },
  });
}

export function useTicket(ticketId: string) {
  return useQuery<TicketMaintenance>({
    queryKey: ["ticket-maintenance", ticketId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/logistique/maintenance/tickets/${ticketId}`,
      );
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTicketMaintenanceInput) => {
      const { data } = await api.post(
        "/api/logistique/maintenance/tickets",
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-maintenance"] });
    },
  });
}

export function useUpdateTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTicketMaintenanceInput) => {
      const { data } = await api.patch(
        `/api/logistique/maintenance/tickets/${ticketId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-maintenance"] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-maintenance", ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["statistiques-maintenance"] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      await api.delete(`/api/logistique/maintenance/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-maintenance"] });
    },
  });
}

// ─── Hooks pour les interventions ────────────────────────────

export function useInterventions(ticketId?: string) {
  return useQuery<InterventionMaintenance[]>({
    queryKey: ["interventions-maintenance", ticketId],
    queryFn: async () => {
      const params = ticketId ? `?ticketId=${ticketId}` : "";
      const { data } = await api.get(
        `/api/logistique/maintenance/interventions${params}`,
      );
      return data;
    },
  });
}

export function useCreateIntervention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInterventionInput) => {
      const { data } = await api.post(
        "/api/logistique/maintenance/interventions",
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["interventions-maintenance"],
      });
      queryClient.invalidateQueries({ queryKey: ["tickets-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-maintenance"] });
    },
  });
}

export function useUpdateIntervention(interventionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInterventionInput) => {
      const { data } = await api.patch(
        `/api/logistique/maintenance/interventions/${interventionId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["interventions-maintenance"],
      });
      queryClient.invalidateQueries({ queryKey: ["tickets-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-maintenance"] });
    },
  });
}

export function useDeleteIntervention() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interventionId: string) => {
      await api.delete(
        `/api/logistique/maintenance/interventions/${interventionId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["interventions-maintenance"],
      });
      queryClient.invalidateQueries({ queryKey: ["statistiques-maintenance"] });
    },
  });
}

// ─── Hook pour les statistiques ──────────────────────────────

export function useStatistiquesMaintenance() {
  return useQuery<StatistiquesMaintenance>({
    queryKey: ["statistiques-maintenance"],
    queryFn: async () => {
      const { data } = await api.get(
        "/api/logistique/maintenance/statistiques",
      );
      return data;
    },
  });
}
