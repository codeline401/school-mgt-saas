import { Request, Response } from "express";
import { SuiviSanteError, SuiviSanteService } from "./sante.service.js";
import { ZodError } from "zod";
import {
  creerSuiviSanteSchema,
  eleveSanteParamsSchema,
  listerSuiviSanteQuerySchema,
  modifierSuiviSanteSchema,
  suiviSanteParamsSchema,
} from "./sante.schema.js";

function contexteUtilisateur(req: Request) {
  if (!req.user) {
    throw new SuiviSanteError("Utilisateur non authentifié", 401);
  }
  return {
    id: req.user.id,
    role: req.user.role,
    schoolId: req.user.schoolId ?? null,
  };
}

function repondreErreur(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.issues });
  }
  if (error instanceof SuiviSanteError) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error("Erreur du module Santé & Sécurité :", error);
  return res.status(500).json({
    error:
      "Erreur interne du serveur est survenue dans le module Santé & Sécurité",
  });
}

function parametreString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    // Si le paramètre est un tableau, il est invalide.
    throw new SuiviSanteError("Paramètre invalide.", 400);
  }
  return value ?? "";
}

export const listerSuiviSante = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req); // Récupère le contexte de l'utilisateur authentifié
    const eleveId = eleveSanteParamsSchema.parse({
      eleveId: parametreString(req.params.eleveId), // Récupère et valide le paramètre eleveId
    }).eleveId; // Récupère l'ID de l'élève validé par le schéma

    const query = listerSuiviSanteQuerySchema.parse(req.query); // Récupère et valide les paramètres de requête

    const result = await SuiviSanteService.lister(eleveId, query, user); // Appelle le service pour lister le suivi santé de l'élève
    return res.status(200).json(result); // Renvoie le résultat au client
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const creerSuiviSante = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req); // Récupère le contexte de l'utilisateur authentifié
    const input = creerSuiviSanteSchema.parse(req.body); // Récupère et valide le corps de la requête
    const result = await SuiviSanteService.creer(input, user); // Appelle le service pour créer le suivi santé
    return res.status(201).json(result); // Renvoie le résultat au client
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const modifierSuiviSante = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req); // Récupère le contexte de l'utilisateur authentifié
    const suiviId = suiviSanteParamsSchema.parse({
      suiviId: parametreString(req.params.suiviId), // Récupère et valide le paramètre suiviId
    }).suiviId; // Récupère l'ID du suivi santé validé par le schéma

    const input = modifierSuiviSanteSchema.parse(req.body); // Récupère et valide le corps de la requête

    const result = await SuiviSanteService.modifier(suiviId, input, user);
    return res.status(200).json(result); // Renvoie le résultat au client
  } catch (error) {
    return repondreErreur(res, error);
  }
};

export const archiverSuiviSante = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req); // Récupère le contexte de l'utilisateur authentifié
    const suiviId = suiviSanteParamsSchema.parse({
      suiviId: parametreString(req.params.suiviId), // Récupère et valide le paramètre suiviId
    }).suiviId; // Récupère l'ID du suivi santé validé par le schéma

    const result = await SuiviSanteService.archiver(suiviId, user); // Appelle le service pour archiver le suivi santé
    return res.status(200).json(result); // Renvoie le résultat au client
  } catch (error) {
    return repondreErreur(res, error);
  }
};
