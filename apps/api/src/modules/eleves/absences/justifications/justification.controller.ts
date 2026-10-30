import { Request, Response } from "express";
import { JUSTIFICATIFS_DIR } from "./justification.upload.js";
import fs from "node:fs"; // Module pour manipuler le système de fichiers
import path from "node:path"; // Module pour manipuler les chemins de fichiers
import { ZodError } from "zod";
import {
  JustificationError,
  JustificationService,
} from "./justification.service.js";
import {
  billetParamsSchema,
  creerBilletSchema,
  creerJustificationSchema,
  eleveParamsSchema,
  justificationParamsSchema,
  listeJustificationsQuerySchema,
} from "./justification.schema.js";
import { genererBilletPdf } from "./billet.pdf.js";

type UserContext = { id: string; role: string; schoolId: string | null };

/**
 * Supprime un fichier du système de fichiers si celui-ci existe.
 * Si aucun fichier n'est fourni, la fonction ne fait rien.
 * @param fichier - Le fichier à supprimer, de type Express.Multer.File.
 * @returns void - Ne retourne rien.
 */
function supprimerfichier(fichier?: Express.Multer.File): void {
  if (!fichier) return; // Si aucun fichier n'est fourni, on ne fait rien

  fs.rm(
    path.join(JUSTIFICATIFS_DIR, path.basename(fichier.path)),
    { force: true },
    () => {},
  );
}

/**
 * Gère les erreurs et renvoie une réponse HTTP appropriée.
 * @param error - L'erreur à traiter.
 * @param res - L'objet Response d'Express.
 * @param message - Le message à afficher en cas d'erreur.
 * @returns Response - La réponse HTTP correspondante.
 */
function repondreErreur(
  error: unknown,
  res: Response,
  message: string,
): Response {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.issues });
  }
  if (error instanceof JustificationError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(`${message}: `, error);
  return res.status(500).json({ error: "Erreur interne du serveur" });
}

/**
 * Récupère le contexte utilisateur à partir de la requête Express.
 * @param req - L'objet Request d'Express.
 * @returns UserContext | null - Le contexte utilisateur ou null si l'utilisateur n'est pas authentifié.
 */
function contexte(req: Request): UserContext | null {
  return req.user
    ? {
        id: req.user.id,
        role: req.user.role,
        schoolId: req.user.schoolId ?? null,
      }
    : null;
}

/**
 * Récupère les absences à justifier pour un élève donné.
 * @param req - L'objet Request d'Express.
 * @param res - L'objet Response d'Express.
 * @returns Response - La réponse HTTP correspondante.
 */
export const getAbsencesAJustifier = async (req: Request, res: Response) => {
  try {
    const user = contexte(req);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    const { eleveId } = eleveParamsSchema.parse(req.params); // Récupère l'ID de l'élève à partir des paramètres de la requête
    return res.json(
      await JustificationService.absencesAJustifier(eleveId, user),
    ); // Renvoie la liste des absences à justifier pour l'élève spécifié
  } catch (error) {
    return repondreErreur(
      error,
      res,
      "Erreur lors de la récupération des absences à justifier",
    );
  }
};

/**
 * Crée une nouvelle justification pour un élève.
 * @param req - L'objet Request d'Express.
 * @param res - L'objet Response d'Express.
 * @returns Response - La réponse HTTP correspondante.
 */
export const creerJustification = async (req: Request, res: Response) => {
  const fichier = req.file; // Récupère le fichier téléchargé, s'il existe
  try {
    const user = contexte(req); // Récupère le contexte utilisateur à partir de la requête
    if (!user) {
      supprimerfichier(fichier);
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    const input = creerJustificationSchema.parse(req.body);
    const justification = await JustificationService.creer(
      input,
      fichier,
      user,
    );
    return res.status(201).json(justification); // Renvoie la justification créée avec un statut 201
  } catch (error) {
    supprimerfichier(fichier); // Supprime le fichier téléchargé en cas d'erreur pour éviter les fichiers orphelins
    return repondreErreur(
      error,
      res,
      "Erreur lors de la création de la justification",
    );
  }
};

/**
 * Récupère la liste des justifications pour un élève.
 * @param req - L'objet Request d'Express.
 * @param res - L'objet Response d'Express.
 * @returns Response - La réponse HTTP correspondante.
 */
export const listerJustifications = async (req: Request, res: Response) => {
  try {
    const user = contexte(req); // Récupère le contexte utilisateur à partir de la requête
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    const { eleveId } = eleveParamsSchema.parse(req.params); // Récupère l'ID de l'élève à partir des paramètres de la requête
    const query = listeJustificationsQuerySchema.parse(req.query); // Récupère les paramètres de la requête pour la liste des justifications
    return res.json(await JustificationService.lister(eleveId, query, user));
  } catch (error) {
    return repondreErreur(
      error,
      res,
      "Erreur lors de la récupération de la liste des justifications",
    );
  }
};

/**
 * Récupère le fichier de justification pour une justification donnée.
 * @param req - L'objet Request d'Express.
 * @param res - L'objet Response d'Express.
 * @returns Response - La réponse HTTP correspondante.
 */
export const getFichierJustification = async (req: Request, res: Response) => {
  try {
    const user = contexte(req); // Récupère le contexte utilisateur à partir de la requête
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    const { justificationId } = justificationParamsSchema.parse(req.params); // Récupère l'ID de la justification à partir des paramètres de la requête
    const { chemin, mime } = await JustificationService.getFichier(
      justificationId,
      user,
    ); // Récupère le chemin et le type MIME du fichier de justification
    res.type(mime); // Définit le type MIME de la réponse
    return res.sendFile(chemin); // Envoie le fichier de justification en réponse
  } catch (error) {
    return repondreErreur(
      error,
      res,
      "Erreur lors de la récupération du fichier de justification",
    );
  }
};

/**
 * Récupère les propositions de créneau pour une justification donnée.
 * @param req - L'objet Request d'Express.
 * @param res - L'objet Response d'Express.
 * @returns Response - La réponse HTTP correspondante.
 */
export const getPropositionsCreneau = async (req: Request, res: Response) => {
  try {
    const user = contexte(req);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    const { justificationId } = justificationParamsSchema.parse(req.params);
    return res.json(
      await JustificationService.propositions(justificationId, user),
    );
  } catch (error) {
    return repondreErreur(
      error,
      res,
      "Erreur lors de la récupération des propositions de créneau",
    );
  }
};

/**
 * Crée un billet pour une justification donnée.
 * @param req - L'objet Request d'Express.
 * @param res - L'objet Response d'Express.
 * @returns Response - La réponse HTTP correspondante.
 */
export const creerBillet = async (req: Request, res: Response) => {
  try {
    const user = contexte(req);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    const { justificationId } = justificationParamsSchema.parse(req.params);
    const input = creerBilletSchema.parse(req.body);
    return res.json(
      await JustificationService.genererBillet(justificationId, input, user),
    );
  } catch (error) {
    return repondreErreur(error, res, "Erreur lors de la création du billet");
  }
};

/**
 * Récupère le PDF d'un billet pour une justification donnée.
 * @param req - L'objet Request d'Express.
 * @param res - L'objet Response d'Express.
 * @returns Response - La réponse HTTP correspondante.
 */
export const getBilletPdf = async (req: Request, res: Response) => {
  try {
    const user = contexte(req);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    const { billetId } = billetParamsSchema.parse(req.params);
    const pdf = await genererBilletPdf(billetId, user);
    res.setHeader("Content-Type", "application/pdf"); // Définit le type MIME de la réponse
    res.setHeader(
      "Content-Disposition",
      `inline; filename="billet_${billetId}.pdf"`,
    ); // Définit le nom du fichier en téléchargement
    return res.send(pdf); // Envoie le PDF en réponse
  } catch (error) {
    return repondreErreur(error, res, "Erreur lors de l'impression du billet");
  }
};
