import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  FactureEleveNotFoundError,
  FactureForbiddenError,
  FactureNotFoundError,
  FactureService,
} from "./facture.serivce.js";
import {
  eleveFacturesParamsSchema,
  factureParamsSchema,
  listeFactureQuerySchema,
  printFactureQuerySchema,
} from "./facture.schema.js";

/**
 * Envoie la réponse d'erreur adapté si l'erreur est connue ; renvoie false sinon.
 */
function sendKnownError(error: unknown, res: Response): boolean {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Paramètres invalides",
      details: error.issues,
    });
    return true;
  }
  if (
    error instanceof FactureEleveNotFoundError ||
    error instanceof FactureNotFoundError
  ) {
    res.status(404).json({
      message: error.message,
    });
    return true;
  }
  if (error instanceof FactureForbiddenError) {
    res.status(403).json({
      message: error.message,
    });
    return true;
  }
  return false;
}

export const getFacturesEleve = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { eleveId } = eleveFacturesParamsSchema.parse(req.params); // Récupère et valide l'ID de l'élève à partir des paramètres de la requête
    const query = listeFactureQuerySchema.parse(req.query); // Récupère et valide les paramètres de la requête pour la liste des factures

    const result = await FactureService.listeFacturesEleve(eleveId, query, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (sendKnownError(error, res)) return res;
    console.error(
      "Erreur lors de la récupération des factures de l'élève:",
      error,
    );
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getFactureDetail = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { factureId } = factureParamsSchema.parse(req.params); // Récupère et valide l'ID de la facture à partir des paramètres de la requête

    const facture = await FactureService.getFactureDetail(factureId, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId,
    });

    return res.status(200).json(facture);
  } catch (error) {
    if (sendKnownError(error, res)) return res;
    console.error("Erreur lors de la récupération de la facture:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getFactureImpression = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Utilisateur non authentifié" });
      return; // Stop execution if the user is not authenticated
    }

    const { factureId } = factureParamsSchema.parse(req.params); // Récupère et valide l'ID de la facture à partir des paramètres de la requête
    const { format } = printFactureQuerySchema.parse(req.query ?? {}); // Récupère et valide le format d'impression de la facture à partir des paramètres de la requête

    // Appel du service retournant le Buffer PDF
    const pdfBuffer = await FactureService.generePdfImpression(
      factureId,
      format,
      {
        id: req.user.id,
        role: req.user.role,
        schoolId: req.user.schoolId,
      },
    );

    // preferCSSPageSize (déjà activé dans pdfGenerator) fait respecter le `@page` du template

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="recu-${factureId}.pdf"`,
    ); // Indique au navigateur d'afficher le PDF en ligne avec le nom de fichier spécifié
    res.status(200).send(pdfBuffer);
  } catch (error) {
    if (sendKnownError(error, res)) return;
    console.error(
      "Erreur lors de la génération de l'impression de la facture:",
      error,
    );
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
