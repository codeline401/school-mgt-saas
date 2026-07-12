import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface Batiment {
  id: string;
  nom: string;
  code: string | null;
  description: string | null;
  nbEtages: number;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  salles?: Salle[];
}

export interface Salle {
  id: string;
  nom: string;
  code: string | null;
  type:
    | "COURS"
    | "LABO_SCIENCE"
    | "INFORMATIQUE"
    | "AMPHI"
    | "REUNION"
    | "SPORT"
    | "ADMINISTRATIF"
    | "AUTRE";
  etage: number;
  capacite: number;
  pmrAccessible: boolean;
  equipements: Record<string, unknown> | null;
  statut: "DISPONIBLE" | "MAINTENANCE" | "RESERVEE";
  batimentId: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  batiment?: {
    id: string;
    nom: string;
    code: string | null;
  };
}

export interface Statistiques {
  nombreBatiments: number;
  nombreSalles: number;
  capaciteTotale: number;
  sallesParType: Array<{ type: string; nombre: number }>;
  sallesParStatut: Array<{ statut: string; nombre: number }>;
}

export interface CreateBatimentInput {
  nom: string;
  code?: string;
  description?: string;
  nbEtages?: number;
}

export interface UpdateBatimentInput {
  nom?: string;
  code?: string | null;
  description?: string | null;
  nbEtages?: number;
}

export interface CreateSalleInput {
  nom: string;
  code?: string;
  type?: Salle["type"];
  etage?: number;
  capacite: number;
  pmrAccessible?: boolean;
  equipements?: Record<string, unknown>;
  statut?: Salle["statut"];
  batimentId: string;
}

export interface UpdateSalleInput {
  nom?: string;
  code?: string | null;
  type?: Salle["type"];
  etage?: number;
  capacite?: number;
  pmrAccessible?: boolean;
  equipements?: Record<string, unknown> | null;
  statut?: Salle["statut"];
  batimentId?: string;
}

// ─────────────────────────────────────────────────────────────
// HOOKS POUR LES BÂTIMENTS
// ─────────────────────────────────────────────────────────────

export function useBatiments() {
  return useQuery<Batiment[]>({
    queryKey: ["logistique-batiments"],
    queryFn: async () => {
      const { data } = await api.get("/api/logistique/locaux/batiments");
      return data;
    },
  });
}

export function useBatiment(id: string) {
  return useQuery<Batiment>({
    queryKey: ["logistique-batiment", id],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/logistique/locaux/batiments/${id}`,
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateBatiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBatimentInput) => {
      const { data } = await api.post(
        "/api/logistique/locaux/batiments",
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistique-batiments"] });
      queryClient.invalidateQueries({ queryKey: ["logistique-statistiques"] });
      toast.success("Bâtiment créé avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error ||
          "Erreur lors de la création du bâtiment",
      );
    },
  });
}

export function useUpdateBatiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateBatimentInput;
    }) => {
      const { data } = await api.put(
        `/api/logistique/locaux/batiments/${id}`,
        input,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["logistique-batiments"] });
      queryClient.invalidateQueries({
        queryKey: ["logistique-batiment", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["logistique-salles"] });
      toast.success("Bâtiment modifié avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error ||
          "Erreur lors de la modification du bâtiment",
      );
    },
  });
}

export function useDeleteBatiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(
        `/api/logistique/locaux/batiments/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistique-batiments"] });
      queryClient.invalidateQueries({ queryKey: ["logistique-salles"] });
      queryClient.invalidateQueries({ queryKey: ["logistique-statistiques"] });
      toast.success("Bâtiment supprimé avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error ||
          "Erreur lors de la suppression du bâtiment",
      );
    },
  });
}

// ─────────────────────────────────────────────────────────────
// HOOKS POUR LES SALLES
// ─────────────────────────────────────────────────────────────

export function useSalles(filters?: {
  batimentId?: string;
  type?: string;
  statut?: string;
}) {
  return useQuery<Salle[]>({
    queryKey: ["logistique-salles", filters],
    queryFn: async () => {
      const { data } = await api.get("/api/logistique/locaux/salles", {
        params: {
          batimentId: filters?.batimentId || undefined,
          type: filters?.type || undefined,
          statut: filters?.statut || undefined,
        },
      });
      return data;
    },
  });
}

export function useSalle(id: string) {
  return useQuery<Salle>({
    queryKey: ["logistique-salle", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/logistique/locaux/salles/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSalle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSalleInput) => {
      const { data } = await api.post("/api/logistique/locaux/salles", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistique-salles"] });
      queryClient.invalidateQueries({ queryKey: ["logistique-batiments"] });
      queryClient.invalidateQueries({ queryKey: ["logistique-statistiques"] });
      toast.success("Salle créée avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Erreur lors de la création de la salle",
      );
    },
  });
}

export function useUpdateSalle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateSalleInput;
    }) => {
      const { data } = await api.put(
        `/api/logistique/locaux/salles/${id}`,
        input,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["logistique-salles"] });
      queryClient.invalidateQueries({
        queryKey: ["logistique-salle", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["logistique-batiments"] });
      toast.success("Salle modifiée avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error ||
          "Erreur lors de la modification de la salle",
      );
    },
  });
}

export function useDeleteSalle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/logistique/locaux/salles/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistique-salles"] });
      queryClient.invalidateQueries({ queryKey: ["logistique-batiments"] });
      queryClient.invalidateQueries({ queryKey: ["logistique-statistiques"] });
      toast.success("Salle supprimée avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error ||
          "Erreur lors de la suppression de la salle",
      );
    },
  });
}

// ─────────────────────────────────────────────────────────────
// HOOKS POUR LES STATISTIQUES
// ─────────────────────────────────────────────────────────────

export function useStatistiques() {
  return useQuery<Statistiques>({
    queryKey: ["logistique-statistiques"],
    queryFn: async () => {
      const { data } = await api.get(
        "/api/logistique/locaux/statistiques",
      );
      return data;
    },
  });
}
