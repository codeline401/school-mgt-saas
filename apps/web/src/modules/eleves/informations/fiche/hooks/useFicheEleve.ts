import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../../lib/api";
import type {
  FicheEleveComplete,
  CreateEleveInput,
  UpdateEleveInput,
} from "@school-mgt/types";
import toast from "react-hot-toast";

// ═══════════════════════════════════════════════════════════════════
// QUERY KEYS - Centralisation pour éviter les erreurs de typage
// ═══════════════════════════════════════════════════════════════════
export const ficheEleveKeys = {
  all: ["fiche-eleves"] as const,
  lists: () => [...ficheEleveKeys.all, "list"] as const,
  list: () => [...ficheEleveKeys.lists()] as const,
  details: () => [...ficheEleveKeys.all, "detail"] as const,
  detail: (id: string) => [...ficheEleveKeys.details(), id] as const,
};

// ═══════════════════════════════════════════════════════════════════
// HOOK: Récupérer la fiche complète d'un élève
// ═══════════════════════════════════════════════════════════════════
export function useFicheEleve(
  eleveId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ficheEleveKeys.detail(eleveId!),
    queryFn: async () => {
      const { data } = await api.get<FicheEleveComplete>(
        `/api/eleves/informations/fiche/${eleveId}`,
      );
      return data;
    },
    enabled: !!eleveId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // Cache pendant 5 minutes
  });
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: Liste de tous les élèves de l'école
// ═══════════════════════════════════════════════════════════════════
export function useFichesEleves() {
  return useQuery({
    queryKey: ficheEleveKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<FicheEleveComplete[]>(
        "/api/eleves/informations/fiche",
      );
      return data;
    },
    staleTime: 1000 * 60 * 2, // Cache pendant 2 minutes
  });
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: Créer un nouvel élève
// ═══════════════════════════════════════════════════════════════════
export function useCreateEleve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEleveInput) => {
      const { data } = await api.post<FicheEleveComplete>(
        "/api/eleves/informations/fiche",
        input,
      );
      return data;
    },
    onSuccess: (newEleve) => {
      // Invalider la liste pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: ficheEleveKeys.lists() });

      // Ajouter l'élève au cache de détail pour éviter un rechargement
      queryClient.setQueryData(ficheEleveKeys.detail(newEleve.id), newEleve);

      toast.success(`Élève ${newEleve.fullName} créé avec succès`);
    },
    onError: (error) => {
      const message = error?.message || "Erreur lors de la création de l'élève";
      toast.error(message);
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: Mettre à jour un élève existant
// ═══════════════════════════════════════════════════════════════════
export function useUpdateEleve(eleveId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEleveInput) => {
      const { data } = await api.put<FicheEleveComplete>(
        `/api/eleves/informations/fiche/${eleveId}`,
        input,
      );
      return data;
    },
    onSuccess: (updatedEleve) => {
      // Mise à jour du cache de détail
      queryClient.setQueryData(ficheEleveKeys.detail(eleveId), updatedEleve);

      // Invalider la liste pour refléter les changements
      queryClient.invalidateQueries({ queryKey: ficheEleveKeys.lists() });

      toast.success("Fiche élève mise à jour avec succès");
    },
    onError: (error) => {
      const message =
        error?.message || "Erreur lors de la mise à jour de l'élève";
      toast.error(message);
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: Supprimer un élève (soft delete)
// ═══════════════════════════════════════════════════════════════════
export function useDeleteEleve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eleveId: string) => {
      await api.delete(`/api/eleves/informations/fiche/${eleveId}`);
      return eleveId;
    },
    onSuccess: (eleveId) => {
      // Retirer l'élève du cache
      queryClient.removeQueries({ queryKey: ficheEleveKeys.detail(eleveId) });

      // Invalider la liste
      queryClient.invalidateQueries({ queryKey: ficheEleveKeys.lists() });

      toast.success("Élève supprimé avec succès");
    },
    onError: (error) => {
      const message =
        error?.message || "Erreur lors de la suppression de l'élève";
      toast.error(message);
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: Restaurer un élève supprimé
// ═══════════════════════════════════════════════════════════════════
export function useRestoreEleve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eleveId: string) => {
      const { data } = await api.patch<{ eleve: FicheEleveComplete }>(
        `/api/eleves/informations/fiche/${eleveId}/restore`,
      );
      return data.eleve;
    },
    onSuccess: (restoredEleve) => {
      // Mise à jour du cache
      queryClient.setQueryData(
        ficheEleveKeys.detail(restoredEleve.id),
        restoredEleve,
      );

      // Invalider la liste
      queryClient.invalidateQueries({ queryKey: ficheEleveKeys.lists() });

      toast.success("Élève restauré avec succès");
    },
    onError: (error) => {
      const message =
        error?.message || "Erreur lors de la restauration de l'élève";
      toast.error(message);
    },
  });
}
