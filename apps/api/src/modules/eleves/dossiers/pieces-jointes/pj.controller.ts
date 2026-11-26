import { Request, Response } from "express";
import {
  EleveAttachementError,
  EleveAttachementService,
} from "./pj.service.js";
import { ZodError } from "zod";
import {
  attachementParamsSchema,
  creerUploadAttachementUrlSchema,
  eleveAttachementParamsSchema,
  listerPiecesJointesQuerySchema,
} from "./pj.schema.js";

/**
 * Extrait le contexte utilisateur de la requête Express et le retourne sous forme d'objet.
 * @param req La requête Express contenant l'utilisateur authentifié
 * @returns Le contexte utilisateur extrait de la requête (id, role, schoolId)
 */
function contexteUtilisateur(req: Request) {
  if (!req.user) {
    throw new EleveAttachementError("Utilisateur non authentifié", 401);
  }

  return {
    id: req.user.id,
    role: req.user.role,
    schoolId: req.user.schoolId ?? null,
  };
}

/**
 * Convertit une valeur en chaîne de caractères, en vérifiant qu'elle n'est pas un tableau.
 * @param value La valeur à convertir en chaîne de caractères
 * @returns La valeur sous forme de chaîne de caractères, ou une chaîne vide si elle est indéfinie
 */
function parametreString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    throw new EleveAttachementError("Identifiant invalide.", 400);
  }
  return value ?? ""; // Retourne la valeur si elle est définie, sinon une chaîne vide
}

/**
 * Gère les erreurs survenues lors de la gestion des pièces jointes et renvoie une réponse appropriée à l'utilisateur en fonction du type d'erreur
 * @param res La réponse Express utilisée pour renvoyer l'erreur
 * @param error L'erreur à traiter et à renvoyer à la réponse Express
 *
 */
function repondreErreur(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.issues });
  }

  if (error instanceof EleveAttachementError) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error("Erreur du module picèes jointes:", error);
  return res.status(500).json({
    error: "Une erreur est survenue lors de la gestion des pièces jointes",
  });
}

export const listerPiecesJointes = async (req: Request, res: Response) => {
  try {
    const eleveId = eleveAttachementParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId),
    }).eleveId; //
    const { archived } = listerPiecesJointesQuerySchema.parse(req.query);

    const data = await EleveAttachementService.lister(
      eleveId,
      archived,
      contexteUtilisateur(req),
    );

    return res.status(200).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const creerUrUploadPieceJointe = async (req: Request, res: Response) => {
  try {
    const eleveId = eleveAttachementParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId),
    }).eleveId; //

    const input = creerUploadAttachementUrlSchema.parse(req.body); //

    const data = await EleveAttachementService.creerAttachementUploadUrl(
      eleveId,
      input,
      contexteUtilisateur(req),
    );

    return res.status(201).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const confirmerUploadPieceJointe = async (
  req: Request,
  res: Response,
) => {
  try {
    const eleveId = eleveAttachementParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId),
    }).eleveId;
    const attachementId = attachementParamsSchema.parse({
      attachementId: parametreString(req.params.attachementId),
    }).attachementId; // Récupère l'identifiant de l'attachement validé

    const data = await EleveAttachementService.confirmerUpload(
      eleveId,
      attachementId,
      contexteUtilisateur(req),
    );

    return res.status(200).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const obtenirUrlTelechargementPieceJointe = async (
  req: Request,
  res: Response,
) => {
  try {
    const eleveId = eleveAttachementParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId),
    }).eleveId;
    const attachementId = attachementParamsSchema.parse({
      attachementId: parametreString(req.params.attachementId),
    }).attachementId; // Récupère l'identifiant de l'attachement validé

    const data = await EleveAttachementService.creerUrlTelechargement(
      eleveId,
      attachementId,
      contexteUtilisateur(req),
    );

    return res.status(200).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const archiverPieceJointe = async (req: Request, res: Response) => {
  try {
    const eleveId = eleveAttachementParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId),
    }).eleveId;
    const attachementId = attachementParamsSchema.parse({
      attachementId: parametreString(req.params.attachementId),
    }).attachementId;

    const data = await EleveAttachementService.archiver(
      eleveId,
      attachementId,
      contexteUtilisateur(req),
    );

    return res.status(200).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const restaurerPieceJointe = async (req: Request, res: Response) => {
  try {
    const eleveId = eleveAttachementParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId),
    }).eleveId;
    const attachementId = attachementParamsSchema.parse({
      attachementId: parametreString(req.params.attachementId),
    }).attachementId;

    const data = await EleveAttachementService.restaurer(
      eleveId,
      attachementId,
      contexteUtilisateur(req),
    );

    return res.status(200).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const supprimerPieceJointe = async (req: Request, res: Response) => {
  try {
    const eleveId = eleveAttachementParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId),
    }).eleveId;
    const attachementId = attachementParamsSchema.parse({
      attachementId: parametreString(req.params.attachementId),
    }).attachementId; // Récupère l'indentifiant de l'attachement

    const data = await EleveAttachementService.supprimer(
      eleveId,
      attachementId,
      contexteUtilisateur(req),
    );

    return res.status(200).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};
