import { Response, Request } from "express";
import { ZodError } from "zod";
import { ResponsableService } from "./responsable.service.js";
import {
  affilierEleveSchema,
  createResponsableSchema,
  updateResponsableSchema,
} from "./responsable.schema.js";
const sendResponsableError = (
  res: Response,
  error: unknown,
  fallback: string,
): Response => {
  if (error instanceof ZodError) {
    return res
      .status(400)
      .json({ message: "Données invalides", details: error.issues });
  }

  if (error instanceof Error) {
    // Les messages métiers (aceeès refusé, non trouvé, conflit) sont volontairement
    // renoyés tels quels : ils sont écrits pour être lsibles côté client.
    const message = error.message;

    if (message.startsWith("Accès refusé")) {
      return res.status(403).json({ message });
    }
    if (/non trouvé/i.test(message)) {
      return res.status(404).json({ message });
    }
    if (message.includes("qu'un seul responsable")) {
      return res.status(409).json({ message });
    }
    if (message.startsWith("Un ou plusieurs élèves")) {
      return res.status(400).json({ message });
    }

    console.error("Erreur sur le service responsable:", error);
    return res.status(500).json({ message: fallback });
  }

  console.error("Erreur sur le service responsable inconnu:", error);
  return res.status(500).json({ message: fallback });
};

/**
 * GET /api/eleves/informations/responsables
 * Listes des responsables (parent/tuteurs) de l'école
 */
export const getAllResponsables = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const responsables = await ResponsableService.getResponsablesBySchool({
      schoolId,
      role,
    });

    return res.status(200).json(responsables);
  } catch (error) {
    return sendResponsableError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération des responsables",
    );
  }
};

/**
 * GET /api/eleves/informations/responsables/:id
 * Détail d'un responsable (parent/tuteur) par son ID et de ses élèves associés
 */
export const getResponsableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const responsable = await ResponsableService.getResponsableById(id, {
      schoolId: req.user.schoolId as string,
      role: req.user.role as string,
    });

    return res.status(200).json(responsable);
  } catch (error) {
    return sendResponsableError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération du responsable",
    );
  }
};

/**
 * POST /api/eleves/informations/responsables
 * Crée un responsable (parent/tuteur) et l'associe à un ou plusieurs élèves
 */
export const createResponsable = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = createResponsableSchema.parse(req.body); // Validation des données d'entrée

    const newResponsable = await ResponsableService.createResponsable(
      validatedData,
      { schoolId, role },
    );

    return res.status(201).json(newResponsable);
  } catch (error) {
    return sendResponsableError(
      res,
      error,
      "Erreur interne du serveur lors de la création du responsable",
    );
  }
};

/**
 * PUT /api/eleves/informations/responsables/:id
 * Met à jour les coordonnées d'un responsable (parent/tuteur) et ses associations avec les élèves
 */
export const updateResponsable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = updateResponsableSchema.parse(req.body); // Validation des données d'entrée

    const responsable = await ResponsableService.updateResponsable(
      id,
      validatedData,
      { schoolId, role },
    );

    return res.status(200).json(responsable);
  } catch (error) {
    return sendResponsableError(
      res,
      error,
      "Erreur interne du serveur lors de la mise à jour du responsable",
    );
  }
};

/**
 * POST /api/eleves/informations/responsables/:id/affilier
 * Affilie des élèves supp à un responsable existant (parent/tuteur)
 */
export const affilierElevesAuResponsable = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params as { id: string }; // ID du responsable

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const { eleveIds } = affilierEleveSchema.parse(req.body);

    const responsable = await ResponsableService.affilierEleves(id, eleveIds, {
      schoolId,
      role,
    });

    return res.status(200).json(responsable);
  } catch (error) {
    return sendResponsableError(
      res,
      error,
      "Erreur interne du serveur lors de l'affiliation des élèves au responsable",
    );
  }
};

/**
 * DELETE /api/eleves/informations/responsables/:id/eleves/:eleveId
 * Retire l'affiliation d'un élève pour un reponsable donné
 */
export const retirerAffiliationEleve = async (req: Request, res: Response) => {
  try {
    const { id, eleveId } = req.params as { id: string; eleveId: string }; // ID du responsable et de l'élève

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };

    await ResponsableService.retirerAffiliation(id, eleveId, {
      schoolId,
      role,
    });

    return res
      .status(200)
      .json({ message: "Affiliation de l'élève retirée avec succès" });
  } catch (error) {
    return sendResponsableError(
      res,
      error,
      "Erreur interne du serveur lors du retrait de l'affiliation de l'élève",
    );
  }
};

/**
 * DELETE /api/eleves/informations/responsables/:id
 * Supprime un responsable (parent/tuteur) et détache tous les élèves associés
 */
export const deleteResponsable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }; // ID du responsable

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };

    await ResponsableService.deleteResponsable(id, { schoolId, role });

    return res
      .status(200)
      .json({ message: "Responsable supprimé avec succès" });
  } catch (error) {
    return sendResponsableError(
      res,
      error,
      "Erreur interne du serveur lors de la suppression du responsable",
    );
  }
};
