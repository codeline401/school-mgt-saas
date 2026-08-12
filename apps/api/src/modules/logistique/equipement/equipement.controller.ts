import { Request, Response } from "express";
import { equipementService, EquipementService } from "./equipement.service.js";
import {
  CreateEquipementSchema,
  CreatePretSchema,
  EquipementFiltersSchema,
  RetourEquipementSchema,
  UpdateEquipementSchema,
} from "./equipement.schema.js";
import z from "zod";

/**
 * CONTROLLEUR POUR LA GESTION DES EQUIPEMENTS
 */

const service = new EquipementService();

/**
 * Récupérer tous les équipements de l'inventaire
 * GET /api/equipements
 */
export const getEquipements = async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifié" });
    }

    const filters = EquipementFiltersSchema.parse(req.query);
    const equipements = await equipementService.getEquipements(
      schoolId,
      filters,
    );

    res.json(equipements);
  } catch (error: any) {
    console.error("Erreur getEquipements:", error);
    return res
      .status(400)
      .json({ error: "Erreur lors de la récupération des équipements." });
  }
};

/**
 * Récupère un équipement par son ID
 * GET /api/equipements/:id
 * @param req
 * @param res
 * @returns
 */
export const getEquipementsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifiée" });
    }

    const equipement = await equipementService.getEquipementsById(id, schoolId);
    res.json(equipement);
  } catch (err: any) {
    console.error("Erreur getEquipementById :", err);
    return res.status(400).json({
      error: err.message || "Erreur lors de la récupération de l'équipement",
    });
  }
};

/**
 * Créer un nouvel équipement
 * POST /api/equipements
 */
export const createEquipement = async (req: Request, res: Response) => {
  try {
    const parsed = CreateEquipementSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Données invalides",
        details: z.treeifyError(parsed.error),
      });
    }

    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifiée" });
    }

    const data = CreateEquipementSchema.parse(req.body);
    const user = {
      schoolId,
      userId: req.user?.id || "",
      role: req.user?.role || "",
    };

    const equipement = await equipementService.createEquipement(
      parsed.data,
      user,
    );
    res.status(201).json(equipement);
  } catch (error: any) {
    console.error("Erreur createEquipement ", error);
    return res.status(400).json({
      error: error.message || "Erreur lors de la création de l'équipement.",
    });
  }
};

/**
 * Mettre à jour un équipement
 * PATCH /api/equipements/:id
 */
export const updateEquipement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const data = UpdateEquipementSchema.parse(req.body);
    const user = {
      schoolId: req.user?.schoolId || "",
      userId: req.user?.id || "",
      role: req.user?.role || "",
    };

    const equipement = await equipementService.updateEquipement(id, data, user);
    res.json(equipement);
  } catch (error: any) {
    console.error("Erreur updateEquipement :", error);
    return res.status(500).json({
      error: error.message || "Erreur lors de la mise à jour de l'équipement.",
    });
  }
};

/**
 * Supprimer un équipement
 * DELETE /api/equipement/:id
 */
export const deleteEquipement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const user = {
      schoolId: req.user?.schoolId || "",
      userId: req.user?.id || "",
      role: req.user?.role || "",
    };

    await equipementService.deleteEquipement(id, user);
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression de l'équipement." });
  }
};

/**
 * Créer un prêt d'équipement
 * POST /api/equipements/prets
 */
export const createPret = async (req: Request, res: Response) => {
  try {
    const data = CreatePretSchema.parse(req.body);
    const user = {
      schoolId: req.user?.schoolId || "",
      userId: req.user?.id || "",
      role: req.user?.role || "",
    };

    const pret = await equipementService.createPret(data, user);
    res.status(201).json(pret);
  } catch (error: any) {
    console.error("Erreur createPret", error);
    return res
      .status(500)
      .json({ error: error.message || "Erreur lors de la création du prêt." });
  }
};

/**
 * Retourner un équipement prêté
 * POST /api/equipement/prets/:id/retour
 */
export const retournerEquipementPrete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const data = RetourEquipementSchema.parse(req.body);
    const user = {
      schoolId: req.user?.schoolId || "",
      userId: req.user?.id || "",
      role: req.user?.role || "",
    };

    const pret = await equipementService.retournerPret(id, data, user);
    res.json(pret);
  } catch (error: any) {
    console.error("Erreur retournerEquipement", error);
    return res.status(500).json({
      error: error.message || "Erreur lors du retour de l'équipement.",
    });
  }
};

/**
 * Récupérer tous les prêts
 * GET /api/equipements/prets
 */
export const getPrets = async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;
    const statut = req.query.statut as string;

    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifiée" });
    }

    const prets = await equipementService.getPrets(schoolId, statut);
    res.json(prets);
  } catch (error: any) {
    console.error("Erreur getPrets", error);
    return res
      .status(400)
      .json({ error: "Erreur lors de la récupération des prêts." });
  }
};

/**
 * Récuprère les statistiques
 * @param req
 * @param res
 * @returns
 * GET /api/equipements/statistiques
 */
export const getStatistiques = async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifiée" });
    }

    const stats = await equipementService.getStatistiques(schoolId);
    res.json(stats);
  } catch (error: any) {
    console.error("Erreur getStatistiques:", error);
    return res.status(400).json({
      error: "Erreur lors de la récupération des statistiques.",
    });
  }
};

/**
 * Récupère les équipements actuellement en retard de retour pour l'école.
 */
export const getEquipementsEnRetard = async (req: Request, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({ error: "Ecole non spécifiée" });
    }

    const equipements =
      await equipementService.getEquipementsEnRetard(schoolId);

    return res.status(200).json(equipements);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des équipements en retard.",
    });
  }
};
