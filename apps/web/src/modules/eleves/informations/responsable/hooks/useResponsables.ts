import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../../../../../lib/api";
import toast from "react-hot-toast";

const RESPONSABLES_URL = "/api/eleves/informations/responsables";
const FICHE_ELEVES_URL = "/api/eleves/informations/fiche";

export type TypeResponsable = "PARENT" | "TUTEUR";

export interface EleveResume {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
}

export interface ResponsableAffiliation {
  id: string;
  eleveId: string;
  responsableId: string;
  createdAt: string;
  eleve: EleveResume;
}

export interface Responsable {
  id: string;
  nom: string;
  prenom: string;
  type: TypeResponsable;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  affiliations: ResponsableAffiliation[];
}

export interface CreateResponsableInput {
  nom: string;
  prenom: string;
  type: TypeResponsable;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  eleveIds: string[];
}

export interface UpdateResponsableInput {
  nom?: string;
  prenom?: string;
  type?: TypeResponsable;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
}

export function useResponsable() {
  // Hook pour récupérer la liste des responsables
  return useQuery<Responsable[]>({
    queryKey: ["responsables"],
    queryFn: async () => {
      const { data } = await api.get(RESPONSABLES_URL);
      return data;
    },
  });
}

export function useElevesPourResponsable() {
  // Hook pour récupérer la liste des élèves disponibles pour l'affiliation à un responsable
  return useQuery<EleveResume[]>({
    queryKey: ["fiche-eleves"],
    queryFn: async () => {
      const { data } = await api.get(FICHE_ELEVES_URL);
      return data;
    },
  });
}

export function useCreateResponsable() {
  // Hook pour créer un nouveau responsable
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateResponsableInput) => {
      const { data } = await api.post(RESPONSABLES_URL, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsables"] });
      queryClient.invalidateQueries({ queryKey: ["fiche-eleves"] });
      toast.success("Responsable créé avec succès");
    },
    onError: (error) => {
      toast.error(
        getApiError(error, "Erreur lors de la création du responsable"),
      );
    },
  });
}

export function useUpdateResponsable() {
  // Hook pour mettre à jour un responsable existant
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateResponsableInput;
    }) => {
      const { data } = await api.put<Responsable>(
        `${RESPONSABLES_URL}/${id}`,
        input,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["responsables"] });
      queryClient.invalidateQueries({
        queryKey: ["responsables", variables.id],
      });
      toast.success("Responsable mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(
        getApiError(error, "Erreur lors de la mise à jour du responsable"),
      );
    },
  });
}

export function useAffilierElevesAuResponsable() {
  // Hook pour affilier des élèves à un responsable existant
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      responsableId,
      eleveIds,
    }: {
      responsableId: string;
      eleveIds: string[];
    }) => {
      const { data } = await api.post<Responsable>(
        `${RESPONSABLES_URL}/${responsableId}/affilier`,
        { eleveIds },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsables"] });
      queryClient.invalidateQueries({ queryKey: ["fiche-eleves"] });
      toast.success("Élèves affiliés au responsable avec succès");
    },
    onError: (error) => {
      toast.error(
        getApiError(
          error,
          "Erreur lors de l'affiliation des élèves au responsable",
        ),
      );
    },
  });
}

export function useRetirerAffiliationEleve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      responsableId,
      eleveId,
    }: {
      responsableId: string;
      eleveId: string;
    }) => {
      await api.delete(
        `${RESPONSABLES_URL}/${responsableId}/eleves/${eleveId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsables"] });
      queryClient.invalidateQueries({ queryKey: ["fiche-eleves"] });
      toast.success("Affiliation de l'élève retirée avec succès");
    },
    onError: (error) => {
      toast.error(
        getApiError(
          error,
          "Erreur lors du retrait de l'affiliation de l'élève au responsable",
        ),
      );
    },
  });
}

export function useDeleteResponsable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (responsableId: string) => {
      await api.delete(`${RESPONSABLES_URL}/${responsableId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsables"] });
      queryClient.invalidateQueries({ queryKey: ["fiche-eleves"] });
      toast.success("Responsable supprimé avec succès");
    },
    onError: (error) => {
      toast.error(
        getApiError(error, "Erreur lors de la suppression du responsable"),
      );
    },
  });
}
