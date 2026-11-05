import { RequestHandler, Request, Response } from "express";
import { ZodError } from "zod";
import { SanctionError, SanctionService } from "./sanction.service.js";
import {
  creerSanctionSchema,
  listeSanctionsQuerySchema,
  modifierSanctionSchema,
  sanctionParamsSchema,
  statutSanctionInputSchema,
} from "./sanction.schema.js";

/**
 * Crée un gestionnaire de requête Express pour exécuter une action et gérer les erreurs.
 * Gère les erreurs de validation et les erreurs spécifiques aux sanctions, et renvoie une réponse appropriée.
 * @param action l'action à exécuter pour gérer la requête
 * @param status le code de statut HTTP à utiliser pour la réponse réussie (par défaut 200)
 * @returns un gestionnaire de requête Express qui exécute l'action et gère les erreurs
 */
function handler(
  action: (req: Request) => Promise<unknown>,
  status = 200,
): RequestHandler {
  return async (req, res: Response) => {
    try {
      return res.status(status).json(await action(req)); // Send the result of the action as JSON response with the specified status code
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error instanceof SanctionError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error("Erreur module sanction :", error);
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }
  };
}

/**
 * Récupère les informations de l'utilisateur authentifié à partir de la requête Express.
 * @param req La requête Express contenant l'utilisateur authentifié
 * @returns Un objet contenant l'id, le rôle et l'identifiant de l'école de l'utilisateur
 */
function user(req: Request) {
  if (!req.user) {
    throw new SanctionError("Utilisateur non authentifié", 401);
  }
  return {
    id: req.user.id,
    role: req.user.role,
    schoolId: req.user.schoolId ?? null,
  };
}

export const listerSanctions = handler((req) =>
  SanctionService.lister(listeSanctionsQuerySchema.parse(req.query), user(req)),
);

export const creerSanction = handler(
  (req) =>
    SanctionService.creer(creerSanctionSchema.parse(req.body), user(req)),
  201,
);

export const modifierSanction = handler((req) =>
  SanctionService.modifier(
    sanctionParamsSchema.parse(req.params).sanctionId,
    modifierSanctionSchema.parse(req.body),
    user(req),
  ),
);

export const changerStatutSanction = handler((req) =>
  SanctionService.changerStatut(
    sanctionParamsSchema.parse(req.params).sanctionId,
    statutSanctionInputSchema.parse(req.body).statut,
    user(req),
  ),
);
