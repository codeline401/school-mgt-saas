// --------------------------------------------------
// TYPES
// --------------------------------------------------

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import toast from "react-hot-toast";

export interface Reservation {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  statut: "EN_ATTENTE" | "APPROUVEE" | "REFUSEE" | "ANNULEE";
  salleId: string;
  userId: string;
  schoolId: string;
  motifRefus: string | null;
  createdAt: string;
  updatedAt: string;
  salle: {
    id: string;
    nom: string;
    code: string | null;
    type: string;
    capacite: number;
    batiment: {
      id: string;
      nom: string;
    };
  };
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
}

export interface CreateReservationInput {
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  salleId: string;
}

export interface UpdateReservationInput {
  titre?: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  salleId?: string;
}

export interface ApprouverReservationInput {
  statut: "APPROUVEE" | "REFUSEE";
  motifRefus?: string;
}

export interface ReservationFilters {
  salleId?: string;
  userId?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
}

// -----------------------------------------
// HOOKS
// -----------------------------------------

/**
 * Hook pour récupérer toutes les récervations avec filtres optionnels
 */
export function useReservations(filters?: ReservationFilters) {
  return useQuery<Reservation[]>({
    queryKey: ["reservations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.salleId) params.append("salleId", filters.salleId);
      if (filters?.userId) params.append("userId", filters.userId);
      if (filters?.statut) params.append("statut", filters.statut);
      if (filters?.dateDebut) params.append("dateDebut", filters.dateDebut);
      if (filters?.dateFin) params.append("dateFin", filters.dateFin);

      const { data } = await api.get(
        `/api/logistique/reservations?${params.toString()}`,
      );
      return data;
    },
  });
}

/**
 * Hooks pour récupérer une réservation par son ID
 */
export function useReservation(reservationId: string) {
  return useQuery<Reservation>({
    queryKey: ["reservation", reservationId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/logistique/reservations/${reservationId}`,
      );
      return data;
    },
    enabled: !!reservationId, // Ne pas exécuter la requête si reservationId est vide
  });
}

/**
 * Hook pour créer une réservation
 */
export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReservationInput) => {
      const { data } = await api.post("/api/logistique/reservations", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] }); // Invalider la cache pour forcer le rechargement des données après la création
      toast.success("Réservation créée avec succès !");
    },
    onError: (error) => {
      toast.error(
        `Erreur lors de la création de la réservation : ${error.message}`,
      );
    },
  });
}

/**
 * Hook pour mettre à jour une réservation
 */
export function useUpdateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateReservationInput;
    }) => {
      const { data } = await api.patch(
        `/api/logistique/reservations/${id}`,
        input,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({
        queryKey: ["reservation", variables.id],
      });
      toast.success("Réservation mise à jour avec succès");
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de la mise à jour de la réservation",
      );
    },
  });
}

/**
 * Hook pour approuver/refuser une réservation
 */
export function useApprouverReservation() {
  const queryClient = useQueryClient(); // Obtenir le client de requête pour invalider les caches après la mutation

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: ApprouverReservationInput;
    }) => {
      const { data } = await api.patch(
        `/api/logistique/reservations/${id}/approuver`,
        input,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({
        queryKey: ["reservation", variables.id],
      });
      toast.success(
        variables.input.statut === "APPROUVEE"
          ? "Réservation approuvée avec succès"
          : "Réservation refusée avec succès",
      );
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de l'approbation/refus de la réservation",
      );
    },
  });
}

/**
 * Hook pour annuler une réservation
 */
export function useAnnulerReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(
        `/api/logistique/reservations/${id}/annuler`,
      );
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      toast.success("Réservation annulée avec succès");
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de l'annulation de la réservation",
      );
    },
  });
}

/**
 * Hook pour supprimer une réservation
 */
export function useDeleteReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/logistique/reservations/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Réservation supprimée avec succès");
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de la suppression de la réservation",
      );
    },
  });
}
