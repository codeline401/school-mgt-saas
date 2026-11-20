import { Request, Response } from "express";
import { CantineError, CantineService } from "./cantine.service.js";
import { ZodError } from "zod";
import {
  creerOffreCantineSchema,
  modiferOffreCantineSchema,
  offreCantineParamsSchema,
  offreCantineQuerySchema,
} from "./cantine.schema.js";

/**
 * Get the user context from the Express request object
 * @param req The Express request object containing the user information
 * @returns The user context containing ID, role, and school ID (or null if not associated with a school)
 */
function contexteUtilisateur(req: Request) {
  if (!req.user) {
    throw new CantineError("Utilisateur non authentifié", 401);
  }

  return {
    id: req.user.id,
    role: req.user.role,
    schoolId: req.user.schoolId ?? null, // Return null if the user does not belong to a school
  };
}

/**
 * Respond to errors in the cantine module with appropriate HTTP status codes and messages
 * @param res The Express response object used to send the error response
 * @param error The error object to handle
 * @returns void
 */
function repondreErreur(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({ errors: error.issues });
  }
  if (error instanceof CantineError) {
    return res.status(error.status).json({ message: error.message });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return res
      .status(409)
      .json({ error: "Une offre porte déjà ce nom pour cette année scolaire" });
  }

  console.error("Erreur du module cantine :", error);
  return res
    .status(500)
    .json({ error: "Une erreur est survenue dans le module cantine" });
}

/**
 * Convert a query parameter to a string, ensuring it is not an array
 * @param value The query parameter value to convert
 * @returns The string representation of the query parameter
 * @throws CantineError if the value is an array
 */
function parametreString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    throw new CantineError("Identifant invalide.", 400);
  }

  return value ?? ""; // Return an empty string if the value is undefined
}

export const listerOffresCantine = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req); // Get the user context from the request
    const query = offreCantineQuerySchema.parse(req.query); // Validate and parse the query parameters
    const data = await CantineService.lister(query, user); // Fetch the cantine offers based on the query and user context

    return res.status(200).json(data); // Return the fetched cantine offers as JSON
  } catch (error) {
    repondreErreur(res, error); // Handle any errors that occur during the process
  }
};

export const creerOffreCantine = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req); // Get the user context from the request
    const input = creerOffreCantineSchema.parse(req.body); // Validate and parse the request body
    const data = await CantineService.creer(input, user); // Create the cantine offer using the input and user context

    return res.status(201).json(data); // Return the created cantine offer as JSON
  } catch (error) {
    repondreErreur(res, error); // Handle any errors that occur during the process
  }
};

export const modifierOffreCantine = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req); // Get the user context from the request
    const offreId = offreCantineParamsSchema.parse({
      offreId: parametreString(req.params.offreId),
    }).offreId;
    const input = modiferOffreCantineSchema.parse(req.body); // Get the input data from the request body
    const data = await CantineService.modifier(offreId, input, user); // Modify the cantine offer using the offer ID, input, and user context
    return res.status(200).json(data); // Return the modified cantine offer as JSON
  } catch (error) {
    repondreErreur(res, error); // Handle any errors that occur during the process
  }
};

export const desactiverOffreCantine = async (req: Request, res: Response) => {
  try {
    const user = contexteUtilisateur(req); // Get the user context from the request
    const offreId = offreCantineParamsSchema.parse({
      offreId: parametreString(req.params.offreId),
    }).offreId;
    await CantineService.desactiver(offreId, user); // Deactivate the cantine offer using the offer ID and user context
    return res.status(204).send(); // Return a 204 No Content response
  } catch (error) {
    repondreErreur(res, error); // Handle any errors that occur during the process
  }
};
