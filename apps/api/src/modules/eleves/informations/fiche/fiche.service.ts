import { prisma } from "../../../../lib/prisma.js";
import { CreateEleveInput, UpdateEleveInput } from "./fiche.schema.js";

interface UserContext {
  schoolId: string;
  role: string;
}

export class FicheEleveService {
  /**
   * Récupère la liste des élèves visibles pour l'utilisateur courant.
   * Utilisé par le front pour la recherche et la sélection avant affichage de la fiche.
   */
  static async getFicheElevesBySchool(user: UserContext) {
    const isSudoAdmin = user.role === "SUDO_ADMIN";

    const eleves = await prisma.eleve.findMany({
      where: isSudoAdmin
        ? { deletedAt: null }
        : {
            schoolId: user.schoolId,
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
    // NOTE: the generated Prisma types in this project do not reliably preserve
    // the relation payload for this specific query in TypeScript, so we force the
    // shape at the fetch boundary and normalize values before returning.
    const eleve = (await prisma.eleve.findUnique({
      where: { id: eleveId },
      include: {
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
          orderBy: [
            { anneeScolaire: "desc" },
            { mois: "desc" },
          ],
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
      },
    })) as any;

    if (!eleve) {
      throw new Error("Élève non trouvé");
    }

    // vérification multi-tenant : l'utilisateur doit appartenir à la même école que l'élève
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== eleve.schoolId) {
      throw new Error("Accès refusé : l'élève n'appartient pas à votre école");
    }

    // sécurité supplémentaire : les élèves supprimés restent masqués dans les listes,
    // mais la fiche détaillée est autorisée uniquement à l'école du demandeur.
    if (user.role !== "SUDO_ADMIN" && !user.schoolId) {
      throw new Error("Accès refusé : aucune école associée à votre compte");
    }

    // calcul de l'âge si date de naissance disponible
    const age = eleve.dateNaissance
      ? Math.floor(
          (Date.now() - new Date(eleve.dateNaissance).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25),
        )
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
    // vérification multi-tenant : l'utilisateur doit appartenir à la même école que l'élève
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== data.schoolId) {
      throw new Error(
        "Accès refusé : vous ne pouvez pas créer un élève pour cette école",
      );
    }

    // vérifier que la classe appartient à la bonne école si fournie
    if (data.classeId) {
      const classe = await prisma.classe.findUnique({
        where: { id: data.classeId },
        select: { schoolId: true },
      });

      if (!classe) {
        throw new Error("Classe non trouvée");
      }

      if (classe.schoolId !== data.schoolId) {
        throw new Error(
          "Accès refusé : la classe n'appartient pas à la même école que l'élève",
        );
      }
    }

    // vérifier que le parent appartient à la bonne école si fourni
    if (data.parentId) {
      const parent = await prisma.parent.findUnique({
        where: { id: data.parentId },
        select: { schoolId: true },
      });

      if (!parent) {
        throw new Error("Parent non trouvé");
      }
      if (parent.schoolId !== data.schoolId) {
        throw new Error(
          "Accès refusé : le parent n'appartient pas à la même école que l'élève",
        );
      }
    }

    // Récupère le prochain matricule pour cette école
    const lastEleve = await prisma.eleve.findFirst({
      where: { schoolId: user.schoolId },
      orderBy: { matricule: "desc" },
      select: { matricule: true },
    });

    const nextMatricule = (lastEleve?.matricule || 0) + 1; // Si aucun élève n'existe encore, on commence à 1

    // créer l'élève avec ses relations optionnelles (adresse, profession)
    return prisma.eleve.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        matricule: nextMatricule,
        schoolId: user.schoolId,
        genre: data.genre,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
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
  }

  /**
   * Met à jour la fiche d'un élève existant
   */
  static async updateFicheEleve(
    eleveId: string,
    data: UpdateEleveInput,
    user: UserContext,
  ) {
    // vérifier que l'élève existe et appartient à l'école de l'utilisateur
    const existingEleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      select: { schoolId: true },
    });

    if (!existingEleve) {
      throw new Error("Élève non trouvé");
    }

    if (
      user.role !== "SUDO_ADMIN" &&
      user.schoolId !== existingEleve.schoolId
    ) {
      throw new Error("Accès refusé : l'élève n'appartient pas à votre école");
    }

    // vérifier la classe si fournie
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

    // vérifier le parent si fourni
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

    // Mise à jour de l'élève
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
      select: { schoolId: true },
    });

    if (!existingEleve) {
      throw new Error("Élève non trouvé");
    }

    if (
      user.role !== "SUDO_ADMIN" &&
      user.schoolId !== existingEleve.schoolId
    ) {
      throw new Error("Accès refusé : l'élève n'appartient pas à votre école");
    }

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

    if (!existingEleve) {
      throw new Error("Élève non trouvé");
    }

    if (!existingEleve.deletedAt) {
      throw new Error(
        "Élève n'est pas ou n'a jamais été supprimé, la restauration n'est pas nécessaire",
      );
    }

    if (
      user.role !== "SUDO_ADMIN" &&
      user.schoolId !== existingEleve.schoolId
    ) {
      throw new Error("Accès refusé : l'élève n'appartient pas à votre école");
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
