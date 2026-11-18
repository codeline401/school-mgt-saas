import { Prisma } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../../lib/prisma.js";
import {
  CreerSuiviSanteInput,
  ListeSuiviSanteQuery,
  ModifierSuiviSanteinput,
} from "./sante.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class SuiviSanteError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "SuiviSanteError";
  }
}

function requireSchoolId(user: UserContext): string {
  if (!user.schoolId) {
    throw new SuiviSanteError(
      "Vous devez être rattaché à une école pour accéder à cette ressource.",
      403,
    );
  }
  return user.schoolId;
}

function dateUTC(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`); // Convertit une date au format AAAA-MM-JJ en objet Date UTC
}

/**
 * Recherche un suivi de santé spécifique pour un élève dans une école donnée.
 * @param suiviId L'identifiant du suivi de santé à rechercher.
 * @param schoolId L'identifiant de l'école à laquelle le suivi de santé est rattaché.
 * @returns Le suivi de santé correspondant aux critères de recherche.
 */
async function trouverSuiviSante(suiviId: string, schoolId: string) {
  const suivi = await prisma.suiviSante.findFirst({
    where: {
      id: suiviId,
      schoolId: schoolId,
      archiveeAt: null,
    },
  });
  if (!suivi) {
    throw new SuiviSanteError("Suivi de santé introuvable.", 404);
  }
  return suivi;
}

export class SuiviSanteService {
  /**
   * Liste les suivis de santé d'un élève en fonction des critères de filtrage et de pagination.
   * @param eleveId L'identifiant de l'élève pour lequel lister les suivis de santé.
   * @param query Les critères de filtrage et de pagination pour la liste des suivis de santé.
   * @param user Le contexte utilisateur contenant l'identifiant, le rôle et l'identifiant de l'école.
   * @returns Un objet contenant les données des suivis de santé et les informations de pagination.
   */
  static async lister(
    eleveId: string,
    query: ListeSuiviSanteQuery,
    user: UserContext,
  ) {
    const schoolId = requireSchoolId(user); // Vérifie que l'utilisateur est rattaché à une école et récupère son identifiant.

    const eleve = await prisma.eleve.findFirst({
      where: { id: eleveId, schoolId, deletedAt: null },
      select: { id: true },
    });

    if (!eleve) {
      throw new SuiviSanteError("Élève introuvable.", 404);
    }

    const where: Prisma.SuiviSanteWhereInput = {
      schoolId,
      eleveId,
      archiveeAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.from || query.to
        ? {
            dateEvenement: {
              ...(query.from ? { gte: dateUTC(query.from) } : {}),
              ...(query.to ? { lte: dateUTC(query.to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.suiviSante.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, nom: true, prenom: true },
          },
        },
        orderBy: [{ dateEvenement: "desc" }, { createdAt: "desc" }],
      }),
      prisma.suiviSante.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)), // Calcul du nombre total de pages en fonction du total et de la limite
      },
    };
  }

  /**
   * Crée un nouveau suivi de santé pour un élève donné et notifie les parents si nécessaire.
   * @param input Les données nécessaires pour créer un suivi de santé.
   * @param user Le contexte de l'utilisateur effectuant l'action.
   * @returns Le suivi de santé créé avec les informations sur la notification des parents.
   */
  static async creer(input: CreerSuiviSanteInput, user: UserContext) {
    const schoolId = requireSchoolId(user); // Vérifie que l'utilisateur est rattaché à une école et récupère son identifiant.

    const eleve = await prisma.eleve.findFirst({
      where: { id: input.eleveId, schoolId, deletedAt: null },
      select: {
        id: true,
        nom: true,
        prenom: true,
        parentId: true,
        responsableId: true,
        parent: { select: { id: true } },
        responsable: { select: { id: true } },
        responsableEleves: {
          select: { responsableId: true },
        },
      },
    });

    if (!eleve) {
      throw new SuiviSanteError("Élève introuvable.", 404);
    }

    const notifierParents =
      input.type === "MALADIE" ||
      (input.type === "ACCIDENT" && input.notifierParents === true); // Détermine si les parents doivent être notifiés en fonction du type d'événement et de l'option notifierParents.

    const idsParents = [
      eleve.parentId,
      eleve.responsableId,
      ...eleve.responsableEleves.map(
        (affiliation) => affiliation.responsableId,
      ),
    ].filter((id): id is string => id !== null); // Filtre les identifiants non nuls pour ne conserver que les parents valides.

    const dateEvenement = dateUTC(input.dateEvenement); // Convertit la date de l'événement en UTC.
    const dateFin = input.dateFin ? dateUTC(input.dateFin) : null; // Convertit la date de fin en UTC si elle est fournie.

    return prisma.$transaction(async (tx) => {
      const suivi = await tx.suiviSante.create({
        data: {
          schoolId,
          eleveId: eleve.id,
          createdById: user.id,
          type: input.type,
          titre: input.titre,
          description: input.description ?? null,
          gravite: input.gravite ?? null,
          dateEvenement,
          dateFin,
        },
      });

      let parentNotifieAt: Date | null = null;
      let nbParentsNotifies = 0;

      if (notifierParents && idsParents.length > 0) {
        const parents = await tx.parent.findMany({
          where: {
            id: { in: [...new Set(idsParents)] },
            schoolId,
            userId: { not: null },
          },
          select: { userId: true },
        });

        const userIds = [
          ...new Set(
            parents
              .map((parent) => parent.userId) // Récupère les identifiants des utilisateurs des parents.
              .filter((userId): userId is string => userId !== null), // Filtre les identifiants non nuls pour ne conserver que les utilisateurs valides.
          ),
        ];

        if (userIds.length > 0) {
          const message =
            input.type === "MALADIE"
              ? `L'établissement vous informe que votre enfant ${eleve.prenom} ${eleve.nom} ne se sent pas bien. veuillez contacter l'école`
              : `L'établissement vous informe qu'un incident nécessite votre attention concernant ${eleve.prenom} ${eleve.nom}. Veuillez contacter l'école`;

          await tx.notification.createMany({
            data: userIds.map((userId) => ({
              userId,
              schoolId,
              message,
              lien: "/eleves/vie-scolaire/sante",
            })),
          });

          parentNotifieAt = new Date();
          nbParentsNotifies = userIds.length;

          await tx.suiviSante.update({
            where: { id: suivi.id },
            data: { parentNotifieAt },
          });
        }
      }
      return { ...suivi, parentNotifieAt, nbParentsNotifies };
    });
  }

  /**
   * Modifie un suivi de santé existant pour un élève dans l'école spécifiée.
   * @param suiviId L'identifiant du suivi de santé à modifier.
   * @param input Les nouvelles données pour le suivi de santé.
   * @param user Le contexte utilisateur effectuant la modification.
   * @returns Le suivi de santé mis à jour.
   */
  static async modifier(
    suiviId: string,
    input: ModifierSuiviSanteinput,
    user: UserContext,
  ) {
    const schoolId = requireSchoolId(user); // Récupère l'identifiant de l'école à partir du contexte utilisateur.
    const suivi = await trouverSuiviSante(suiviId, schoolId); // Récupère le suivi de santé existant pour l'élève dans l'école spécifiée.

    const dateEvenement = input.dateEvenement
      ? dateUTC(input.dateEvenement)
      : suivi.dateEvenement; // Détermine la date de l'événement à partir de l'entrée ou utilise la date existante.

    const dateFin =
      input.dateFin !== undefined
        ? input.dateFin
          ? dateUTC(input.dateFin)
          : null
        : suivi.dateFin; // Détermine la date de fin à partir de l'entrée ou utilise la date existante.

    if (dateFin && dateEvenement > dateFin) {
      throw new SuiviSanteError(
        "La date de fin doit être postérieure à la date de l'événement.",
        400,
      );
    }

    return prisma.suiviSante.update({
      where: { id: suiviId },
      data: {
        ...(input.titre !== undefined ? { titre: input.titre } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.gravite !== undefined ? { gravite: input.gravite } : {}),
        ...(input.dateEvenement
          ? { dateEvenement: dateUTC(input.dateEvenement) }
          : {}),
        ...(input.dateFin !== undefined ? { dateFin } : {}),
      },
    });
  }

  /**
   * Archive un suivi de santé existant pour un élève dans l'école spécifiée.
   * @param suiviId L'identifiant du suivi de santé à archiver.
   * @param user Le contexte utilisateur effectuant l'archivage.
   * @returns Le suivi de santé archivé avec son identifiant et la date d'archivage.
   */
  static async archiver(suiviId: string, user: UserContext) {
    const schoolId = requireSchoolId(user); // Récupère l'identifiant de l'école à partir du contexte utilisateur.
    await trouverSuiviSante(suiviId, schoolId); // Vérifie que le suivi de santé existe pour l'école spécifiée.

    return prisma.suiviSante.update({
      where: { id: suiviId },
      data: { archiveeAt: new Date() },
      select: { id: true, archiveeAt: true },
    });
  }
}
