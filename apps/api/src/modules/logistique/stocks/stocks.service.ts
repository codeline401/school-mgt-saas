import { success } from "zod";
import { prisma } from "../../../lib/prisma.js";
import {
  ArticleStockFilters,
  CreateArticleStockInput,
  CreateMouvementStockInput,
  UpdateArticleStockInput,
} from "./stocks.schema.js";

interface UserContext {
  schoolId: string;
  role: string;
  userId: string;
}
/**
 * SERVICE DE GESTION DES ARTICLES EN STOCK
 *
 * Gère les opérations CRUD sur les articles et leurs mouvements de stock
 */
export class ArticleStockService {
  /**
   * Récupérer tous les articles en stock (fournitures pédagogiques)
   * @param schoolId - ID de l'école
   * @returns Liste des articles
   */
  async getArticles(schoolId: string, filters?: ArticleStockFilters) {
    const where: any = { schoolId };

    // filtrer par catégorie
    if (filters?.categorie) {
      where.categorie = filters.categorie;
    }

    // filtre pour les articles en alertes
    if (filters?.enAlerte) {
      where.quantite = { lte: prisma.articleStock.fields.seuilMinimal };
    }

    // Recherche textuelle
    if (filters?.search) {
      where.OR = [
        { nom: { contains: filters.search, mode: "insensitive" } },
        { reference: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await prisma.articleStock.findMany({
      where,
      orderBy: { nom: "asc" },
    });
  }

  /**
   * Récupère un article par son ID
   */
  async getArticleById(articleId: string, schoolId: string) {
    const article = await prisma.articleStock.findFirst({
      where: { id: articleId, schoolId },
      include: {
        mouvements: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new Error("Article introuvable");
    }

    return article;
  }

  /**
   * Créer un nouvel article dans le stock
   * @param data - Données de l'article (nom, catégorie, quantité, seuil, unité)
   */
  async createArticle(data: CreateArticleStockInput, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("utilisateur non autorisé ou école non spécifiée.");
    }

    // vérifier qu'il n'éxiste pas déjà un aritcle avec le même nom
    const existingArticle = await prisma.articleStock.findFirst({
      where: {
        schoolId: user.schoolId,
        nom: data.nom,
      },
    });
    if (existingArticle) {
      throw new Error(
        `Un article avec le nom ${data.nom} existe déjà dans votre stock`,
      );
    }

    // créer l'article
    return await prisma.articleStock.create({
      data: {
        ...data,
        schoolId: user.schoolId,
      },
    });
  }

  /**
   * Mettre à jour un article (quantité, seuil, etc.)
   * @param articleId - ID de l'article
   * @param data - Nouvelles données
   * @param user - user connecté en cours
   */
  async updateArticle(
    articleId: string,
    data: UpdateArticleStockInput,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new Error("Utilisateur non autorisé ou école non spécifiée.");
    }

    // vérifier que l'article appartient à l'école
    const article = await prisma.articleStock.findFirst({
      where: { id: articleId, schoolId: user.schoolId },
    });
    if (!article) {
      throw new Error("Article introuvable ou non autorisé.");
    }

    // Vérifier l'unicité du nom  si modifié
    if (data.nom && data.nom !== article.nom) {
      const existingArticle = await prisma.articleStock.findFirst({
        where: {
          schoolId: user.schoolId,
          nom: data.nom,
          id: { not: articleId },
        },
      });

      if (existingArticle) {
        throw new Error(
          `Un article avec le nom "${data.nom}" existe déjà dans votre stock`,
        );
      }
    }

    return await prisma.articleStock.update({
      where: { id: articleId },
      data,
    });
  }

  /**
   * Supprimer un article du stock
   * @param articleId - ID de l'article
   * @param user - user connecté
   */
  async deleteArticle(articleId: string, user: UserContext) {
    if (!user.schoolId) {
      throw new Error("Utilisateur non autorisé ou école non spécifiée.");
    }

    const article = await prisma.articleStock.findFirst({
      where: { id: articleId, schoolId: user.schoolId },
    });

    if (!article) {
      throw new Error("Article introuvable ou non autorisé.");
    }

    await prisma.articleStock.delete({
      where: { id: articleId },
    });

    return { success: true, message: "Article supprimé avec succès" };
  }

  /**
   * Enregistrer un mouvement de stock (entrée/sortie)
   * @param data - Données du mouvement (articleId, type, quantité, motif)
   * @param user - user connecté
   */
  async createMouvement(data: CreateMouvementStockInput, user: UserContext) {
    // Valider les données
    if (!user.schoolId || !user.userId) {
      throw new Error("Utilisateur non autorisé ou école non spécifiée.");
    }

    return await prisma.$transaction(async (tx) => {
      // Résupérer l'article
      const article = await tx.articleStock.findFirst({
        where: { id: data.articleId, schoolId: user.schoolId },
      });

      if (!article) {
        throw new Error("Article introuvable");
      }

      // Calculer la nouvelle quantité
      const nouvelleQuantite = article.quantite + data.quantite;

      // vérifier que la quatité ne devient pas négative
      if (nouvelleQuantite < 0) {
        throw new Error(
          `Stock insuffisant. Quantité anctuelle : ${article.quantite}, demandée: ${Math.abs(data.quantite)}`,
        );
      }

      // Créer le mouvement
      const mouvement = await tx.mouvementStock.create({
        data: {
          ...data,
          userId: user.userId,
          schoolId: user.schoolId,
        },
      });

      // Mettre à jour la quantité de l'article
      await tx.articleStock.update({
        where: { id: data.articleId },
        data: { quantite: nouvelleQuantite },
      });

      return mouvement;
    });
  }

  /**
   * Récupérer l'historique des mouvements d'un article
   */
  async getMouvements(articleId: string, limit: number = 50, schoolId: string) {
    return await prisma.mouvementStock.findMany({
      where: { articleId, schoolId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les statistiques du stock
   */
  async getStatistiques(schoolId: string) {
    const articles = await prisma.articleStock.findMany({
      where: { schoolId },
    });

    const nombreTotal = articles.length;
    const articlesEnAlerte = articles.filter(
      (a) => a.quantite <= a.seuilMinimal,
    ).length;
    1;
    const valeurTotale = articles.reduce(
      (sum, a) => sum + a.quantite * (Number(a.prixUnitaire) || 0),
      0,
    );

    // Répartition par catégorie
    const repartitionCategorie = articles.reduce((acc: any, article) => {
      acc[article.categorie] = (acc[article.categorie] || 0) + 1;
      return acc;
    }, {});

    return {
      nombreTotal,
      articlesEnAlerte,
      valeurTotale,
      repartitionCategorie: Object.entries(repartitionCategorie).map(
        ([categorie, nombre]) => ({ categorie, nombre }),
      ),
    };
  }
}
