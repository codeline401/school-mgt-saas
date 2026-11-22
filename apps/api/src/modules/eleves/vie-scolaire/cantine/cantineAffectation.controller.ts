import { Request, Response } from "express";
import {
  AffectationCantineError,
  AffectationCantineService,
} from "./cantineAffectation.service.js";
import { ZodError } from "zod";
import {
  affectationCantineParamsSchema,
  creerAffectationCantineSchema,
  eleveCantineParamsSchema,
  terminerAffectationCantineSchema,
} from "./cantineAffectation.schema.js";

function contexteUtilisateur(req: Request) {
  if (!req.user) {
    throw new AffectationCantineError("utilisateur non authentifié", 401);
  }

  return {
    id: req.user.id,
    role: req.user.role,
    schoolId: req.user.schoolId ?? null,
  };
}

/**
 * Convertit une valeur en chaîne de caractères.
 * @param value La valeur à convertir en chaîne de caractères
 * @returns La valeur convertie en chaîne de caractères, ou une chaîne vide si la valeur est indéfinie
 */
function parametreString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    throw new AffectationCantineError("Identifiant invalide", 400);
  }

  return value ?? ""; // Retourne une chaîne vide si la valeur est indéfinie
}

/**
 * Gère les erreurs liées aux inscriptions cantine et renvoie la réponse appropriée.
 * @param res La réponse Express à envoyer
 * @param error L'erreur à traiter
 * @returns La réponse Express avec le statut et le message d'erreur appropriés
 */
function repondreErreur(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.issues });
  }

  if (error instanceof AffectationCantineError) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error("Erreur des inscriptions cantine:", error);
  return res.status(500).json({
    error:
      "Une erreur est survenue lors de la gestion des inscriptions cantine",
  });
}

export const listerAffectationCantineEleve = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = contexteUtilisateur(req);
    const { eleveId } = eleveCantineParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId),
    });

    const data = await AffectationCantineService.listerPourEleve(eleveId, user);

    return res.status(200).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const creerAffectationCantine = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req);
    const input = creerAffectationCantineSchema.parse(req.body);
    const data = await AffectationCantineService.creer(input, user);

    return res.status(201).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const terminerAffectationCantine = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = contexteUtilisateur(req);
    const { affectationId } = affectationCantineParamsSchema.parse({
      affectationId: parametreString(req.params.affectationId),
    });

    const { dateFin } = terminerAffectationCantineSchema.parse(req.body ?? {});
    const data = await AffectationCantineService.terminer(
      affectationId,
      dateFin,
      user,
    );

    return res.status(200).json(data);
  } catch (error) {
    return repondreErreur(res, error);
  }
};
