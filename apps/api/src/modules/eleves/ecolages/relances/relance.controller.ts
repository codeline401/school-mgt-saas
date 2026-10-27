import { Request, Response } from "express";
import { ZodError } from "zod";
import { RelanceError, RelanceService } from "./relance.service.js";
import {
  creerRelanceSchema,
  filtreDestinatairesSchema,
  listeRelancesQuerySchema,
  relanceParamsSchema,
} from "./relance.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

// Authentifie, exécute l'action et convertit les erreurs connues en réponses HTPP
async function executer(
  req: Request,
  res: Response,
  statutSucces: number,
  messageErreur: string,
  action: (user: UserContext) => Promise<unknown>,
): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Utilisateur non authentifié",
      });
    }

    const result = await action({
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId,
    });

    return res.status(statutSucces).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error instanceof RelanceError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error(`${messageErreur}: `, error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

/**
 * Affiche un aperçu de la relance en fonction des destinataires filtrés
 * @param req La requête HTTP contenant les informations de l'utilisateur et le corps de la requête
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou les erreurs
 */
export const apercuRelance = (req: Request, res: Response) => {
  executer(req, res, 200, "Erreur lors de l'aperçu de la relance", (user) =>
    RelanceService.apercu(filtreDestinatairesSchema.parse(req.body), user),
  );
};

/**
 * Crée une nouvelle relance en fonction des informations fournies dans le corps de la requête
 * @param req La requête HTTP contenant les informations de l'utilisateur et le corps de la requête
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou les erreurs
 */
export const creerRelance = (req: Request, res: Response) => {
  executer(req, res, 201, "Erreur lors de la création de la relance", (user) =>
    RelanceService.creer(creerRelanceSchema.parse(req.body), user),
  );
};

/**
 * Récupère la liste des relances en fonction des critères de la requête
 * @param req La requête HTTP contenant les informations de l'utilisateur et les paramètres de la requête
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou les erreurs
 */
export const listerRelances = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de la récupération des relances",
    (user) =>
      RelanceService.lister(listeRelancesQuerySchema.parse(req.query), user),
  );
};

/**
 * Annule une relance en fonction de l'identifiant fourni dans les paramètres de la requête
 * @param req La requête HTTP contenant les informations de l'utilisateur et les paramètres de la requête
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou les erreurs
 */
export const annulerRelance = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de l'annulation de la relance",
    (user) => {
      const { relanceId } = relanceParamsSchema.parse(req.params);
      return RelanceService.annuler(relanceId, user);
    },
  );
};
