import { Request, Response } from "express";
import { StocksService } from "./stocks.service.js";

const service = new StocksService();

/**
 * TODO: Récupérer tous les articles en stock
 */
export const getStocks = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Appel au service
    // const stocks = await service.getStocks(schoolId!);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des stocks." });
  }
};

/**
 * TODO: Créer un nouvel article
 */
export const createArticle = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;

    // TODO: Validation Zod
    // TODO: Appel au service
    // const article = await service.createArticle(req.body, schoolId!, { schoolId, role });

    return res.status(201).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création de l'article." });
  }
};

/**
 * TODO: Mettre à jour un article
 */
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Validation des données
    // TODO: Appel au service
    // const article = await service.updateArticle(id, req.body, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'article." });
  }
};

/**
 * TODO: Supprimer un article
 */
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Appel au service
    // await service.deleteArticle(id, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression de l'article." });
  }
};

/**
 * TODO: Créer un mouvement de stock (entrée/sortie)
 */
export const createMouvement = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;

    // TODO: Validation des données (articleId, type: 'ENTREE' | 'SORTIE', quantité, motif)
    // TODO: Appel au service
    // const mouvement = await service.createMouvement(req.body, { schoolId, role });

    return res.status(201).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du mouvement." });
  }
};

/**
 * TODO: Récupérer les alertes de stock (articles sous le seuil)
 */
export const getAlertes = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Appel au service
    // const alertes = await service.getAlertes(schoolId!);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des alertes." });
  }
};

/**
 * TODO: Récupérer l'historique des mouvements
 */
export const getMouvements = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Parser les filtres
    // TODO: Appel au service
    // const mouvements = await service.getMouvements(req.query, schoolId!);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des mouvements." });
  }
};
