import {
  Prisma,
  TypeAffectation,
} from "../../../../generated/prisma/client.js";
import { prisma } from "../../../../lib/prisma.js";
import {
  AssignClasseStructureInput,
  CreateAffectationInput,
  CreateNiveauInput,
  CreateOptionInput,
  CreateSectionInput,
  UpdateNiveauInput,
  UpdateOptionInput,
  UpdateSectionInput,
} from "./affectation.schema.js";

interface UserContext {
  schoolId: string;
  role: string;
}

const assertUserSchoolAccess = (user: UserContext, schoolId: string) => {
  if (user.role === "SUDO_ADMIN") return; // SUDO_ADMIN has access to all schools
  if (!user.schoolId) {
    throw new Error(
      "Accès refusé : l'utilisateur n'est pas associé à une école.",
    );
  }
  if (schoolId && user.schoolId !== schoolId) {
    throw new Error(
      "Accès refusé : l'utilisateur n'a pas accès à cette école.",
    );
  }
};

const assertIsAdmin = (user: UserContext) => {
  if (user.role !== "SUDO_ADMIN" && user.role !== "ADMIN") {
    throw new Error(
      "Accès refusé : Seuls les Administrateurs peuvent effectuer cette action.",
    );
  }
};

const requiredSchoolId = (user: UserContext): string => {
  if (!user.schoolId) {
    throw new Error(
      "Accès refusé : l'utilisateur n'est pas associé à une école.",
    );
  }
  return user.schoolId;
};

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

// -------------------------------------------
// NIVEAU
// ------------------------------------------
export class NiveauService {
  /**
   * Get all niveaux for a specific school based on the user's role and school association.
   * If the user is a SUDO_ADMIN, they can access all niveaux across schools.
   * If the user is not a SUDO_ADMIN, they can only access niveaux associated with their school.
   * If the user has no schoolId and is not a SUDO_ADMIN, an empty array is returned.
   * @param user
   * @returns
   */
  static async getNiveauBySchool(user: UserContext) {
    const isSudoAdmin = user.role === "SUDO_ADMIN";
    if (!isSudoAdmin && !user.schoolId) return []; // Return empty array if user is not SUDO_ADMIN and has no schoolId

    return prisma.niveau.findMany({
      where: isSudoAdmin ? {} : { schoolId: user.schoolId },
      include: { section: true },
      orderBy: { ordre: "asc" },
    });
  }

  /**
   * Get a specific niveau by its ID, ensuring that the user has access to the associated school.
   * If the user is a SUDO_ADMIN, they can access any niveau.
   * If the user is not a SUDO_ADMIN, they can only access niveaux associated with their school.
   * If the niveau does not exist or the user does not have access, an error is thrown.
   * @param niveauId
   * @param user
   * @returns
   */
  static async getNiveauById(niveauId: string, user: UserContext) {
    const niveau = await prisma.niveau.findUnique({
      where: { id: niveauId },
      include: {
        section: true,
        classes: { select: { id: true, nom: true } },
      },
    });

    if (!niveau) {
      throw new Error("Niveau non trouvé");
    }
    assertUserSchoolAccess(user, niveau.schoolId);
    return niveau;
  }

  /**
   * Create a new niveau for a specific school, ensuring that the user has admin privileges and is associated with the school.
   * If the user is a SUDO_ADMIN, they can create niveaux for any school.
   * If the user is not a SUDO_ADMIN, they can only create niveaux for their associated school.
   * If the user does not have admin privileges or is not associated with a school, an error is thrown.
   * @param data
   * @param user
   * @returns
   */
  static async createNiveau(data: CreateNiveauInput, user: UserContext) {
    assertIsAdmin(user); // Ensure the user is an admin before proceeding
    const schoolId = requiredSchoolId(user); // Ensure the user has a schoolId

    try {
      return await prisma.niveau.create({
        data: {
          nom: data.nom,
          ordre: data.ordre ?? 0,
          schoolId,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Un niveau avec ce nom existe déjà dans cette école.");
      }
      throw error; // Re-throw the error if it's not a unique constraint violation
    }
  }

  /**
   * Update an existing niveau by its ID, ensuring that the user has admin privileges and access to the associated school.
   * If the user is a SUDO_ADMIN, they can update any niveau.
   * If the user is not a SUDO_ADMIN, they can only update niveaux associated with their school.
   * If the niveau does not exist or the user does not have access, an error is thrown.
   * @param niveauId
   * @param data
   * @param user
   * @returns
   */
  static async updateNiveau(
    niveauId: string,
    data: UpdateNiveauInput,
    user: UserContext,
  ) {
    const existingNiveau = await prisma.niveau.findUnique({
      where: { id: niveauId },
      select: { schoolId: true },
    });
    if (!existingNiveau) {
      throw new Error("Niveau non trouvé");
    }
    assertUserSchoolAccess(user, existingNiveau.schoolId); // Ensure the user has access to the school associated with the niveau
    assertIsAdmin(user); // Ensure the user is an admin before proceeding

    try {
      return await prisma.niveau.update({
        where: { id: niveauId },
        data: {
          ...(data.nom !== undefined ? { nom: data.nom } : {}),
          ...(data.ordre !== undefined ? { ordre: data.ordre } : {}),
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Un niveau avec ce nom existe déjà dans cette école.");
      }
      throw error; // Re-throw the error if it's not a unique constraint violation
    }
  }

  /**
   * Delete an existing niveau by its ID, ensuring that the user has admin privileges and access to the associated school.
   * If the user is a SUDO_ADMIN, they can delete any niveau.
   * If the user is not a SUDO_ADMIN, they can only delete niveaux associated with their school.
   * If the niveau does not exist, is associated with classes, or the user does not have access, an error is thrown.
   * @param niveauId
   * @param user
   * @returns
   */
  static async deleteNiveau(niveauId: string, user: UserContext) {
    const existingNiveau = await prisma.niveau.findUnique({
      where: { id: niveauId },
      select: { schoolId: true, classes: { select: { id: true } } },
    });
    if (!existingNiveau) {
      throw new Error("Niveau non trouvé");
    }
    assertUserSchoolAccess(user, existingNiveau.schoolId); // Ensure the user has access to the school associated with the niveau
    assertIsAdmin(user); // Ensure the user is an admin before proceeding

    if (existingNiveau.classes.length > 0) {
      throw new Error(
        "Impossible de supprimer ce niveau car il est associé à des classes.",
      );
    }

    return prisma.niveau.delete({
      where: { id: niveauId },
    });
  }
}

//-------------------------------------------
// SECTION
//-------------------------------------------
export class SectionService {
  /**
   * Get all sections for a specific school based on the user's role and school association.
   * If the user is a SUDO_ADMIN, they can access all sections across schools.
   * If the user is not a SUDO_ADMIN, they can only access sections associated with their school.
   * If the user has no schoolId and is not a SUDO_ADMIN, an empty array is returned.
   * @param user
   * @returns
   */
  static async getSectionsBySchool(user: UserContext) {
    const isSudoAdmin = user.role === "SUDO_ADMIN";
    if (!isSudoAdmin && !user.schoolId) return []; // Return empty array if user is not SUDO_ADMIN and has no schoolId

    return prisma.section.findMany({
      where: isSudoAdmin ? {} : { schoolId: user.schoolId },
      orderBy: { nom: "asc" }, // Order sections by name in ascending order
    });
  }

  /**
   * Get a specific section by its ID, ensuring that the user has access to the associated school.
   * If the user is a SUDO_ADMIN, they can access any section.
   * If the user is not a SUDO_ADMIN, they can only access sections associated with their school.
   * If the section does not exist or the user does not have access, an error is thrown.
   * @param sectionId
   * @param user
   * @returns
   */
  static async getSectionById(sectionId: string, user: UserContext) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        niveau: true,
        classes: {
          select: { id: true, nom: true },
        },
      },
    });

    if (!section) {
      throw new Error("Section non trouvée");
    }
    assertUserSchoolAccess(user, section.schoolId);
    return section;
  }

  /**
   * Create a new section for a specific school, ensuring that the user has admin privileges and is associated with the school.
   * If the user is a SUDO_ADMIN, they can create sections for any school.
   * If the user is not a SUDO_ADMIN, they can only create sections for their associated school.
   * If the user does not have admin privileges or is not associated with a school, an error is thrown.
   * @param data
   * @param user
   * @returns
   */
  static async createSection(data: CreateSectionInput, user: UserContext) {
    assertIsAdmin(user); // Ensure the user is an admin before proceeding
    const schoolId = requiredSchoolId(user); // Ensure the user has a schoolId

    if (data.niveauId) {
      const niveau = await prisma.niveau.findUnique({
        where: { id: data.niveauId },
        select: { schoolId: true },
      });

      if (!niveau && niveau!.schoolId !== schoolId) {
        throw new Error(
          "Le niveau spécifié n'existe pas ou n'appartient pas à l'école de l'utilisateur.",
        );
      }
    }

    try {
      return await prisma.section.create({
        data: { nom: data.nom, niveauId: data.niveauId as string, schoolId },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error(
          "Une section avec ce nom existe déjà dans cette école.",
        );
      }
      throw error; // Re-throw the error if it's not a unique constraint violation
    }
  }

  /**
   * Update an existing section by its ID, ensuring that the user has admin privileges and access to the associated school.
   * If the user is a SUDO_ADMIN, they can update any section.
   * If the user is not a SUDO_ADMIN, they can only update sections associated with their school.
   * If the section does not exist or the user does not have access, an error is thrown.
   * @param sectionId
   * @param data
   * @param user
   * @returns
   */
  static async updateSection(
    sectionId: string,
    data: UpdateSectionInput,
    user: UserContext,
  ) {
    const existingSection = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { schoolId: true },
    });
    if (!existingSection) {
      throw new Error("Section non trouvée");
    }
    assertUserSchoolAccess(user, existingSection.schoolId); // Ensure the user has access to the school associated with the section
    assertIsAdmin(user); // Ensure the user is an admin before proceeding

    if (data.niveauId) {
      // Check if the niveauId is provided in the update data
      const niveau = await prisma.niveau.findUnique({
        where: { id: data.niveauId },
        select: { schoolId: true },
      });

      if (!niveau || niveau.schoolId !== existingSection.schoolId) {
        throw new Error(
          "Niveau invalide ou n'appartient pas à la même école que la section.",
        );
      }
    }

    try {
      return await prisma.section.update({
        where: { id: sectionId },
        data: {
          ...(data.nom !== undefined && { nom: data.nom }),
          ...(data.niveauId !== undefined && { niveauId: data.niveauId }),
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error(
          "Une section avec ce nom existe déjà dans cette école.",
        );
      }
      throw error; // Re-throw the error if it's not a unique constraint violation
    }
  }

  static async deleteSection(sectionId: string, user: UserContext) {
    const existingSection = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { schoolId: true, classes: { select: { id: true } } },
    });
    if (!existingSection) {
      throw new Error("Section non trouvée");
    }

    assertUserSchoolAccess(user, existingSection.schoolId); // Ensure the user has access to the school associated with the section
    assertIsAdmin(user); // Ensure the user is an admin before proceeding

    if (existingSection.classes.length > 0) {
      throw new Error(
        "Impossible de supprimer cette section car elle est associée à des classes.",
      );
    }

    return await prisma.section.delete({
      where: { id: sectionId },
    });
  }
}

// -------------------------------------------
// OPTIONS
// -------------------------------------------
export class OptionService {
  /**
   * Get all options for a specific school based on the user's role and school association.
   * If the user is a SUDO_ADMIN, they can access all options across schools.
   * If the user is not a SUDO_ADMIN, they can only access options associated with their school.
   * If the user has no schoolId and is not a SUDO_ADMIN, an empty array is returned.
   * @param user
   * @returns
   */
  static async getOptionsBySchool(user: UserContext) {
    const isSudoAdmin = user.role === "SUDO_ADMIN";
    if (!isSudoAdmin && !user.schoolId) return []; // Return empty array if user is not SUDO_ADMIN and has no schoolId

    return prisma.option.findMany({
      where: isSudoAdmin ? {} : { schoolId: user.schoolId },
      orderBy: { nom: "asc" }, // Order options by name in ascending order
    });
  }

  /**
   * Create a new option for a specific school, ensuring that the user has admin privileges and is associated with the school.
   * If the user is a SUDO_ADMIN, they can create options for any school.
   * If the user is not a SUDO_ADMIN, they can only create options for their associated school.
   * If the user does not have admin privileges or is not associated with a school, an error is thrown.
   * @param data
   * @param user
   * @returns
   */
  static async createOption(data: CreateOptionInput, user: UserContext) {
    assertIsAdmin(user); // Ensure the user is an admin before proceeding
    const schoolId = requiredSchoolId(user); // Ensure the user has a schoolId

    try {
      return await prisma.option.create({
        data: { nom: data.nom, schoolId },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Une option avec ce nom existe déjà dans cette école.");
      }
      throw error; // Re-throw the error if it's not a unique constraint violation
    }
  }

  /**
   * Update an existing option by its ID, ensuring that the user has admin privileges and access to the associated school.
   * If the user is a SUDO_ADMIN, they can update any option.
   * If the user is not a SUDO_ADMIN, they can only update options associated with their school.
   * If the option does not exist or the user does not have access, an error is thrown.
   * @param optionId
   * @param data
   * @param user
   * @returns
   */
  static async updateOption(
    optionId: string,
    data: UpdateOptionInput,
    user: UserContext,
  ) {
    const existingOption = await prisma.option.findUnique({
      where: { id: optionId },
      select: { schoolId: true },
    });
    if (!existingOption) {
      throw new Error("Option non trouvée");
    }
    assertUserSchoolAccess(user, existingOption.schoolId); // Ensure the user has access to the school associated with the option
    assertIsAdmin(user); // Ensure the user is an admin before proceeding

    try {
      return await prisma.option.update({
        where: { id: optionId },
        data: {
          ...(data.nom !== undefined && { nom: data.nom }),
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Une option avec ce nom existe déjà dans cette école.");
      }
      throw error; // Re-throw the error if it's not a unique constraint violation
    }
  }

  /**
   * Delete an existing option by its ID, ensuring that the user has admin privileges and access to the associated school.
   * If the user is a SUDO_ADMIN, they can delete any option.
   * If the user is not a SUDO_ADMIN, they can only delete options associated with their school.
   * If the option does not exist or the user does not have access, an error is thrown.
   * @param optionId
   * @param user
   * @returns
   */
  static async deleteOption(optionId: string, user: UserContext) {
    const existingOption = await prisma.option.findUnique({
      where: { id: optionId },
      select: { schoolId: true, classes: { select: { id: true } } },
    });
    if (!existingOption) {
      throw new Error("Option non trouvée");
    }
    assertUserSchoolAccess(user, existingOption.schoolId); // Ensure the user has access to the school associated with the option
    assertIsAdmin(user); // Ensure the user is an admin before proceeding

    return await prisma.option.delete({
      where: { id: optionId },
    });
  }
}

// -------------------------------------------
// STRUCTURE DE CLASSE (rattacher niveau / section / option à une classe)
// -------------------------------------------
export class ClasseStructureService {
  /**
   * Assign a class structure (niveau, section, and options) to a specific classe, ensuring that the user has admin privileges and access to the associated school.
   * If the user is a SUDO_ADMIN, they can assign class structures for any classe.
   * If the user is not a SUDO_ADMIN, they can only assign class structures for classes associated with their school.
   * If the classe does not exist or the user does not have access, an error is thrown.
   * @param classeId
   * @param data
   * @param user
   * @returns
   */
  static async assignClasseStructure(
    classeId: string,
    data: AssignClasseStructureInput,
    user: UserContext,
  ) {
    const existingClasse = await prisma.classe.findUnique({
      where: { id: classeId },
      select: { schoolId: true },
    });

    if (!existingClasse) {
      throw new Error("Classe non trouvée");
    }
    assertUserSchoolAccess(user, existingClasse.schoolId); // Ensure the user has access to the school associated with the classe
    assertIsAdmin(user); // Ensure the user is an admin before proceeding

    const niveau = await prisma.niveau.findUnique({
      where: { id: data.niveauId },
      select: { schoolId: true },
    });
    if (!niveau || niveau.schoolId !== existingClasse.schoolId) {
      throw new Error(
        "Niveau invalide ou n'appartient pas à la même école que la classe.",
      );
    }

    if (data.sectionId) {
      // Check if the sectionId is provided in the data
      const section = await prisma.section.findUnique({
        where: { id: data.sectionId ?? undefined },
        select: { schoolId: true, niveauId: true },
      });
      if (!section || section.schoolId !== existingClasse.schoolId) {
        // Check if the section exists and belongs to the same school as the classe
        throw new Error(
          "Section invalide ou n'appartient pas à la même école que la classe.",
        );
      }
      if (section.niveauId && section.niveauId !== data.niveauId) {
        // Check if the section belongs to the specified niveau
        throw new Error(
          "La section spécifiée n'appartient pas au niveau spécifié.",
        );
      }
    }

    if (data.optionId) {
      // Check if the optionId is provided in the data
      const option = await prisma.option.findUnique({
        where: { id: data.optionId },
        select: { id: true, schoolId: true },
      });

      if (!option) {
        throw new Error("L'option spécifiée n'existe pas.");
      }

      if (option.schoolId !== existingClasse.schoolId) {
        throw new Error(
          "L'option spécifiée n'appartient pas à la même école que la classe.",
        );
      }
    }

    return prisma.classe.update({
      where: { id: classeId },
      data: {
        niveauId: data.niveauId, // Set the niveauId for the classe
        sectionId: data.sectionId ?? null, // Set the sectionId for the classe, or null if not provided
        optionId: data.optionId ?? null, // Set the optionId for the classe, or null if not provided
      },
      include: { niveau: true, section: true, option: true }, // Include the related niveau, section, and option in the response
    });
  }
}

// -------------------------------------------
// AFFECTATION CLASSE(inscription / transfert / promotion / etc.)
// -------------------------------------------
export class AffectationClasseService {
  /**
   * Get all affectations for a specific eleve, ensuring that the user has access to the associated school.
   * If the user is a SUDO_ADMIN, they can access affectations for any eleve.
   * If the user is not a SUDO_ADMIN, they can only access affectations for eleves associated with their school.
   * If the eleve does not exist or the user does not have access, an error is thrown.
   * @param eleveId
   * @param user
   * @returns
   */
  static async getAffectationsByEleve(eleveId: string, user: UserContext) {
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      select: { schoolId: true },
    });

    if (!eleve) {
      throw new Error("Élève non trouvé");
    }

    assertUserSchoolAccess(user, eleve.schoolId); // Ensure the user has access to the school associated with the eleve

    return prisma.affectationClasse.findMany({
      where: { eleveId },
      include: {
        ancienneClasse: { select: { id: true, nom: true } },
        nouvelleClasse: { select: { id: true, nom: true } },
        effectuePar: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get all affectations for a specific classe, ensuring that the user has access to the associated school.
   * If the user is a SUDO_ADMIN, they can access affectations for any classe.
   * If the user is not a SUDO_ADMIN, they can only access affectations for classes associated with their school.
   * If the classe does not exist or the user does not have access, an error is thrown.
   * @param classeId
   * @param user
   * @returns
   */
  static async getAffectationByClasse(classeId: string, user: UserContext) {
    const classe = await prisma.classe.findUnique({
      where: { id: classeId },
      select: { schoolId: true },
    });
    if (!classe) {
      throw new Error("Classe non trouvée");
    }

    assertUserSchoolAccess(user, classe.schoolId); // Ensure the user has access to the school associated with the classe

    return prisma.affectationClasse.findMany({
      where: {
        OR: [{ ancienneClasseId: classeId }, { nouvelleClasseId: classeId }],
      },
      include: {
        eleve: {
          select: { id: true, nom: true, prenom: true, matricule: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async changeEleveClasse(
    data: CreateAffectationInput,
    effectueParId: string,
    user: UserContext,
  ) {
    if (user.role !== "SUDO_ADMIN" && user.role !== "ADMIN") {
      throw new Error(
        "Accès refusé : Seuls les Administrateurs peuvent effectuer cette action.",
      );
    }

    const eleve = await prisma.eleve.findUnique({
      where: { id: data.eleveId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        schoolId: true,
        classeId: true,
        deletedAt: true,
      },
    });

    if (!eleve || eleve.deletedAt) {
      throw new Error("Élève non trouvé ou supprimé");
    }

    assertUserSchoolAccess(user, eleve.schoolId); // Ensure the user has access to the school associated with the eleve

    if (data.nouvelleClasseId) {
      // Check if the new class exists and belongs to the same school as the student
      const nouvelleClasse = await prisma.classe.findUnique({
        where: { id: data.nouvelleClasseId },
        select: { schoolId: true },
      });

      if (!nouvelleClasse) {
        throw new Error("Nouvelle classe non trouvée");
      }
      if (nouvelleClasse.schoolId !== eleve.schoolId) {
        throw new Error(
          "La nouvelle classe n'appartient pas à la même école que l'élève.",
        );
      }
      if (data.nouvelleClasseId === eleve.classeId) {
        throw new Error(
          "La nouvelle classe est la même que la classe actuelle de l'élève.",
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      const affectation = await tx.affectationClasse.create({
        data: {
          eleveId: data.eleveId,
          ancienneClasseId: eleve.classeId ?? null,
          nouvelleClasseId: data.nouvelleClasseId ?? null,
          type: data.type,
          motif: data.motif ?? undefined,
          anneeScolaire: data.anneeScolaire,
          effectueParId,
          schoolId: eleve.schoolId,
        },
      });

      await tx.eleve.update({
        where: { id: data.eleveId },
        data: {
          classeId: data.nouvelleClasseId ?? null,
        },
      });

      // Pour une promotion / redoublement, on repercute aussi l'historique annuel
      if (
        data.type === TypeAffectation.PROMOTION ||
        data.type === TypeAffectation.REDOUBLEMENT
      ) {
        await tx.historiqueClasse.upsert({
          where: {
            eleveId_anneeScolaire: {
              eleveId: data.eleveId,
              anneeScolaire: data.anneeScolaire,
            },
          },
          create: {
            eleveId: data.eleveId,
            classeId: data.nouvelleClasseId ?? null,
            anneeScolaire: data.anneeScolaire,
            statutFinAnnee:
              data.type === TypeAffectation.PROMOTION ? "ADMIS" : "REDOUBLE",
          },
          update: {
            classeId: data.nouvelleClasseId ?? null,
            statutFinAnnee:
              data.type === TypeAffectation.PROMOTION ? "ADMIS" : "REDOUBLE",
          },
        });
      }

      return tx.affectationClasse.findUniqueOrThrow({
        where: { id: affectation.id },
        include: {
          ancienneClasse: { select: { id: true, nom: true } },
          nouvelleClasse: { select: { id: true, nom: true } },
        },
      });
    });
  }
}
