import { prisma } from "../../../../lib/prisma.js";
import type { HistoriqueEleveResponse } from "./historique.schema.js";

type UserContext = {
  role: string;
  schoolId: string | null;
};

export class HistoriqueEleveNotFoundError extends Error {
  status = 404;

  constructor(message = "Élève introuvable") {
    super(message);
    this.name = "HistoriqueEleveNotFoundError";
  }
}

export class HistoriqueEleveForbiddenError extends Error {
  status = 403;

  constructor(message = "Accès refusé à cet élève") {
    super(message);
    this.name = "HistoriqueEleveForbiddenError";
  }
}

export class HistoriqueEleveService {
  /**
   * Récupère tout l'historique disponible d'un élève.
   *
   * Toutes les relations sont chargées dans une seule requête Prisma.
   */
  static async getByStudentId(
    studentId: string,
    user: UserContext,
  ): Promise<HistoriqueEleveResponse> {
    const student = await prisma.eleve.findUnique({
      where: {
        id: studentId,
        deletedAt: null,
      },
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        statut: true,
        situationFinAnnee: true,
        createdAt: true,
        updatedAt: true,
        schoolId: true,

        historiqueClasses: {
          orderBy: {
            anneeScolaire: "desc",
          },
          select: {
            id: true,
            anneeScolaire: true,
            statutFinAnnee: true,
            createdAt: true,
            classe: {
              select: {
                id: true,
                nom: true,
                niveau: {
                  select: {
                    nom: true,
                  },
                },
                section: {
                  select: {
                    nom: true,
                  },
                },
                option: {
                  select: {
                    nom: true,
                  },
                },
              },
            },
          },
        },

        affectationClasses: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            anneeScolaire: true,
            type: true,
            motif: true,
            createdAt: true,
            ancienneClasse: {
              select: {
                id: true,
                nom: true,
              },
            },
            nouvelleClasse: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },

        admissions: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            statut: true,
            classeVisee: true,
            notesAdmin: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        droitInscriptions: {
          orderBy: {
            anneeScolaire: "desc",
          },
          select: {
            id: true,
            anneeScolaire: true,
            createdAt: true,
            classe: {
              select: {
                id: true,
                nom: true,
                niveau: {
                  select: {
                    nom: true,
                  },
                },
                section: {
                  select: {
                    nom: true,
                  },
                },
                option: {
                  select: {
                    nom: true,
                  },
                },
              },
            },
          },
        },

        ecolages: {
          orderBy: [
            {
              anneeScolaire: "desc",
            },
            {
              mois: "desc",
            },
          ],
          select: {
            id: true,
            anneeScolaire: true,
            mois: true,
            montant: true,
            createdAt: true,
            updatedAt: true,
            classe: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new HistoriqueEleveNotFoundError();
    }

    if (
      user.role !== "SUDO_ADMIN" &&
      (!user.schoolId || user.schoolId !== student.schoolId)
    ) {
      throw new HistoriqueEleveForbiddenError();
    }

    const academicHistory = [
      ...student.droitInscriptions.map((inscription) => ({
        id: inscription.id,
        anneeScolaire: inscription.anneeScolaire,
        classe: inscription.classe
          ? {
              id: inscription.classe.id,
              nom: inscription.classe.nom,
              niveau: inscription.classe.niveau?.nom ?? null,
              section: inscription.classe.section?.nom ?? null,
              option: inscription.classe.option?.nom ?? null,
            }
          : null,
        statut: null,
        dateInscription: inscription.createdAt.toISOString(),
        source: "INSCRIPTION" as const,
      })),

      ...student.historiqueClasses.map((historique) => ({
        id: historique.id,
        anneeScolaire: historique.anneeScolaire,
        classe: historique.classe
          ? {
              id: historique.classe.id,
              nom: historique.classe.nom,
              niveau: historique.classe.niveau?.nom ?? null,
              section: historique.classe.section?.nom ?? null,
              option: historique.classe.option?.nom ?? null,
            }
          : null,
        statut: historique.statutFinAnnee,
        dateInscription: historique.createdAt.toISOString(),
        source: "HISTORIQUE_CLASSE" as const,
      })),
    ].sort((first, second) =>
      second.dateInscription.localeCompare(first.dateInscription),
    );

    const administrativeEvents = student.admissions
      .map((admission) => ({
        id: admission.id,
        type: "ADMISSION" as const,
        status: admission.statut,
        description: admission.notesAdmin ?? "Dossier d'admission de l'élève",
        date: admission.createdAt.toISOString(),
      }))
      .sort((first, second) => second.date.localeCompare(first.date));

    return {
      eleve: {
        id: student.id,
        matricule: student.matricule,
        nom: student.nom,
        prenom: student.prenom,
        statut: student.statut,
        situationFinAnnee: student.situationFinAnnee,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
      },

      academicHistory,

      classChanges: student.affectationClasses.map((affectation) => ({
        id: affectation.id,
        anneeScolaire: affectation.anneeScolaire,
        type: affectation.type,
        motif: affectation.motif,
        ancienneClasse: affectation.ancienneClasse,
        nouvelleClasse: affectation.nouvelleClasse,
        changedAt: affectation.createdAt.toISOString(),
      })),

      administrativeEvents,

      paymentHistory: student.ecolages.map((ecolage) => ({
        id: ecolage.id,
        anneeScolaire: ecolage.anneeScolaire,
        mois: ecolage.mois,
        montant: ecolage.montant.toString(),
        classe: ecolage.classe,
        createdAt: ecolage.createdAt.toISOString(),
        updatedAt: ecolage.updatedAt.toISOString(),
      })),

      keyDates: {
        firstCreatedAt: student.createdAt.toISOString(),
        lastUpdatedAt: student.updatedAt.toISOString(),
      },
    };
  }
}
