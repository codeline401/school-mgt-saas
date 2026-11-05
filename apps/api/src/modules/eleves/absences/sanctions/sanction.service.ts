import { Prisma } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../../lib/prisma.js";
import {
  CreerSanctionInput,
  ListeSanctionQuery,
  ModifierSanctionInput,
} from "./sanction.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class SanctionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "SanctionError";
  }
}

/**
 * Obtient le scope de l'école pour un utilisateur donné.
 * @param user L'utilisateur pour lequel on souhaite obtenir le scope de l'école
 * @returns Un objet Prisma.SanctionEleveWhereInput correspondant au scope de l'école de l'utilisateur
 */
function scopeEcole(user: UserContext): Prisma.SanctionEleveWhereInput {
  if (user.role === "SUDO_ADMIN") return {};
  if (!user.schoolId)
    throw new SanctionError("Aucune école associé à l'utilisateur", 403);
  return { schoolId: user.schoolId };
}

/**
 * Vérifie que la date de sanction n'est pas postérieure à la date de fin
 * @param dateSanction La date de la sanction
 * @param dateFin La date de fin de la sanction (peut être null)
 * @throws SanctionError si la date de sanction est postérieure à la date de fin
 */
function verifierDate(dateSanction: Date, dateFin: Date | null) {
  if (dateFin && dateSanction > dateFin) {
    throw new SanctionError(
      "La date de sanction ne peut pas être postérieure à la date de fin",
      400,
    );
  }
}

/**
 * Recherche une sanction par son identifiant en tenant compte du scope de l'utilisateur
 * @param sanctionId L'identifiant de la sanction à rechercher
 * @param user L'utilisateur effectuant la requête
 * @returns La sanction trouvée correspondant à l'identifiant et au scope de l'utilisateur
 */
async function trouverSanction(sanctionId: string, user: UserContext) {
  const sanction = await prisma.sanctionEleve.findFirst({
    where: { id: sanctionId, ...scopeEcole(user) },
  });
  if (!sanction) throw new SanctionError("Sanction non trouvée", 404);
  return sanction;
}

export class SanctionService {
  /**
   * Liste les sanctions en fonction des critères de filtrage et de pagination fournis
   * @param query Les paramètres de filtrage et de pagination pour la liste des sanctions
   * @param user L'utilisateur effectuant la requête
   * @returns Un objet contenant les sanctions filtrées et la pagination correspondante
   */
  static async lister(query: ListeSanctionQuery, user: UserContext) {
    const where: Prisma.SanctionEleveWhereInput = {
      ...scopeEcole(user),
      ...(query.eleveId ? { eleveId: query.eleveId } : {}), // Filtre par élève si eleveId est présent dans la query
      ...(query.type ? { type: query.type } : {}), // Filtre par type si type est présent dans la query
      ...(query.statut ? { statut: query.statut } : {}), // Filtre par statut si statut est présent dans la query
      ...(query.classeId
        ? { eleve: { is: { classeId: query.classeId } } }
        : {}), // Filtre par classe si classeId est présent dans la query
      ...(query.from || query.to
        ? {
            dateSanction: {
              ...(query.from
                ? { gte: new Date(`${query.from}T00:00:00Z`) }
                : {}),
              ...(query.to ? { lte: new Date(`${query.to}T00:00:00Z`) } : {}),
            },
          }
        : {}), // Filtre par date si from ou to est présent dans la query
    };

    const [data, total] = await Promise.all([
      prisma.sanctionEleve.findMany({
        where,
        include: {
          eleve: {
            select: { id: true, nom: true, prenom: true, matricule: true },
          },
          createdBy: { select: { id: true, nom: true, prenom: true } },
        },
        orderBy: [{ dateSanction: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.sanctionEleve.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  /**
   * Crée une nouvelle sanction pour un élève donné en utilisant les informations fournies dans l'input
   * @param input Les données nécessaires pour créer une sanction
   * @param user L'utilisateur effectuant la requête
   * @returns La sanction créée avec les informations de l'élève associé
   */
  static async creer(input: CreerSanctionInput, user: UserContext) {
    const eleve = await prisma.eleve.findFirst({
      where: {
        id: input.eleveId,
        deletedAt: null,
        ...(user.role === "SUDO_ADMIN"
          ? {}
          : { schoolId: user.schoolId ?? "" }),
      },
      select: { id: true, schoolId: true },
    });

    if (!eleve) {
      throw new SanctionError("Élève non trouvé", 404);
    }

    // Prépa des objest Date
    const dateSanction = new Date(`${input.dateSanction}T00:00:00Z`);
    const dateFin = input.dateFin
      ? new Date(`${input.dateFin}T00:00:00Z`)
      : null;
    // vérifications des dates avant la création en base
    verifierDate(dateSanction, dateFin);

    return prisma.sanctionEleve.create({
      data: {
        schoolId: eleve.schoolId,
        eleveId: eleve.id,
        createdById: user.id,
        type: input.type,
        motif: input.motif,
        details: input.details ?? null,
        dateSanction,
        dateFin,
      },
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
    });
  }

  static async modifier(
    sanctionId: string,
    input: ModifierSanctionInput,
    user: UserContext,
  ) {
    const sanction = await trouverSanction(sanctionId, user); // Vérifie si la sanction existe et si l'utilisateur a le droit de la modifier
    if (sanction.statut !== "EN_COURS") {
      throw new SanctionError(
        "Impossible de modifier une sanction qui n'est pas en cours",
        400,
      );
    }

    // Calcul des valeurs effectives (fusion avec l'existant)
    const dateSanction = input.dateSanction
      ? new Date(`${input.dateSanction}T00:00:00Z`)
      : sanction.dateSanction;

    const dateFin =
      input.dateFin !== undefined
        ? input.dateFin
          ? new Date(`${input.dateFin}T00:00:00Z`)
          : null
        : sanction.dateFin;

    // vérification des date
    verifierDate(dateSanction, dateFin);

    try {
      return await prisma.sanctionEleve.update({
        where: { id: sanctionId, statut: "EN_COURS" },
        data: {
          ...input,
          ...(input.dateSanction
            ? { dateSanction: new Date(`${input.dateSanction}T00:00:00Z`) }
            : {}),
          ...(input.dateFin !== undefined // Vérifie si la date de fin est définie dans l'input
            ? {
                dateFin: input.dateFin // Si la date de fin est fournie, la convertir en objet Date, sinon mettre à null
                  ? new Date(`${input.dateFin}T00:00:00Z`)
                  : null, // Mettre à null si la date de fin n'est pas fournie
              }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new SanctionError(
          "Impossible de modifier une sanction qui n'est pas en cours",
          400,
        );
      }
      throw error;
    }
  }

  /**
   * Change le statut d'une sanction donnée.
   * @param sanctionId L'identifiant de la sanction à modifier
   * @param statut Le nouveau statut de la sanction ("EN_COURS3", "TERMINEE" ou "ANNULEE")
   * @param user L'utilisateur effectuant la modification
   * @returns La sanction mise à jour
   */
  static async changerStatut(
    sanctionId: string,
    statut: "EN_COURS" | "TERMINEE" | "ANNULEE",
    user: UserContext,
  ) {
    const sanction = await trouverSanction(sanctionId, user); // Vérifie si la sanction existe et si l'utilisateur a le droit de la modifier
    if (sanction.statut !== "EN_COURS") {
      throw new SanctionError("Cette sanction a déjà été clôturée", 409);
    }
    if (statut === "EN_COURS") {
      throw new SanctionError("Transition de statut invalide", 400);
    }

    try {
      return await prisma.sanctionEleve.update({
        where: { id: sanctionId, statut: "EN_COURS" },
        data: { statut },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new SanctionError("Cette sanction a déjà été clôturée", 409);
      }
      throw error;
    }
  }
}
