import { Request, Response } from "express";
import { FicheEleveService } from "./fiche.service.js";
import { ZodError } from "zod";
import { createEleveSchema, updateEleveSchema } from "./fiche.schema.js";

/**
 * GET /api/eleves/informations/fiche
 * Récupère la liste des élèves accessibles pour la recherche dans la fiche
 */
export const getAllFicheEleves = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };

    const eleves = await FicheEleveService.getFicheElevesBySchool({
      schoolId,
      role,
    });

    return res.status(200).json(eleves);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    console.error(
      "Erreur lors de la récupération de la liste des élèves:",
      error,
    );
    return res.status(500).json({
      message: "Erreur interne du serveur lors de la récupération des élèves",
    });
  }
};

/**
 * GET /api/eleves/:id
 * Récupère la fiche complète d'un élève par son ID
 */
export const getFicheEleve = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const eleve = await FicheEleveService.getFicheEleveById(id, {
      schoolId: req.user.schoolId as string,
      role: req.user.role as string,
    });

    return res.status(200).json(eleve);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    console.error("Erreur lors de la récupération de la fiche élève:", error);
    return res.status(500).json({
      message:
        "Erreur interne du serveur lors de la récupération de la fiche élève",
    });
  }
};

/**
 * POST /api/eleves/fiche
 * Crée un nouvel élève avec toutes ses relations
 */
export const createFicheEleve = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };

    if (role !== "SUDO_ADMIN" && role !== "ADMIN") {
      return res.status(403).json({
        message:
          "Accès refusé : Seuls les administrateurs peuvent créer des élèves",
      });
    }

    if (!schoolId) {
      return res
        .status(400)
        .json({ message: "L'utilisateur n'a pas d'école associée" });
    }

    // validation de playload
    const validatedData = createEleveSchema.parse(req.body);

    const nouvelEleve = await FicheEleveService.createFicheEleve(
      validatedData,
      {
        schoolId,
        role,
      },
    );

    return res.status(201).json(nouvelEleve);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    console.error("Erreur lors de la création de la fiche élève:", error);
    return res.status(500).json({
      message:
        "Erreur interne du serveur lors de la création de la fiche élève",
    });
  }
};

/**
 * PUT /api/eleves/fiche/:id
 * Met à jour la fiche d'un élève existant
 */
export const updateFicheEleve = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };

    if (role !== "SUDO_ADMIN" && role !== "ADMIN") {
      return res.status(403).json({
        error:
          "Accès refusé : Seuls les administrateurs peuvent mettre à jour des élèves",
      });
    }

    // validation de playload
    const validatedData = updateEleveSchema.parse(req.body);

    const eleveModifie = await FicheEleveService.updateFicheEleve(
      id,
      validatedData,
      {
        schoolId,
        role,
      },
    );

    return res.status(200).json(eleveModifie);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    console.error("Erreur lors de la mise à jour de la fiche élève:", error);
    return res.status(500).json({
      message:
        "Erreur interne du serveur lors de la mise à jour de la fiche élève",
    });
  }
};

/**
 * DELETE /api/eleves/fiche/:id
 * Suppression logique d'un élève (soft delete)
 */
export const deleteFicheEleve = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };

    if (role !== "SUDO_ADMIN" && role !== "ADMIN") {
      return res.status(403).json({
        error:
          "Accès refusé : Seuls les administrateurs peuvent supprimer des élèves",
      });
    }

    await FicheEleveService.softDeleteFicheEleve(
      id,
      { schoolId, role },
      req.user.id,
    );

    return res.status(200).json({ message: "Élève supprimé avec succès" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    console.error("Erreur lors de la suppression de la fiche élève:", error);
    return res.status(500).json({
      message:
        "Erreur interne du serveur lors de la suppression de la fiche élève",
    });
  }
};

/**
 * PATCH /api/eleves/fiche/:id/restore
 * restore un élève supprimé (soft delete)
 */
export const restoreFicheEleve = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };

    if (role !== "SUDO_ADMIN" && role !== "ADMIN") {
      return res.status(403).json({
        error:
          "Accès refusé : Seuls les administrateurs peuvent restaurer des élèves",
      });
    }

    const eleveRestored = await FicheEleveService.restoreFicheEleve(id, {
      schoolId,
      role,
    });

    return res.status(200).json({
      message: "Elève restauré avec succès",
      eleve: eleveRestored,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    console.error("Erreur lors de la restauration de la fiche élève:", error);
    return res.status(500).json({
      message:
        "Erreur interne du serveur lors de la restauration de la fiche élève",
    });
  }
};
