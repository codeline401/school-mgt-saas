import { Request, Response } from "express";
import { ArticleStockService } from "./stocks.service.js";
import {
  ArticleStockFiltersSchema,
  CreateArticleStockSchema,
  CreateMouvementStockSchema,
  UpdateArticleStockSchema,
} from "./stocks.schema.js";
import z from "zod";

/**
 * CONTROLLEUR POUR LA GESTION DES ARTICLES EN STOCK
 */
const articleService = new ArticleStockService();

/**
 * Récupérer tous les articles en stock
 * GET /api/stocks/articles
 */
export const getArticles = async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({
        error: "Ecole non spécifiée",
      });
    }

    // Valider les filtres
    const filters = ArticleStockFiltersSchema.parse(req.query);

    const articles = await articleService.getArticles(schoolId, filters);
    res.json(articles);
  } catch (error: any) {
    console.error("Erreur getArticles :", error);
    return res
      .status(400)
      .json({ error: "Erreur lors de la récupération des stocks." });
  }
};

/**
 * Récupère un article par son ID
 * @param req
 * @param res
 * @returns
 * GET /api/stocks/articles/:id
 */
export async function getArticleById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifiée" });
    }

    const article = await articleService.getArticleById(id, schoolId);
    res.json(article);
  } catch (error: any) {
    console.error("Erreur getArticlesByid:", error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * Créer un nouvel article
 * POST /api/stocks/articles
 */
export const createArticle = async (req: Request, res: Response) => {
  try {
    const data = CreateArticleStockSchema.parse(req.body);
    const user = {
      schoolId: req.user?.schoolId || "",
      role: req.user?.role || "",
      userId: req.user?.id || "",
    };

    const article = await articleService.createArticle(data, user);
    res.status(201).json(article);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création de l'article." });
  }
};

/**
 *  Mettre à jour un article
 * PATCH /api/stocks/articles/:id
 */
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const data = UpdateArticleStockSchema.parse(req.body);
    const user = {
      schoolId: req.user?.schoolId || "",
      role: req.user?.role || "",
      userId: req.user?.id || "",
    };

    const article = await articleService.updateArticle(id, data, user);
    res.json(article);
  } catch (error: any) {
    console.error("Erreur updateArticle:", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'article." });
  }
};

/**
 * Supprimer un article
 * DELETE /api/stocks/articles/:id
 */
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const user = {
      schoolId: req.user?.schoolId || "",
      role: req.user?.role || "",
      userId: req.user?.id || "",
    };

    const result = await articleService.deleteArticle(id, user);
    res.json(result);
  } catch (error: any) {
    console.error("Erreur deleteArticle:", error);
    return res.status(400).json({
      error: "Erreur lors de la suppression de l'article.",
      details: error.message,
    });
  }
};

/**
 * Créer un mouvement de stock (entrée/sortie)
 * POST /api/stocks/mouvements
 */
export const createMouvement = async (req: Request, res: Response) => {
  try {
    const data = CreateMouvementStockSchema.parse(req.body);
    const user = {
      schoolId: req.user?.schoolId || "",
      role: req.user?.role || "",
      userId: req.user?.id || "",
    };

    const mouvement = await articleService.createMouvement(data, user);
    res.status(201).json(mouvement);
  } catch (error: any) {
    console.error("Erreur createMouvement:", error);
    return res.status(400).json({
      error: "Erreur lors de la création du mouvement.",
      details: error.message,
    });
  }
};

/**
 * Récupérer l'historique des mouvements d'un article
 * GET /api/stocks/articles/:id/mouvements
 * @param req
 * @param res
 * @returns
 */
export const getMouvementsByArticleId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const schoolId = req.user?.schoolId;
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50)
      .parse(req.query.limit ?? undefined);

    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifiée" });
    }

    const mouvements = await articleService.getMouvements(id, limit, schoolId);
    res.json(mouvements);
  } catch (error: any) {
    console.error("Erreur getMouvementsByArticleId:", error);
    return res.status(400).json({
      error: "Erreur lors de la récupération des mouvements.",
      details: error.message,
    });
  }
};

/**
 * Récupérer les statistiques du stock
 * GET /api/stocks/statistiques
 */
export async function getStatistiques(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifiée" });
    }

    const stats = await articleService.getStatistiques(schoolId);
    res.json(stats);
  } catch (error: any) {
    console.error("Erreur getStatistiques:", error);
    return res.status(400).json({
      error: "Erreur lors de la récupération des statistiques.",
      details: error.message,
    });
  }
}
