import { Response, Request } from "express";
import { ZodError } from "zod";
import { EmergencyContactService } from "./emergencyContact.service.js";
import {
  emergencyContactSchema,
  patchEmergencyContactSchema,
} from "./emergencyContact.schema.js";

export class EmergencyContactError extends Error {
  status = 500; // Default to Internal Server Error

  constructor(message: string, status = 500) {
    super(message); //
    this.status = status;
    this.name = "EmergencyContactError"; // Set the error name
  }
}

export class EmergencyContactValidationError extends EmergencyContactError {
  constructor(message: string) {
    super(message, 400); // Set status to 400 for validation errors
    this.name = "EmergencyContactValidationError"; // Set the error name
  }
}

const sendEmergencyContactError = (
  res: Response,
  error: unknown,
  fallback: string,
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Données invalides",
      details: error.issues,
    });
  }

  if (error instanceof EmergencyContactValidationError) {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (error instanceof Error && "status" in error) {
    const status = Number((error as any).status ?? 500);

    if (status === 400) {
      return res.status(400).json({ message: error.message });
    }

    if (status === 404) {
      return res.status(404).json({ message: error.message });
    }

    if (status === 403) {
      return res.status(403).json({ message: error.message });
    }
  }

  if (error instanceof Error) {
    console.error("Erreur contact d'urgence:", error);
    return res.status(500).json({ message: fallback });
  }

  return res.status(500).json({ message: fallback });
};

/**
 * GET /api/eleves/informations/contact-urgence/:eleveId
 * Récupère le contact d'urgence d'un élève
 */
export const getStudentEmergencyContact = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { eleveId } = req.params as { eleveId: string };

    const result = await EmergencyContactService.getByStudentId(eleveId, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId as string,
    });

    return res.status(200).json(result);
  } catch (error) {
    return sendEmergencyContactError(
      res,
      error,
      "Erreur interne du serveur lors de la récupération du contact d'urgence",
    );
  }
};

/**
 * PUT /api/eleves/informations/contact-urgence/:eleveId
 * Met à jour le contact d'urgence d'un élève
 */
export const updateStudentEmergencyContact = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const playload = emergencyContactSchema.parse(req.body); // Valide et parse les données du contact d'urgence

    const result = await EmergencyContactService.updateByStudentId(
      req.params.eleveId as string,
      playload,
      {
        id: req.user.id,
        role: req.user.role,
        schoolId: (req.user.schoolId as string) ?? null,
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    return sendEmergencyContactError(
      res,
      error,
      "Erreur interne du serveur lors de la mise à jour du contact d'urgence",
    );
  }
};

/**
 * PATCH /api/eleves/informations/contact-urgence/:eleveId
 * Fusionne les champs fournis avec le contact courant avant validation.
 */
export const patchStudentEmergencyContact = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const eleveId = req.params.eleveId as string;
    const patch = patchEmergencyContactSchema.parse(req.body);
    const current = await EmergencyContactService.getByStudentId(eleveId, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId,
    });

    const merged = emergencyContactSchema.parse({
      isRelationContact: patch.isRelationContact ?? current.isRelationContact,
      relationName:
        patch.relationName !== undefined
          ? patch.relationName
          : current.relationName,
      relationTelephone:
        patch.relationTelephone !== undefined
          ? patch.relationTelephone
          : current.relationTelephone,
    });

    const result = await EmergencyContactService.updateByStudentId(
      eleveId,
      merged,
      {
        id: req.user.id,
        role: req.user.role,
        schoolId: req.user.schoolId,
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    return sendEmergencyContactError(
      res,
      error,
      "Erreur interne du serveur lors de la mise à jour partielle du contact d'urgence",
    );
  }
};
