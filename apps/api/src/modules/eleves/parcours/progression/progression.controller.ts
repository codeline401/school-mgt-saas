import { Request, Response } from "express";
import {
  progressionParamsSchema,
  progressionQuerySchema,
} from "./progression.schema.js";
import { ProgressionError, ProgressionService } from "./progression.service.js";
import { ZodError } from "zod";

export const getProgressionEleve = async (req: Request, res: Response) => {
  try {
    const rawEleveId = req.params.eleveId; // Récupère l'ID de l'élève depuis les paramètres de la requête

    if (Array.isArray(rawEleveId)) {
      return res.status(400).json({ error: "Identifant de l'élève invalide" });
    }

    const { eleveId } = progressionParamsSchema.parse({ eleveId: rawEleveId });
    const query = progressionQuerySchema.parse(req.query);
    const { schoolId } = req.user!; //

    if (!schoolId) {
      return res.status(403).json({
        error:
          "Vous devez appartenir à une école pour accéder à cette ressource",
      });
    }

    const progression = await ProgressionService.getProgression(
      eleveId,
      query,
      {
        id: req.user!.id,
        role: req.user!.role,
        schoolId,
      },
    );

    return res.status(200).json(progression);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error instanceof ProgressionError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error(
      "Erreur lors de la récupéaration de la progression de l'élève :",
      error,
    );
    return res
      .status(500)
      .json({
        error:
          "Erreur interne lors de la récupération de la progression de l'élève",
      });
  }
};
