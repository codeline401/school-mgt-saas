import { Response, Request } from "express";
import { ZodError } from "zod";
import {
  NiveauService,
  SectionService,
  OptionService,
  ClasseStructureService,
  AffectationClasseService,
} from "./affectation.service.js";
import {
  createNiveauSchema,
  updateNiveauSchema,
  createSectionSchema,
  updateSectionSchema,
  createOptionSchema,
  updateOptionSchema,
  assignClasseStrtuctureSchema,
  createAffectationSchema,
} from "./affectation.schema.js";

const sendClasseAffectationError = (
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
    // Les messages métiers (accès refusé, non trouvé, conflit) sont volontairement
    // renvoyés tels quels : ils sont écrits pour être lisibles côté client.
    const message = error.message;

    if (message.startsWith("Accès refusé")) {
      return res.status(403).json({ message });
    }
    if (/non trouvé|introuvable/i.test(message)) {
      return res.status(404).json({ message });
    }
    if (/existe déjà|encore rattaché|déjà affecté/i.test(message)) {
      return res.status(409).json({ message });
    }
    // Le reste (niveau/section/option invalide, classe hors école, etc.) sont
    // des erreurs de validation métier volontairement levées par le service.
    if (/invalide|n'appartient pas|requis/i.test(message)) {
      return res.status(400).json({ message });
    }

    console.error("Erreur sur le service classe-affectation:", error);
    return res.status(500).json({ message: fallback });
  }

  console.error("Erreur sur le service classe-affectation inconnue:", error);
  return res.status(500).json({ message: fallback });
};

// ================================================================
// NIVEAU
// ================================================================

/**
 * GET /api/classes/niveaux
 * Liste des niveaux de l'école
 */
export const getAllNiveaux = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const requestedSchoolId =
      role === "SUDO_ADMIN" && typeof req.query.schoolId === "string"
        ? req.query.schoolId
        : schoolId;
    const niveaux = await NiveauService.getNiveauBySchool({
      schoolId: requestedSchoolId,
      role,
    });

    return res.status(200).json(niveaux);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération des niveaux",
    );
  }
};

/**
 * GET /api/classes/niveaux/:id
 * Détail d'un niveau par son ID
 */
export const getNiveauById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const niveau = await NiveauService.getNiveauById(id, { schoolId, role });

    return res.status(200).json(niveau);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération du niveau",
    );
  }
};

/**
 * POST /api/classes/niveaux
 * Crée un niveau (ex: "6ème", "Terminale")
 */
export const createNiveau = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = createNiveauSchema.parse(req.body);

    const niveau = await NiveauService.createNiveau(validatedData, {
      schoolId,
      role,
    });

    return res.status(201).json(niveau);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la création du niveau",
    );
  }
};

/**
 * PUT /api/classes/niveaux/:id
 * Met à jour un niveau
 */
export const updateNiveau = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = updateNiveauSchema.parse(req.body);

    const niveau = await NiveauService.updateNiveau(id, validatedData, {
      schoolId,
      role,
    });

    return res.status(200).json(niveau);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la mise à jour du niveau",
    );
  }
};

/**
 * DELETE /api/classes/niveaux/:id
 * Supprime un niveau (impossible si des classes y sont encore rattachées)
 */
export const deleteNiveau = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    await NiveauService.deleteNiveau(id, { schoolId, role });

    return res.status(200).json({ message: "Niveau supprimé avec succès" });
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la suppression du niveau",
    );
  }
};

// ================================================================
// SECTION
// ================================================================

/**
 * GET /api/classes/sections
 * Liste des sections de l'école
 */
export const getAllSections = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const requestedSchoolId =
      role === "SUDO_ADMIN" && typeof req.query.schoolId === "string"
        ? req.query.schoolId
        : schoolId;
    const sections = await SectionService.getSectionsBySchool({
      schoolId: requestedSchoolId,
      role,
    });

    return res.status(200).json(sections);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération des sections",
    );
  }
};

/**
 * GET /api/classes/sections/:id
 * Détail d'une section par son ID
 */
export const getSectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const section = await SectionService.getSectionById(id, {
      schoolId,
      role,
    });

    return res.status(200).json(section);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération de la section",
    );
  }
};

/**
 * POST /api/classes/sections
 * Crée une section (ex: "A", "Scientifique"), éventuellement rattachée à un niveau
 */
export const createSection = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = createSectionSchema.parse(req.body);

    const section = await SectionService.createSection(validatedData, {
      schoolId,
      role,
    });

    return res.status(201).json(section);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la création de la section",
    );
  }
};

/**
 * PUT /api/classes/sections/:id
 * Met à jour une section
 */
export const updateSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = updateSectionSchema.parse(req.body);

    const section = await SectionService.updateSection(id, validatedData, {
      schoolId,
      role,
    });

    return res.status(200).json(section);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la mise à jour de la section",
    );
  }
};

/**
 * DELETE /api/classes/sections/:id
 * Supprime une section (impossible si des classes y sont encore rattachées)
 */
export const deleteSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    await SectionService.deleteSection(id, { schoolId, role });

    return res.status(200).json({ message: "Section supprimée avec succès" });
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la suppression de la section",
    );
  }
};

// ================================================================
// OPTION
// ================================================================

/**
 * GET /api/classes/options
 * Liste des options de l'école
 */
export const getAllOptions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const requestedSchoolId =
      role === "SUDO_ADMIN" && typeof req.query.schoolId === "string"
        ? req.query.schoolId
        : schoolId;
    const options = await OptionService.getOptionsBySchool({
      schoolId: requestedSchoolId,
      role,
    });

    return res.status(200).json(options);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération des options",
    );
  }
};

/**
 * POST /api/classes/options
 * Crée une option (ex: "LV2 Allemand", "Musique")
 */
export const createOption = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = createOptionSchema.parse(req.body);

    const option = await OptionService.createOption(validatedData, {
      schoolId,
      role,
    });

    return res.status(201).json(option);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la création de l'option",
    );
  }
};

/**
 * PUT /api/classes/options/:id
 * Met à jour une option
 */
export const updateOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = updateOptionSchema.parse(req.body);

    const option = await OptionService.updateOption(id, validatedData, {
      schoolId,
      role,
    });

    return res.status(200).json(option);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la mise à jour de l'option",
    );
  }
};

/**
 * DELETE /api/classes/options/:id
 * Supprime une option
 */
export const deleteOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    await OptionService.deleteOption(id, { schoolId, role });

    return res.status(200).json({ message: "Option supprimée avec succès" });
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la suppression de l'option",
    );
  }
};

// ================================================================
// STRUCTURE DE CLASSE (niveau / section / options)
// ================================================================

/**
 * PUT /api/classes/:id/structure
 * Rattache un niveau, une section (optionnelle) et des options à une classe
 */
export const assignClasseStructure = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const validatedData = assignClasseStrtuctureSchema.parse(req.body);

    const classe = await ClasseStructureService.assignClasseStructure(
      id,
      validatedData,
      { schoolId, role },
    );

    return res.status(200).json(classe);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la mise à jour de la structure de la classe",
    );
  }
};

// ================================================================
// AFFECTATION CLASSE (inscription / transfert / promotion / etc.)
// ================================================================

/**
 * GET /api/eleves/:eleveId/informations/affectations
 * Historique des affectations de classe d'un élève
 */
export const getAffectationsByEleve = async (req: Request, res: Response) => {
  try {
    const { eleveId } = req.params as { eleveId: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const affectations = await AffectationClasseService.getAffectationsByEleve(
      eleveId,
      { schoolId, role },
    );

    return res.status(200).json(affectations);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération des affectations de l'élève",
    );
  }
};

/**
 * GET /api/classes/:classeId/affectations
 * Historique des mouvements (entrées/sorties) d'une classe
 */
export const getAffectationsByClasse = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { role, schoolId } = req.user as { role: string; schoolId: string };
    const affectations = await AffectationClasseService.getAffectationByClasse(
      classeId,
      {
        schoolId,
        role,
      },
    );

    return res.status(200).json(affectations);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération des affectations de la classe",
    );
  }
};

/**
 * POST /api//informations/affectations
 * Change la classe d'un élève (inscription, transfert, promotion, redoublement, retrait)
 */
export const creerAffectation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const {
      id: userId,
      role,
      schoolId,
    } = req.user as {
      id: string;
      role: string;
      schoolId: string;
    };
    const validatedData = createAffectationSchema.parse(req.body);

    const affectation = await AffectationClasseService.changeEleveClasse(
      validatedData,
      userId,
      { schoolId, role },
    );

    return res.status(201).json(affectation);
  } catch (error) {
    return sendClasseAffectationError(
      res,
      error,
      "Erreur interne du serveur lors du changement de classe de l'élève",
    );
  }
};
