/**
 * HOOKS POUR LE GESTION DES EQUIPEMENTS
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import toast from "react-hot-toast";

// --- Tyoes -------------------------------------------------
export interface Equipement {
  id: string;
  nom: string;
  reference: string | null;
  numeroSerie: string | null;
  categorie: string;
  etat: string;
  description: string | null;
  valeur: number | null;
  dateAcquisition: string | null;
  emplacement: string | null;
  schoolId: string;
  disponible: boolean;
  pretEnCours: PretEquipement | null;
  createdAt: string;
  updatedAt: string;
}

export interface PretEquipement {
  id: string;
  equipementId: string;
  equipement?: Equipement;
  emprunteurType: string;
  emprunteurNom: string;
  emprunteurId: string | null;
  datePret: string;
  dateRetourPrevue: string;
  dateRetourEffective: string;
  statut: string;
  motif: string | null;
  observations: string | null;
  etatRetour: string | null;
  pretPar: {
    nom: string;
    prenom: string;
  };
  retourPar: {
    nom: string;
    prenom: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipementInput {
  nom: string;
  reference?: string;
  numeroSerie?: string;
  categorie: string;
  etat?: string;
  description?: string;
  valeur?: number;
  dateAcquisition?: string;
  emplacement?: string;
}

export type UpdateEquipementInput = Partial<CreateEquipementInput>;

export interface CreatePretInput {
  equipementId: string;
  emprunteurType: string;
  emprunteurNom: string;
  emprunteurId?: string;
  datePret: string;
  dateRetourPrevue: string;
  motif?: string;
  observations?: string;
}

export interface RetourEquipementInput {
  dateRetourEffective: string;
  etatRetour: string;
  observations?: string;
}

// --- Queries --------------------------------------------

/**
 * Hook pour récupérer tous les équipements
 */
export function useEquipements() {
  return useQuery<Equipement[]>({
    queryKey: ["equipements"],
    queryFn: async () => {
      const { data } = await api.get("/api/logistique/equipements");
      return data;
    },
  });
}

/**
 * Hook pour récupérer une équipement par ID
 */
export function useEquipement(equipementId: string | undefined) {
  return useQuery<Equipement>({
    queryKey: ["equipement", equipementId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/logistique/equipements/${equipementId}`,
      );
      return data;
    },
    enabled: !!equipementId,
  });
}

/**
 * Hook pour récupérer les statistiques
 */
export function useStatistiquesEquipements() {
  return useQuery({
    queryKey: ["statistiques-equipements"],
    queryFn: async () => {
      const { data } = await api.get(
        "/api/logistique/equipements/statistiques",
      );
      return data;
    },
  });
}

/**
 * Hook pour récupérer tous les prêts
 */
export function usePrets(statut?: string) {
  return useQuery<PretEquipement[]>({
    queryKey: ["prets", statut],
    queryFn: async () => {
      const params = statut ? { statut } : {};
      const { data } = await api.get("/api/logistique/equipements/prets", {
        params,
      });
      return data;
    },
  });
}

// --- Mutations ----------------------------------------

/**
 * Hook pour créer un équipement
 */
export function useCreateEquipement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEquipementInput) => {
      const { data } = await api.post("/api/logistique/equipements", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipements"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-equipements"] });
      toast.success("Equipement créé avec succès !");
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de la création de l'équipement",
      );
    },
  });
}

/**
 * Hook pour mettre à jour un équipement
 */
export function useUpdateEquipement(equipementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEquipementInput) => {
      const { data } = await api.patch(
        `/api/logistique/equipements/${equipementId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipements"] });
      queryClient.invalidateQueries({
        queryKey: ["equipements", equipementId],
      });
      queryClient.invalidateQueries({ queryKey: ["statistiques-equipements"] });
      toast.success("Equipements mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de la mis à jour de l'équipement",
      );
    },
  });
}

/**
 * Hook pour supprimer un équipement
 */
export function useDeleteEquipement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipementId: string) => {
      await api.delete(`/api/logistique/equipements/${equipementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipements"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-equipements"] });
      toast.success("Equipement supprimé avec succès !");
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de la suppression de l'équipement !",
      );
    },
  });
}

/**
 * Hook pour créer un prêt pour un équipement
 */
export function useCreatePret() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePretInput) => {
      const { data } = await api.post(
        "/api/logistique/equipements/prets",
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipements"] });
      queryClient.invalidateQueries({ queryKey: ["prets"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-equipements"] });
      toast.success("Prês enregistré avec succès !");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création de prêt !");
    },
  });
}

/**
 * Hook pour retourner un équipement
 */
export function useRetournerEquipement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pretId,
      input,
    }: {
      pretId: string;
      input: RetourEquipementInput;
    }) => {
      const { data } = await api.post(
        `/api/logistique/equipements/prets/${pretId}/retour`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipements"] });
      queryClient.invalidateQueries({ queryKey: ["prets"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-equipements"] });
      toast.success("Retour enregistré avec succès !");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors du retour de l'équipement.");
    },
  });
}
