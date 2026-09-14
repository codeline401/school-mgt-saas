import { prisma } from "../../../../lib/prisma.js";
import { UpdateEmergencyContact } from "./emergencyContact.schema.js";

type AuthUser = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class EmergencyContactNotFoundError extends Error {
  status = 404; // Not Found

  constructor(message = "Elève introuvable") {
    super(message); // Call the parent class constructor with the message
    this.name = "EmergencyContactNotFoundError"; // Set the error name
  }
}

export class EmergencyContactForbiddenError extends Error {
  status = 403;

  constructor(message = "Accès refusé à cet élève") {
    super(message); // Call the parent class constructor with the message
    this.name = "EmergencyContactForbiddenError"; // Set the error name
  }
}

export class EmergencyContactService {
  /**
   * Récupère le contact d'un élève donné.
   * La logique de sécurité scolaire est centralisé ici
   */
  static async getByStudentId(eleveId: string, user: AuthUser) {
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId, deletedAt: null },
      select: {
        id: true,
        schoolId: true,
        isRelationContact: true,
        relationName: true,
        relationTelephone: true,
      },
    });

    if (!eleve) {
      throw new EmergencyContactNotFoundError();
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== eleve.schoolId) {
      throw new EmergencyContactForbiddenError();
    }

    return {
      eleveId: eleve.id,
      isRelationContact: eleve.isRelationContact ?? false,
      relationName: eleve.relationName ?? null,
      relationTelephone: eleve.relationTelephone ?? null,
    };
  }

  /**
   * Met à jour le contact d'urgence d'un élève existant
   * L'API ne créé pas de table séparée: elle modifie les champs existants de Eleve
   */
  static async updateByStudentId(
    eleveId: string,
    data: UpdateEmergencyContact,
    user: AuthUser,
  ) {
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId, deletedAt: null },
      select: {
        id: true,
        schoolId: true,
        isRelationContact: true,
        relationName: true,
        relationTelephone: true,
      },
    });

    if (!eleve) {
      throw new EmergencyContactNotFoundError();
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== eleve.schoolId) {
      throw new EmergencyContactForbiddenError();
    }

    const nextIsRelationContact =
      data.isRelationContact ?? eleve.isRelationContact ?? false; // Determine the next value for isRelationContact
    const nextName =
      data.relationName !== undefined
        ? data.relationName?.trim() || null
        : (eleve.relationName ?? null);
    const nextTelephone =
      data.relationTelephone !== undefined
        ? data.relationTelephone?.trim() || null
        : (eleve.relationTelephone ?? null);

    const updatedEleve = await prisma.eleve.update({
      where: { id: eleveId },
      data: {
        isRelationContact: nextIsRelationContact,
        relationName: nextIsRelationContact ? nextName : null, // Only set the relationName if isRelationContact is true
        relationTelephone: nextIsRelationContact ? nextTelephone : null, // Only set the relationTelephone if isRelationContact is true
      },
      select: {
        id: true,
        isRelationContact: true,
        relationName: true,
        relationTelephone: true,
      },
    });

    return {
      eleveId: updatedEleve.id,
      isRelationContact: updatedEleve.isRelationContact ?? false,
      relationName: updatedEleve.relationName ?? null,
      relationTelephone: updatedEleve.relationTelephone ?? null,
    };
  }
}
