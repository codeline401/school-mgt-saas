import { Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { AlerteError } from "../alertes/alerte.service.js";
import {
  historiqueQuerySchema,
  regleParamsSchema,
  regleSchema,
} from "./regle.schema.js";
import { RegleAlerteService } from "./regle.service.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

/**
 * Envoleppoe commune : authentification, contexte utilisateur et gestion des erreurs
 * @param status Code HTTP de succès
 * @param message
 * @param action traitement métier
 * @returns
 */
function handler(
  status: number,
  message: string,
  action: (req: Request, user: UserContext) => Promise<unknown>,
): RequestHandler {
  return async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }
      const user: UserContext = {
        id: req.user.id,
        role: req.user.role,
        schoolId: req.user.schoolId ?? null,
      };
      return res.status(status).json(await action(req, user));
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error instanceof AlerteError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error(`${message}: `, error);
      return res.status(500).json({ error: "Une erreur interne est survenue" });
    }
  };
}

const idRegle = (req: Request) => regleParamsSchema.parse(req.params).regleId;

export const creerRegle = handler(
  201,
  "Erreur lors de la création de règle d'alerte",
  (req, user) => RegleAlerteService.creer(regleSchema.parse(req.body), user),
);

export const listerRegles = handler(
  200,
  "Une erreur est survenu lors de la récupération de la liste des règles d'alertes",
  (req, user) => RegleAlerteService.lister(user),
);

export const modifierRegle = handler(
  200,
  "Erreur lors de la modification d'une règle d'alerte",
  (req, user) =>
    RegleAlerteService.modifier(
      idRegle(req),
      regleSchema.parse(req.body),
      user,
    ),
);

export const supprimerRegle = handler(
  200,
  "Erreur lors de la suppression de la règle",
  (req, user) => RegleAlerteService.supprimer(idRegle(req), user),
);

export const apercuRegle = handler(
  200,
  "Erreur lors de l'aperçu de la règlé d'alerte",
  (req, user) => RegleAlerteService.apercu(idRegle(req), user),
);

export const historiqueAlertes = handler(
  200,
  "Erreur lors du chargement de l'historique des alertes",
  (req, user) =>
    RegleAlerteService.historique(historiqueQuerySchema.parse(req.query), user),
);
