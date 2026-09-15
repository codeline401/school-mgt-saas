import type { Request, Response } from "express";
import { ZodError } from "zod";
import { historiqueStudentParamsSchema } from "./historique.schema.js";
import {
  HistoriqueEleveForbiddenError,
  HistoriqueEleveNotFoundError,
  HistoriqueEleveService,
} from "./historique.service.js";

export const getEleveHistorique = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    const { eleveId } = historiqueStudentParamsSchema.parse(req.params);

    const historique = await HistoriqueEleveService.getByStudentId(eleveId, {
      role: req.user.role,
      schoolId: req.user.schoolId,
    });

    return res.status(200).json(historique);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "ID élève invalide",
        details: error.issues,
      });
    }

    if (error instanceof HistoriqueEleveNotFoundError) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error instanceof HistoriqueEleveForbiddenError) {
      return res.status(403).json({
        message: error.message,
      });
    }

    console.error(
      "Erreur lors de la récupération de l'historique élève:",
      error,
    );

    return res.status(500).json({
      message:
        "Erreur interne lors de la récupération de l'historique de l'élève",
    });
  }
};
