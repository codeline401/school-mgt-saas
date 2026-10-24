import { Request, Response } from "express";
import { ZodError } from "zod";
import { AjournementError, AjournementService } from "./ajournement.service.js";
import {
  accepterAjournementSchema,
  ajournementParamsSchema,
  contrePropositionSchema,
  creerAjournementSchema,
  listesAjournementQuerySchema,
  refuserAjournementSchema,
  reponseContrePropositionSchema,
} from "./ajournement.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

/**
 * Exécute l'action, authentifie l'utilisateur et convertit les erreurs connues en erreurs HTTP
 */
async function executer(
  req: Request,
  res: Response,
  statutSucces: number,
  messageErreur: string,
  action: (user: UserContext) => Promise<unknown>,
): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const result = await action({
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId,
    });
    return res.status(statutSucces).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: error.issues,
      });
    }

    if (error instanceof AjournementError) {
      return res.status(error.status).json({
        error: error.message,
      });
    }

    console.error(`${messageErreur}: `, error);
    return res.status(500).json({
      message: "Erreur interne du serveur",
    });
  }
}

// -------------------- PARENT --------------------------

/**
 * Crée un nouvel ajournement pour l'utilisateur authentifié (PARENT)
 * @param req La requête HTTP contenant les données de l'ajournement
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const creerAjournement = (req: Request, res: Response) => {
  executer(
    req,
    res,
    201,
    "Erreur lors de la création de l'ajournement",
    (user) =>
      AjournementService.creer(creerAjournementSchema.parse(req.body), user),
  );
};

/**
 * Récupère la liste des ajournements pour l'utilisateur authentifié (PARENT)
 * @param req La requête HTTP contenant les paramètres de filtrage
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const listerMesAjournements = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de la récupération des ajournements",
    (user) =>
      AjournementService.listerMesDemandes(
        listesAjournementQuerySchema.parse(req.query),
        user,
      ),
  );
};

/**
 * Récupère un ajournement spécifique pour l'utilisateur authentifié (PARENT)
 * @param req La requête HTTP contenant l'identifiant de l'ajournement
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const getMonAjournement = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de la récupération de l'ajournement",
    (user) => {
      const { ajournementId } = ajournementParamsSchema.parse(req.params);
      return AjournementService.getMaDemande(ajournementId, user);
    },
  );
};

/**
 * Annule un ajournement spécifique pour l'utilisateur authentifié (PARENT)
 * @param req La requête HTTP contenant l'identifiant de l'ajournement
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const annulerAjournement = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de l'annulation de l'ajournement",
    (user) => {
      const { ajournementId } = ajournementParamsSchema.parse(req.params);
      return AjournementService.annuler(ajournementId, user);
    },
  );
};

/**
 * Répond à une contre-proposition pour l'utilisateur authentifié (PARENT)
 * @param req La requête HTTP contenant l'identifiant de l'ajournement et la réponse à la contre-proposition
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const repondreContreProposition = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de la réponse à la contre-proposition",
    (user) => {
      const { ajournementId } = ajournementParamsSchema.parse(req.params);
      const input = reponseContrePropositionSchema.parse(req.body);
      return AjournementService.repondreContreProposition(
        ajournementId,
        input,
        user,
      );
    },
  );
};

// ------------------- ADMIN --------------------------

/**
 * Récupère la liste de tous les ajournements (ADMIN)
 * @param req La requête HTTP contenant les paramètres de filtrage et de pagination
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const listerAjournements = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de la récupération des ajournements",
    (user) =>
      AjournementService.listerToutes(
        listesAjournementQuerySchema.parse(req.query),
        user,
      ),
  );
};

/**
 * Récupère les détails d'un ajournement spécifique (ADMIN)
 * @param req La requête HTTP contenant l'identifiant de l'ajournement
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const getAjournementDetail = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de la récupération de l'ajournement",
    (user) => {
      const { ajournementId } = ajournementParamsSchema.parse(req.params);
      return AjournementService.getDetail(ajournementId, user);
    },
  );
};

/**
 * Accepte une demande d'ajournement spécifique (ADMIN)
 * @param req La requête HTTP contenant l'identifiant de l'ajournement et les informations pour l'acceptation
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const accepterAjournement = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de l'acceptation de l'ajournement",
    (user) => {
      const { ajournementId } = ajournementParamsSchema.parse(req.params);
      const input = accepterAjournementSchema.parse(req.body ?? {}); // Parse et valide le corps de la requête
      return AjournementService.accepter(ajournementId, input, user);
    },
  );
};

/**
 * Refuse une demande d'ajournement spécifique (ADMIN)
 * @param req La requête HTTP contenant l'identifiant de l'ajournement et les informations pour le refus
 * @param res La réponse HTTP utilisée pour renvoyer le résultat ou l'erreur
 */
export const refuserAjournement = (req: Request, res: Response) => {
  executer(req, res, 200, "Erreur lors du refus de l'ajournement", (user) => {
    const { ajournementId } = ajournementParamsSchema.parse(req.params);
    const input = refuserAjournementSchema.parse(req.body);
    return AjournementService.refuser(ajournementId, input, user);
  });
};

export const contreProposerAjournement = (req: Request, res: Response) => {
  executer(
    req,
    res,
    200,
    "Erreur lors de la contre-proposition de l'ajournement",
    (user) => {
      const { ajournementId } = ajournementParamsSchema.parse(req.params);
      const input = contrePropositionSchema.parse(req.body);
      return AjournementService.contreProposer(ajournementId, input, user);
    },
  );
};
