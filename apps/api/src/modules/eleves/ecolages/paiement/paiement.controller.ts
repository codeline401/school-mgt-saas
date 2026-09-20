import { Request, Response } from "express";
import {
  enregistrementPaiementSchema,
  paiementParamsSchema,
} from "./paiement.schema.js";
import {
  PaiementEcolageService,
  PaiementEleveForbiddenError,
  PaiementEleveNotFoundError,
  PaiementFraisIntrouvableError,
} from "./paiement.service.js";
import { ZodError } from "zod";

export const getEcolagesEleve = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { eleveId } = paiementParamsSchema.parse(req.params);
    const ecolages = await PaiementEcolageService.getEcolagesEleve(eleveId, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId as string,
    });

    return res.status(200).json(ecolages);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "ID élève invalide",
        details: error.issues,
      });
    }

    if (error instanceof PaiementEleveNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof PaiementEleveForbiddenError) {
      return res.status(403).json({ message: error.message });
    }

    console.error("Erreur lors de la récupération des écolages:", error);
    return res.status(500).json({
      message: "Erreur interne lors de la récupération des écolages",
    });
  }
};

export const enregistrerPaiementEcolage = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { eleveId } = paiementParamsSchema.parse(req.params); // Extraction de l'ID de l'élève à partir des paramètres de la requête
    const input = enregistrementPaiementSchema.parse(req.body); // Validation et extraction des données de paiement à partir du corps de la requête

    const paiement = await PaiementEcolageService.enregistrerPaiement(
      eleveId,
      input,
      {
        id: req.user?.id,
        role: req.user?.role,
        schoolId: req.user?.schoolId as string,
      },
    );

    return res.status(201).json(paiement);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Données de paiement invalides",
        details: error.issues,
      });
    }

    if (error instanceof PaiementEleveNotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    if (error instanceof PaiementEleveForbiddenError) {
      return res.status(403).json({ message: error.message });
    }

    if (error instanceof PaiementFraisIntrouvableError) {
      return res.status(404).json({ message: error.message });
    }

    console.error(
      "Erreur lors de l'enregistrement du paiement d'écolage:",
      error,
    );
    return res
      .status(500)
      .json({
        message:
          "Erreur interne lors de l'enregistrement du paiement d'écolage",
      });
  }
};
