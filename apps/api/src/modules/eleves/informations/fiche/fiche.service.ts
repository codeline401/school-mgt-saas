import { Prisma } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../../lib/prisma.js";
import { CreateEleveInput, UpdateEleveInput } from "./fiche.schema.js";

interface UserContext {
  schoolId: string | null;
  role: string;
}

const assertUserSchoolAccess = (user: UserContext, schoolId: string | null) => {
  if (user.role === "SUDO_ADMIN") return;
  if (!user.schoolId) {
    throw new Error("Accès refusé : aucune école associée à votre compte");
  }
  if (schoolId && user.schoolId !== schoolId) {
    throw new Error("Accès refusé : l'élève n'appartient pas à votre école");
  }
};

const validateContactRelation = (data: {
  isRelationContact?: boolean | null;
  relationName?: string | null;
  relationTelephone?: string | null;
}) => {
  if (!data.isRelationContact) return true;
  return !!(data.relationName?.trim() && data.relationTelephone?.trim());
};

const ficheInclude = {
  school: {
    select: {
      id: true,
      nom: true,
      email: true,
      telephone: true,
      adresse: true,
      logoUrl: true,
    },
  },
  classe: {
    select: {
      id: true,
      nom: true,
      schoolId: true,
      professeurPrincipalId: true,
      professeurPrincipal: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    },
  },
  parent: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      adresse: true,
    },
  },
  responsable: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
    },
  },
  adresse: true,
  professionEleve: true,
  historiqueClasses: {
    include: {
      classe: {
        select: {
          id: true,
          nom: true,
        },
      },
    },
    orderBy: {
      anneeScolaire: "desc",
    },
  },
  admissions: {
    orderBy: {
      createdAt: "desc",
    },
  },
  ecolages: {
    orderBy: [{ anneeScolaire: "desc" as const }, { mois: "desc" as const }],
  },
  droitInscriptions: {
    orderBy: {
      anneeScolaire: "desc",
    },
  },
  notes: {
    include: {
      matiere: {
        select: {
          id: true,
          nom: true,
        },
      },
      periode: {
        select: {
          id: true,
          nom: true,
        },
      },
    },
  },
  presences: {
    orderBy: {
      updatedAt: "desc",
    },
  },
} satisfies Prisma.EleveInclude;

export class FicheEleveService {
  /**
   * Récupère la liste des élèves visibles pour l'utilisateur courant.
   * Utilisé par le front pour la recherche et la sélection avant affichage de la fiche.
   */
  static async getFicheElevesBySchool(user: UserContext) {
    const isSudoAdmin = user.role === "SUDO_ADMIN";

    if (!isSudoAdmin && !user.schoolId) {
      return [];
    }

    const eleves = await prisma.eleve.findMany({
      where: isSudoAdmin
        ? { deletedAt: null }
        : {
            schoolId: user.schoolId!,
            deletedAt: null,
          },
      select: {
        id: true,
        nom: true,
        prenom: true,
        matricule: true,
        statut: true,
        schoolId: true,
        deletedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return eleves.map((eleve) => ({
      ...eleve,
      fullName: `${eleve.prenom ?? ""} ${eleve.nom ?? ""}`.trim(),
    }));
  }

  /**
   * Récupère la fiche complète d'un élève par son ID
   * Inclut toutes les relations nécessaires pour l'affichage au front
   */
  static async getFicheEleveById(eleveId: string, user: UserContext) {
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId, deletedAt: null },
      include: ficheInclude,
    });

    if (!eleve) {
      throw new Error("Élève non trouvé");
    }

    assertUserSchoolAccess(user, eleve.schoolId);

    const age = eleve.dateNaissance
      ? (() => {
          const birth = new Date(eleve.dateNaissance);
          const now = new Date();
          let ageValue = now.getFullYear() - birth.getFullYear();
          const hadBirthdayThisYear =
            now.getMonth() > birth.getMonth() ||
            (now.getMonth() === birth.getMonth() &&
              now.getDate() >= birth.getDate());

          if (!hadBirthdayThisYear) ageValue -= 1;
          return ageValue;
        })()
      : null;

    return {
      ...eleve,
      age,
      historiqueClasses: eleve.historiqueClasses ?? [],
      droitInscriptions: eleve.droitInscriptions ?? [],
      ecolages: eleve.ecolages ?? [],
      notes: eleve.notes ?? [],
      presences: eleve.presences ?? [],
      fullName: `${eleve.prenom} ${eleve.nom}`.trim(),
    };
  }

  /**
   * Crée un nouvel élève avec toutes ses relations
   */
  static async createFicheEleve(data: CreateEleveInput, user: UserContext) {
    const targetSchoolId = data.schoolId ?? user.schoolId;

    if (!targetSchoolId) {
      throw new Error("L'utilisateur n'a pas d'école associée");
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== targetSchoolId) {
      throw new Error(
        "Accès refusé : vous ne pouvez pas créer un élève pour cette école",
      );
    }

    if (data.classeId) {
      const classe = await prisma.classe.findUnique({
        where: { id: data.classeId },
        select: { schoolId: true },
      });

      if (!classe) throw new Error("Classe non trouvée");
      if (classe.schoolId !== targetSchoolId) {
        throw new Error(
          "Accès refusé : la classe n'appartient pas à la même école que l'élève",
        );
      }
    }

    if (data.parentId) {
      const parent = await prisma.parent.findUnique({
        where: { id: data.parentId },
        select: { schoolId: true },
      });

      if (!parent) throw new Error("Parent non trouvé");
      if (parent.schoolId !== targetSchoolId) {
        throw new Error(
          "Accès refusé : le parent n'appartient pas à la même école que l'élève",
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      const lastEleve = await tx.eleve.findFirst({
        where: { schoolId: targetSchoolId },
        orderBy: { matricule: "desc" },
        select: { matricule: true },
      });

      const nextMatricule = (lastEleve?.matricule ?? 0) + 1;

      return tx.eleve.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          matricule: nextMatricule,
          schoolId: targetSchoolId,
          genre: data.genre,
          dateNaissance: data.dateNaissance
            ? new Date(data.dateNaissance)
            : null,
          lieuNaissance: data.lieuNaissance,
          telephone: data.telephone,
          photoUrl: data.photoUrl,
          situationFamiliale: data.situationFamiliale,
          situationFinAnnee: data.situationFinAnnee,
          nationalite: data.nationalite,
          dateInscription: data.dateInscription
            ? new Date(data.dateInscription)
            : null,
          ecoleOrigine: data.ecoleOrigine,
          responsableId: data.responsableId,
          classeId: data.classeId,
          parentId: data.parentId,
          statut: data.statut || "ACTIF",
          isRelationContact: data.isRelationContact || false,
          relationName: data.relationName,
          relationTelephone: data.relationTelephone,
          remarque: data.remarque,
          // relation nested create si fournie
          ...(data.adresse
            ? {
                adresse: {
                  create: {
                    fokontany: data.adresse.fokontany,
                    logement: data.adresse.logement,
                    ville: data.adresse.ville,
                    region: data.adresse.region,
                    pays: data.adresse.pays,
                  },
                },
              }
            : {}),
          ...(data.professionEleve
            ? {
                professionEleve: {
                  create: {
                    titre: data.professionEleve.titre,
                    lieu: data.professionEleve.lieu,
                    secteur: data.professionEleve.secteur,
                  },
                },
              }
            : {}),
        },
        include: {
          classe: true,
          parent: true,
          adresse: true,
          professionEleve: true,
        },
      });
    });
  }

  /**
   * Met à jour la fiche d'un élève existant
   */
  static async updateFicheEleve(
    eleveId: string,
    data: UpdateEleveInput,
    user: UserContext,
  ) {
    const existingEleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      include: {
        adresse: true,
        professionEleve: true,
      },
    });

    if (!existingEleve) throw new Error("Élève non trouvé");
    if (existingEleve.deletedAt)
      throw new Error("Élève supprimé : impossible de le modifier");

    assertUserSchoolAccess(user, existingEleve.schoolId);

    if (data.classeId) {
      const classe = await prisma.classe.findUnique({
        where: { id: data.classeId },
        select: { schoolId: true },
      });

      if (!classe || classe.schoolId !== existingEleve.schoolId) {
        throw new Error(
          "Accès refusé : la classe n'appartient pas à la même école que l'élève",
        );
      }
    }

    if (data.parentId) {
      const parent = await prisma.parent.findUnique({
        where: { id: data.parentId },
        select: { schoolId: true },
      });

      if (!parent || parent.schoolId !== existingEleve.schoolId) {
        throw new Error(
          "Accès refusé : le parent n'appartient pas à la même école que l'élève",
        );
      }
    }

    const mergedValues = {
      ...existingEleve,
      ...data,
      isRelationContact:
        data.isRelationContact ?? existingEleve.isRelationContact,
      relationName: data.relationName ?? existingEleve.relationName,
      relationTelephone:
        data.relationTelephone ?? existingEleve.relationTelephone,
    };

    if (!validateContactRelation(mergedValues)) {
      throw new Error(
        "Le nom et le téléphone du contact sont requis si 'isRelationContact' est activé",
      );
    }

    const adressePayload = data.adresse
      ? {
          upsert: {
            create: {
              fokontany: data.adresse.fokontany ?? null,
              logement: data.adresse.logement ?? null,
              ville: data.adresse.ville ?? null,
              region: data.adresse.region ?? null,
              pays: data.adresse.pays ?? null,
            },
            update: {
              fokontany: data.adresse.fokontany ?? null,
              logement: data.adresse.logement ?? null,
              ville: data.adresse.ville ?? null,
              region: data.adresse.region ?? null,
              pays: data.adresse.pays ?? null,
            },
          },
        }
      : undefined;

    const professionPayload = data.professionEleve
      ? {
          upsert: {
            create: {
              titre: data.professionEleve.titre ?? null,
              lieu: data.professionEleve.lieu ?? null,
              secteur: data.professionEleve.secteur ?? null,
            },
            update: {
              titre: data.professionEleve.titre ?? null,
              lieu: data.professionEleve.lieu ?? null,
              secteur: data.professionEleve.secteur ?? null,
            },
          },
        }
      : undefined;

    return prisma.eleve.update({
      where: { id: eleveId },
      data: {
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.prenom !== undefined && { prenom: data.prenom }),
        ...(data.genre !== undefined && { genre: data.genre }),
        ...(data.dateNaissance !== undefined && {
          dateNaissance: data.dateNaissance
            ? new Date(data.dateNaissance)
            : null,
        }),
        ...(data.dateInscription !== undefined && {
          dateInscription: data.dateInscription
            ? new Date(data.dateInscription)
            : null,
        }),
        ...(data.lieuNaissance !== undefined && {
          lieuNaissance: data.lieuNaissance,
        }),
        ...(data.telephone !== undefined && { telephone: data.telephone }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        ...(data.situationFamiliale !== undefined && {
          situationFamiliale: data.situationFamiliale,
        }),
        ...(data.situationFinAnnee !== undefined && {
          situationFinAnnee: data.situationFinAnnee,
        }),
        ...(data.nationalite !== undefined && {
          nationalite: data.nationalite,
        }),
        ...(data.ecoleOrigine !== undefined && {
          ecoleOrigine: data.ecoleOrigine,
        }),
        ...(data.responsableId !== undefined && {
          responsableId: data.responsableId,
        }),
        ...(data.classeId !== undefined && { classeId: data.classeId }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.statut !== undefined && { statut: data.statut }),
        ...(data.isRelationContact !== undefined && {
          isRelationContact: data.isRelationContact,
        }),
        ...(data.relationName !== undefined && {
          relationName: data.relationName,
        }),
        ...(data.relationTelephone !== undefined && {
          relationTelephone: data.relationTelephone,
        }),
        ...(data.remarque !== undefined && { remarque: data.remarque }),
        ...(adressePayload ? { adresse: adressePayload } : {}),
        ...(professionPayload ? { professionEleve: professionPayload } : {}),
      },
      include: {
        classe: true,
        parent: true,
        adresse: true,
        professionEleve: true,
        responsable: true,
      },
    });
  }

  /**
   * Suppression logique d'un élève (soft delete)
   */
  static async softDeleteFicheEleve(
    eleveId: string,
    user: UserContext,
    deletedById: string,
  ) {
    const existingEleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      select: { schoolId: true, deletedAt: true },
    });

    if (!existingEleve) throw new Error("Élève non trouvé");

    assertUserSchoolAccess(user, existingEleve.schoolId);
    if (existingEleve.deletedAt) return existingEleve;

    return prisma.eleve.update({
      where: { id: eleveId },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    });
  }

  /**
   * restore un élève supprimé (soft delete)
   */
  static async restoreFicheEleve(eleveId: string, user: UserContext) {
    const existingEleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      select: { schoolId: true, deletedAt: true },
    });

    if (!existingEleve) throw new Error("Élève non trouvé");

    if (
      user.role !== "SUDO_ADMIN" &&
      user.schoolId !== existingEleve.schoolId
    ) {
      throw new Error("Accès refusé : l'élève n'appartient pas à votre école");
    }

    if (!existingEleve.deletedAt) {
      throw new Error(
        "Élève n'est pas ou n'a jamais été supprimé, la restauration n'est pas nécessaire",
      );
    }

    return prisma.eleve.update({
      where: { id: eleveId },
      data: {
        deletedAt: null,
        deletedById: null,
      },
    });
  }
}
