import { Prisma } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../../lib/prisma.js";
import {
  CreerAffectationCantineInput,
  TerminerAffectationCantineInput,
} from "./cantineAffectation.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class AffectationCantineError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AffectationCantineError";
  }
}

/**
 * Vérifie que l'utilisateur appartient à une école
 * @param user L'utilisateur dont on vérifie l'appartenance à une école
 * @throws AffectationCantineError si l'utilisateur n'appartient pas à une école
 */
function requireSchool(user: UserContext) {
  if (!user.schoolId) {
    throw new AffectationCantineError(
      "Vous devez appartenir à une école pour gérer les inscriptions à la cantine",
      403,
    );
  }
  return user.schoolId;
}

/**
 * Convertit une date au format AAAA-MM-JJ en objet Date en UTC
 * @param date La date au format AAAA-MM-JJ
 * @returns La date en UTC
 */
function dateUTC(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export class AffectationCantineService {
  /**
   * Liste les affectations à la cantine pour un élève donné
   * @param eleveId L'ID de l'élève pour lequel on souhaite lister les affectations à la cantine
   * @param user L'utilisateur effectuant la requête
   * @returns La liste des affectations à la cantine pour l'élève spécifié
   */
  static async listerPourEleve(eleveId: string, user: UserContext) {
    const schoolId = requireSchool(user); // Vérifie que l'utilisateur appartient à une école et récupère son ID

    const eleve = await prisma.eleve.findFirst({
      where: { id: eleveId, schoolId, deletedAt: null },
      select: { id: true },
    });

    if (!eleve) {
      throw new AffectationCantineError("Elève introuvable", 404);
    }

    return prisma.affectationCantine.findMany({
      where: { eleveId, schoolId },
      include: {
        offreCantine: true,
        createdBy: {
          select: { id: true, nom: true, prenom: true },
        },
      },
      orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Crée une nouvelle affectation à la cantine pour un élève donné
   * @param input Les informations nécessaires pour créer une affectation à la cantine
   * @param user L'utilisateur effectuant la requête
   * @returns L'affectation à la cantine créée
   */
  static async creer(input: CreerAffectationCantineInput, user: UserContext) {
    const schoolId = requireSchool(user); // Vérifie que l'utilisateur appartient à une école et récupère son ID

    const [eleve, offre] = await Promise.all([
      prisma.eleve.findFirst({
        where: { id: input.eleveId, schoolId, deletedAt: null },
        select: { id: true },
      }),
      prisma.offreCantine.findFirst({
        where: {
          id: input.offreCantineId,
          schoolId,
          actif: true,
        },
        select: {
          id: true,
          anneeScolaire: true,
        },
      }),
    ]);

    if (!eleve) {
      throw new AffectationCantineError("Elève introuvable", 404);
    }
    if (!offre) {
      throw new AffectationCantineError(
        "Forfait de cantine cantine introuvable",
        404,
      );
    }

    const dateDebut = dateUTC(input.dateDebut); // Convertit la date de début en objet Date UTC
    const dateFin = input.dateFin ? dateUTC(input.dateFin) : null; // Convertit la date de fin en objet Date UTC

    try {
      return await prisma.$transaction(
        async (tx) => {
          const affectationActive = await tx.affectationCantine.findFirst({
            where: {
              eleveId: eleve.id,
              schoolId,
              statut: "ACTIVE",
              offreCantine: {
                is: { anneeScolaire: offre.anneeScolaire },
              },
            },
            select: { id: true },
          });

          if (affectationActive) {
            throw new AffectationCantineError(
              "Cet élève possède déjà une inscription cantine active pour cette année scolaire",
              409,
            );
          }

          return tx.affectationCantine.create({
            data: {
              eleveId: eleve.id,
              offreCantineId: offre.id,
              schoolId,
              createdById: user.id,
              dateDebut,
              dateFin,
              regimeSpecial: input.regimeSpecial?.trim() || null,
            },
            include: {
              offreCantine: true,
              eleve: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  matricule: true,
                },
              },
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Assure que la transaction est isolée pour éviter les conflits de lecture/écriture
        },
      );
    } catch (error) {
      if (error instanceof AffectationCantineError) {
        throw error;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2034"
      ) {
        throw new AffectationCantineError(
          "Une inscription cantine vient d'être crééé pour cet élève. Recharger la liste",
          409,
        );
      }
      throw error;
    }
  }

  static async terminer(
    affectationCantineId: string,
    dateFinInput: string | undefined,
    user: UserContext,
  ) {
    const schoolId = requireSchool(user); // Récupère l'ID de l'école à partir du contexte utilisateur

    const affectation = await prisma.affectationCantine.findFirst({
      where: { id: affectationCantineId, schoolId, statut: "ACTIVE" },
    });

    if (!affectation) {
      throw new AffectationCantineError(
        "Inscription cantine active introuvable",
        404,
      );
    }

    const dateFin = dateFinInput
      ? dateUTC(dateFinInput)
      : dateUTC(new Date().toISOString().slice(0, 10)); // Utilise la date du jour si aucune date de fin n'est fournie

    if (dateFin < affectation.dateDebut) {
      throw new AffectationCantineError(
        "La date de fin ne peut pas précéder la date de début",
        400,
      );
    }

    return prisma.affectationCantine.update({
      where: { id: affectation.id },
      data: {
        statut: "TERMINEE",
        dateFin,
      },
      include: { offreCantine: true },
    });
  }
}
