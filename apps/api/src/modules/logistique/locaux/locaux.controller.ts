import { Request, Response } from "express";
import { LocauxService } from "./locaux.service.js";
import {
  createBatimentSchema,
  updateBatimentSchema,
  createSalleSchema,
  updateSalleSchema,
} from "./locaux.schema.js";
import { ZodError } from "zod";

const service = new LocauxService();

// ==========================================
// CONTRÔLEURS POUR LES BÂTIMENTS
// ==========================================

/**
 * Récupérer tous les bâtiments de l'école
 */
export const getBatiments = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error:
          "Vous devez appartenir à une école pour accéder à cette ressource.",
      });
    }

    const batiments = await service.getBatiments(schoolId);

    return res.status(200).json(batiments);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des bâtiments.",
    });
  }
};

/**
 * Récupérer un bâtiment par son ID
 */
export const getBatimentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error:
          "Vous devez appartenir à une école pour accéder à cette ressource.",
      });
    }

    // Vérifier que id est bien une string
    if (Array.isArray(id)) {
      return res.status(400).json({ error: "ID invalide." });
    }

    const batiment = await service.getBatimentById(id, schoolId);

    return res.status(200).json(batiment);
  } catch (error: any) {
    console.error(error);
    if (error.message === "Bâtiment introuvable.") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Accès non autorisé à ce bâtiment.") {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Erreur lors de la récupération du bâtiment.",
    });
  }
};

/**
 * Créer un nouveau bâtiment
 */
export const createBatiment = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error: "Vous devez appartenir à une école pour créer un bâtiment.",
      });
    }

    // Validation des données avec Zod
    const validatedData = createBatimentSchema.parse(req.body);

    const batiment = await service.createBatiment(validatedData, schoolId);

    return res.status(201).json(batiment);
  } catch (error: any) {
    console.error(error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Données invalides.",
        details: error.issues,
      });
    }
    return res.status(500).json({
      error: "Erreur lors de la création du bâtiment.",
    });
  }
};

/**
 * Mettre à jour un bâtiment
 */
export const updateBatiment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error: "Vous devez appartenir à une école pour modifier un bâtiment.",
      });
    }

    // Vérifier que id est bien une string
    if (Array.isArray(id)) {
      return res.status(400).json({ error: "ID invalide." });
    }

    // Validation des données avec Zod
    const validatedData = updateBatimentSchema.parse(req.body);

    const batiment = await service.updateBatiment(id, validatedData, schoolId);

    return res.status(200).json(batiment);
  } catch (error: any) {
    console.error(error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Données invalides.",
        details: error.issues,
      });
    }
    if (error.message === "Bâtiment introuvable.") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Accès non autorisé à ce bâtiment.") {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Erreur lors de la mise à jour du bâtiment.",
    });
  }
};

/**
 * Supprimer un bâtiment
 */
export const deleteBatiment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error: "Vous devez appartenir à une école pour supprimer un bâtiment.",
      });
    }

    // Vérifier que id est bien une string
    if (Array.isArray(id)) {
      return res.status(400).json({ error: "ID invalide." });
    }

    const result = await service.deleteBatiment(id, schoolId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    if (error.message === "Bâtiment introuvable.") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Accès non autorisé à ce bâtiment.") {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Erreur lors de la suppression du bâtiment.",
    });
  }
};

// ==========================================
// CONTRÔLEURS POUR LES SALLES
// ==========================================

/**
 * Récupérer toutes les salles de l'école
 */
export const getSalles = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;
    const { batimentId, type, statut } = req.query;

    if (!schoolId) {
      return res.status(403).json({
        error:
          "Vous devez appartenir à une école pour accéder à cette ressource.",
      });
    }

    const filters = {
      batimentId: batimentId as string | undefined,
      type: type as string | undefined,
      statut: statut as string | undefined,
    };

    const salles = await service.getSalles(schoolId, filters);

    return res.status(200).json(salles);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des salles.",
    });
  }
};

/**
 * Récupérer une salle par son ID
 */
export const getSalleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error:
          "Vous devez appartenir à une école pour accéder à cette ressource.",
      });
    }

    // Vérifier que id est bien une string
    if (Array.isArray(id)) {
      return res.status(400).json({ error: "ID invalide." });
    }

    const salle = await service.getSalleById(id, schoolId);

    return res.status(200).json(salle);
  } catch (error: any) {
    console.error(error);
    if (error.message === "Salle introuvable.") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Accès non autorisé à cette salle.") {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Erreur lors de la récupération de la salle.",
    });
  }
};

/**
 * Créer une nouvelle salle
 */
export const createSalle = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error: "Vous devez appartenir à une école pour créer une salle.",
      });
    }

    // Validation des données avec Zod
    const validatedData = createSalleSchema.parse(req.body);

    const salle = await service.createSalle(validatedData, schoolId);

    return res.status(201).json(salle);
  } catch (error: any) {
    console.error(error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Données invalides.",
        details: error.issues,
      });
    }
    if (
      error.message === "Bâtiment introuvable." ||
      error.message ===
        "Le bâtiment spécifié n'appartient pas à votre école." ||
      error.message.includes("L'étage")
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Erreur lors de la création de la salle.",
    });
  }
};

/**
 * Mettre à jour une salle
 */
export const updateSalle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error: "Vous devez appartenir à une école pour modifier une salle.",
      });
    }

    // Vérifier que id est bien une string
    if (Array.isArray(id)) {
      return res.status(400).json({ error: "ID invalide." });
    }

    // Validation des données avec Zod
    const validatedData = updateSalleSchema.parse(req.body);

    const salle = await service.updateSalle(id, validatedData, schoolId);

    return res.status(200).json(salle);
  } catch (error: any) {
    console.error(error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Données invalides.",
        details: error.issues,
      });
    }
    if (error.message === "Salle introuvable.") {
      return res.status(404).json({ error: error.message });
    }
    if (
      error.message === "Accès non autorisé à cette salle." ||
      error.message === "Bâtiment introuvable." ||
      error.message ===
        "Le bâtiment spécifié n'appartient pas à votre école." ||
      error.message.includes("L'étage")
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Erreur lors de la mise à jour de la salle.",
    });
  }
};

/**
 * Supprimer une salle
 */
export const deleteSalle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error: "Vous devez appartenir à une école pour supprimer une salle.",
      });
    }

    // Vérifier que id est bien une string
    if (Array.isArray(id)) {
      return res.status(400).json({ error: "ID invalide." });
    }

    const result = await service.deleteSalle(id, schoolId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    if (error.message === "Salle introuvable.") {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === "Accès non autorisé à cette salle.") {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Erreur lors de la suppression de la salle.",
    });
  }
};

// ==========================================
// STATISTIQUES
// ==========================================

/**
 * Obtenir des statistiques sur les locaux
 */
export const getStatistiques = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    if (!schoolId) {
      return res.status(403).json({
        error:
          "Vous devez appartenir à une école pour accéder à cette ressource.",
      });
    }

    const stats = await service.getStatistiques(schoolId);

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des statistiques.",
    });
  }
};
