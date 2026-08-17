import { prisma } from "../../../../lib/prisma.js";
import {
  CreateResponsableInput,
  UpdateResponsableInput,
} from "./responsable.schema.js";

interface UserContext {
  schoolId: string | null;
  role: string;
}

const assertUserSchoolAccess = (user: UserContext, schoolId: string) => {
  if (user.role === "SUDO_ADMIN") return; // SUDO_ADMIN has access to all schools
  if (!user.schoolId) {
    throw new Error(
      "Accès refusé : L'utilisateur n'est pas associé à une école.",
    );
  }
  if (schoolId && user.schoolId !== schoolId) {
    throw new Error(
      "Accès refusé : L'utilisateur n'a pas accès à cette école.",
    );
  }
};

const validateElevesForAffiliation = async (
  eleveIds: string[],
  schoolId: string,
  excludeResponsableId?: string,
) => {
  const uniqueIds = [...new Set(eleveIds)]; // Remove duplicates

  const eleves = await prisma.eleve.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null }, // Ensure we only fetch non-deleted students
    select: {
      id: true,
      nom: true,
      prenom: true,
      schoolId: true,
      isRelationContact: true, // correspond à "isResponsable"
      // 1. On utilise le bon nom de champ Prisma
      responsableId: true, // This will help us check if the student is already affiliated with a responsable
    },
  });

  if (eleves.length !== uniqueIds.length) {
    throw new Error(
      "Un ou plusieurs élèves sont introuvables ou ont été supprimés.",
    );
  }

  for (const eleve of eleves) {
    if (eleve.schoolId !== schoolId) {
      throw new Error(
        `Accès refusé: L'élève ${eleve.nom} ${eleve.prenom} n'appartient pas à l'école cible.`,
      );
    }

    // 2. On vérifie si l'élève a un responsableId différent de celui qu'on veut exclure
    const hasResponsable = Boolean(
      eleve.responsableId && eleve.responsableId !== excludeResponsableId,
    );

    if (eleve.isRelationContact && hasResponsable) {
      throw new Error(
        `L'élève ${eleve.nom} ${eleve.prenom} est déjà affilié à un responsable. Un élève ne peut avoir qu'un seul responsable.`,
      );
    }
  }

  return eleves;
};

export class ResponsableService {
  /**
   * Liste des responsables de l'école courante
   */
  static async getResponsablesBySchool(user: UserContext) {
    const isSudoAdmin = user.role === "SUDO_ADMIN";

    if (!isSudoAdmin && !user.schoolId) {
      return []; // If the user is not a SUDO_ADMIN and has no associated school, return an empty array
    }

    return prisma.parent.findMany({
      where: isSudoAdmin ? {} : { schoolId: user.schoolId! }, // If SUDO_ADMIN, fetch all; otherwise, filter by user's schoolId
      include: {
        affiliations: {
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                matricule: true,
              },
            },
          },
          orderBy: { createdAt: "desc" }, // Order affiliations by creation date, most recent first
        },
      },
    });
  }

  /**
   * Récupère un responsable par son Id, avec la liste de ses élèves affiliés
   */
  static async getResponsableById(responsableId: string, user: UserContext) {
    const responsable = await prisma.parent.findUnique({
      where: { id: responsableId },
      include: {
        affiliations: {
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                matricule: true,
              },
            },
          },
        },
      },
    });

    if (!responsable) {
      throw new Error("Responsable non trouvé");
    }

    assertUserSchoolAccess(user, responsable.schoolId); // Ensure the user has access to the school of the responsable

    return responsable;
  }

  /**
   * Créer un responsable (parent ou tuteur) et l'affilier à un ou plusieurs élèves existants
   */
  static async createResponsable(
    data: CreateResponsableInput,
    user: UserContext,
  ) {
    if (user.role !== "SUDO_ADMIN" && user.role !== "ADMIN") {
      throw new Error(
        "Accès refusé : Seuls les administrateurs peuvent créer un responsable.",
      );
    }

    if (!user.schoolId) {
      throw new Error(
        "Accès refusé : L'utilisateur n'est pas associé à une école.",
      );
    }

    const schoolId = user.schoolId;

    await validateElevesForAffiliation(data.eleveIds, schoolId); // Validate the students before creating the responsable

    return prisma.$transaction(async (tx) => {
      const responsable = await tx.parent.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          type: data.type,
          schoolId,
          email: data.email ?? undefined,
          telephone: data.telephone ?? undefined,
          adresse: data.adresse ?? undefined,
        },
      });

      await tx.responsableEleve.createMany({
        data: data.eleveIds.map((eleveId) => ({
          responsableId: responsable.id,
          eleveId,
        })),
      });

      // Le premier élève affilié devient le parent principal si non défini
      const firstEleve = await tx.eleve.findUnique({
        where: { id: data.eleveIds[0] },
        select: { parentId: true },
      });

      if (firstEleve && !firstEleve.parentId) {
        await tx.eleve.update({
          where: { id: data.eleveIds[0] },
          data: { parentId: responsable.id },
        });
      }

      return tx.parent.findUniqueOrThrow({
        where: { id: responsable.id },
        include: {
          affiliations: {
            include: {
              eleve: {
                select: { id: true, nom: true, prenom: true, matricule: true },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Met à jour les coordonnées d'un responsable
   */
  static async updateResponsable(
    responsableId: string,
    data: UpdateResponsableInput,
    user: UserContext,
  ) {
    const exisitingResponsable = await prisma.parent.findUnique({
      where: { id: responsableId },
      select: { schoolId: true },
    });

    if (!exisitingResponsable) {
      throw new Error("Responsable non trouvé");
    }

    assertUserSchoolAccess(user, exisitingResponsable.schoolId); // Ensure the user has access to the school of the responsable

    return prisma.parent.update({
      where: { id: responsableId },
      data: {
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.prenom !== undefined && { prenom: data.prenom }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.telephone !== undefined && { telephone: data.telephone }),
        ...(data.adresse !== undefined && { adresse: data.adresse }),
      },
    });
  }

  /**
   * Affilie des élèves supplémetaires à un responsable existant
   */
  static async affilierEleves(
    responsableId: string,
    eleveIds: string[],
    user: UserContext,
  ) {
    const resoponsable = await prisma.parent.findUnique({
      where: { id: responsableId },
      select: { schoolId: true },
    });

    if (!resoponsable) {
      throw new Error("Responsable non trouvé");
    }

    assertUserSchoolAccess(user, resoponsable.schoolId); // Ensure the user has access to the school of the responsable

    await validateElevesForAffiliation(
      eleveIds,
      resoponsable.schoolId,
      responsableId,
    ); // Validate the students before affiliating

    await prisma.responsableEleve.createMany({
      data: eleveIds.map((eleveId) => ({ responsableId, eleveId })),
      skipDuplicates: true, // Skip if the affiliation already exists
    });

    return this.getResponsableById(responsableId, user); // Return the updated responsable with affiliations
  }

  /**
   * Retire l'affiliation d'un élève pour un responsable donné
   */
  static async retirerAffiliation(
    responsableId: string,
    eleveId: string,
    user: UserContext,
  ) {
    const responsable = await prisma.parent.findUnique({
      where: { id: responsableId },
      select: { schoolId: true },
    });

    if (!responsable) {
      throw new Error("Responsable non trouvé");
    }

    assertUserSchoolAccess(user, responsable.schoolId); // Ensure the user has acces to the school

    await prisma.responsableEleve.deleteMany({
      where: { responsableId, eleveId },
    });

    // Détache aussi le parent principal si c'atait celui ci
    await prisma.eleve.updateMany({
      where: { id: eleveId, parentId: responsableId },
      data: { parentId: null },
    });
  }

  /**
   * Supprime un responsable (retire toutes ses affiliations)
   */
  static async deleteResponsable(responsableId: string, user: UserContext) {
    const existingResponsable = await prisma.parent.findUnique({
      where: { id: responsableId },
      select: { schoolId: true },
    });
    if (!existingResponsable) {
      throw new Error("Responsable non trouvé");
    }

    assertUserSchoolAccess(user, existingResponsable.schoolId); // Ensure the user has access to the school of the responsable

    await prisma.eleve.updateMany({
      where: { parentId: responsableId },
      data: { parentId: null },
    });

    return prisma.parent.delete({
      where: { id: responsableId },
    });
  }
}
