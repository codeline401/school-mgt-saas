import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import toast from "react-hot-toast";

/**
 * Interface représentant un article en stock.
 */
export interface ArticleStock {
  id: string;
  nom: string;
  reference: string | null;
  description: string | null;
  categorie: string;
  quantite: number;
  unite: string;
  seuilMinimal: number;
  seuilOptimal: number | null;
  prixUnitaire: number | null;
  emplacement: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input pour créer un nouvel article en stock.
 */
export interface CreateArticleStockInput {
  nom: string;
  reference?: string;
  description?: string;
  categorie: string;
  quantite: number;
  unite: string;
  seuilMinimal: number;
  seuilOptimal?: number;
  prixUnitaire?: number;
  emplacement?: string;
}

/**
 * Input pour mettre à jour un article en stock.
 */
export interface UpdateArticleStockInput {
  nom?: string;
  reference?: string | null;
  description?: string | null;
  categorie?: string;
  quantite?: number;
  unite?: string;
  seuilMinimal?: number;
  seuilOptimal?: number | null;
  prixUnitaire?: number | null;
  emplacement?: string | null;
}

/**
 * Interface pour un mouvement de stock (entrée ou sortie).
 */
export interface MouvementStock {
  id: string;
  type: "ENTREE" | "SORTIE" | "AJUSTEMENT" | "TRANSFERT";
  quantite: number;
  articleId: string;
  motif: string | null;
  reference: string | null;
  cout: number | null;
  userId: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
  };
  schoolId: string;
  createdAt: string;
}

/**
 * Mouvement stock avec article
 */
export interface MouvementStockWithArticle extends MouvementStock {
  article: {
    id: string;
    nom: string;
    unite: string;
  };
}

/**
 * Input pour créer un mouvement de stock.
 */
export interface CreateMouvementStockInput {
  articleId: string;
  type: "ENTREE" | "SORTIE" | "AJUSTEMENT" | "TRANSFERT";
  quantite: number;
  motif?: string;
  reference?: string;
  cout?: number;
}

// -------------------------------------------------------
// HOOKS QUERY
// -------------------------------------------------------

/**
 * Hook pour récupérer tous les articles de stock de l'école
 */
export function useArticlesStock() {
  return useQuery<ArticleStock[]>({
    queryKey: ["articles-stock"],
    queryFn: async () => {
      const { data } = await api.get("/api/stocks/articles");
      return data;
    },
  });
}

/**
 * Hook pour récupérer un article spécifique par son ID
 */
export function useArticleStock(articleId: string | undefined) {
  return useQuery<ArticleStock>({
    queryKey: ["article-stock", articleId],
    queryFn: async () => {
      const { data } = await api.get(`/api/stocks/articles/${articleId}`);
      return data;
    },
    enabled: !!articleId, // Ne s'exécute que si articleId est défini
  });
}

/**
 * Hook pour récupérer les mouvements d'un article
 */
export function useMouvementsStockArticle(articleId: string | undefined) {
  return useQuery<MouvementStock[]>({
    queryKey: ["mouvements-stock", articleId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/stocks/articles/${articleId}/mouvements`,
      );
      return data;
    },
    enabled: !!articleId, // Ne s'exécute que si articleId est défini
  });
}

/**
 * Hook pour récupérer tous les mouvements de stock de l'école
 */
export function useAllMouvementsStock() {
  return useQuery<MouvementStockWithArticle[]>({
    queryKey: ["all-mouvement-stock"],
    queryFn: async () => {
      const { data } = await api.get("/api/stocks/mouvements/all");
      return data;
    },
  });
}

/**
 * Hook pour récupérer les statistiques du stock
 */
export function useStatistiquesStock() {
  return useQuery({
    queryKey: ["statistiques-stock"],
    queryFn: async () => {
      const { data } = await api.get("/api/stocks/statistiques");
      return data;
    },
  });
}

// ---------------------------------------------------------
// HOOKS MUTATION
// ---------------------------------------------------------

/**
 * Hook pour créer un nouvel article en stock
 */
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateArticleStockInput) => {
      const { data } = await api.post("/api/stocks/articles", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles-stock"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-stock"] });
      toast.success("Article créé avec succès !");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création de l'article.");
    },
  });
}

/**
 * Hook pour mettre à jour un article existant
 */
export function useUpdateArticle(articleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateArticleStockInput) => {
      const { data } = await api.patch(
        `/api/stocks/articles/${articleId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles-stock"] });
      queryClient.invalidateQueries({ queryKey: ["article-stock", articleId] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-stock"] });
      toast.success("Article mis à jour avec succès !");
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de la mise à jour de l'article.",
      );
    },
  });
}

/**
 * Hook pour supprimer un article
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string) => {
      await api.delete(`/api/stocks/articles/${articleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles-stock"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques-stock"] });
      toast.success("Article supprimé avec succès !");
    },
    onError: (error) => {
      toast.error(
        error.message || "Erreur lors de la suppression de l'article.",
      );
    },
  });
}

/**
 * Hook pour créer un mouvement de stock (entrée/sortie)
 */
export function useCreateMouvement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMouvementStockInput) => {
      const { data } = await api.post("/api/stocks/mouvements", input);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["articles-stock"] });
      queryClient.invalidateQueries({
        queryKey: ["article-stock", variables.articleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["mouvements-stock", variables.articleId],
      });
      queryClient.invalidateQueries({ queryKey: ["statistiques-stock"] });
      toast.success("Mouvement de stock enregistré avec succès !");
    },
    onError: (error) => {
      toast.error(
        error.message ||
          "Erreur lors de l'enregistrement du mouvement de stock.",
      );
    },
  });
}
