import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  classeParamsSchema,
  anneeScolaireQuerySchema,
  upsertEcolageConfigSchema,
  genererEcolagesSchema,
} from "./ecolageConfig.schema.js";
import {
  EcolageConfigService,
  ClasseNotFoundError,
  ClasseForbiddenError,
  EcolageConfigNotFoundError,
} from "./ecolageConfig.service.js";

function handleKnownErrors(error: unknown, res: Response): Response | null {
  if (error instanceof ZodError) {
    return res
      .status(400)
      .json({ message: "Données invalides", details: error.issues });
  }
  if (
    error instanceof ClasseNotFoundError ||
    error instanceof EcolageConfigNotFoundError
  ) {
    return res.status(404).json({ message: error.message });
  }
  if (error instanceof ClasseForbiddenError) {
    return res.status(403).json({ message: error.message });
  }
  return null;
}

export const getEcolageConfig = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { classeId } = classeParamsSchema.parse(req.params);
    const { anneeScolaire } = anneeScolaireQuerySchema.parse(req.query);

    const config = await EcolageConfigService.getByClasse(
      classeId,
      anneeScolaire,
      {
        id: req.user.id,
        role: req.user.role,
        schoolId: req.user.schoolId,
      },
    );

    return res.status(200).json(config);
  } catch (error) {
    const handled = handleKnownErrors(error, res);
    if (handled) return handled;

    console.error(
      "Erreur lors de la récupération de la configuration d'écolage:",
      error,
    );
    return res.status(500).json({ message: "Erreur interne" });
  }
};

export const upsertEcolageConfig = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { classeId } = classeParamsSchema.parse(req.params);
    const input = upsertEcolageConfigSchema.parse(req.body);

    const config = await EcolageConfigService.upsertConfig(classeId, input, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId,
    });

    return res.status(200).json(config);
  } catch (error) {
    const handled = handleKnownErrors(error, res);
    if (handled) return handled;

    console.error(
      "Erreur lors de l'enregistrement de la configuration d'écolage:",
      error,
    );
    return res.status(500).json({ message: "Erreur interne" });
  }
};

export const genererEcolagesClasse = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { classeId } = classeParamsSchema.parse(req.params);
    const { anneeScolaire } = genererEcolagesSchema.parse(req.body);

    const result = await EcolageConfigService.genererEcolagesPourClasse(
      classeId,
      anneeScolaire,
      { id: req.user.id, role: req.user.role, schoolId: req.user.schoolId },
    );

    return res.status(200).json(result);
  } catch (error) {
    const handled = handleKnownErrors(error, res);
    if (handled) return handled;

    console.error("Erreur lors de la génération des écolages:", error);
    return res.status(500).json({ message: "Erreur interne" });
  }
};
