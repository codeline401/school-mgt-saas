import path from "path";
import { prisma } from "../../../../lib/prisma.js";
import {
  CreerBilletInput,
  CreerJustificationInput,
  ListeJustificationsQuery,
} from "./justification.schema.js";
import { JUSTIFICATIFS_DIR } from "./justification.upload.js";
import {
  calculerPropositions,
  formatDateLocale,
  jourDeLaDate,
} from "./creneau.util.js";
import { th } from "zod/locales";
import { Prisma } from "../../../../generated/prisma/client.js";

type UserContext = { id: string; role: string; schoolId: string | null };

export class JustificationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "JustificationError";
  }
}

/**
 * Vérifie si l'utilisateur a accès à l'école spécifiée. Lance une erreur si l'accès est refusé.
 * @param user L'utilisateur courant
 * @param schoolId L'ID de l'école à vérifier l'accès pour l'utilisateur
 */
function verifierEcole(user: UserContext, schoolId: string): void {
  if (user.role !== "SUDO_ADMIN" && user.schoolId !== schoolId) {
    throw new JustificationError("Accès refusé à cette école", 403);
  }
}

/**
 * Récupère un élève par son ID en vérifiant que l'utilisateur a accès à son école.
 * @param eleveId L'ID de l'élève à récupérer
 * @param user L'utilisateur courant
 * @returns L'élève correspondant à l'ID fourni, si l'utilisateur a accès à son école
 */
async function getEleve(eleveId: string, user: UserContext) {
  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId, deletedAt: null },
    select: { id: true, schoolId: true, classeId: true },
  });
  if (!eleve) {
    throw new JustificationError("Élève introuvable", 404);
  }
  verifierEcole(user, eleve.schoolId);
  return eleve;
}

/**
 * Récupère une justification par son ID en vérifiant que l'utilisateur a accès à son école.
 * @param id L'ID de la justification à récupérer
 * @param user L'utilisateur courant
 * @returns La justification correspondant à l'ID fourni, si l'utilisateur a accès à son école
 */
async function getJustification(id: string, user: UserContext) {
  const justification = await prisma.justificationAbsence.findUnique({
    where: { id },
    include: { eleve: { select: { id: true, classeId: true } } },
  });
  if (!justification) {
    throw new JustificationError("Justification introuvable", 404);
  }
  verifierEcole(user, justification.schoolId);
  return justification;
}

export class JustificationService {
  /**
   * Liste les absences d'un élève qui nécessitent une justification
   * @param eleveId id de l'éléve concerné
   * @param user l'utuilisateur connecté
   * @returns La liste des absences de l'élève qui nécessitent une justification
   */
  static async absencesAJustifier(eleveId: string, user: UserContext) {
    await getEleve(eleveId, user); //
    const presences = await prisma.presence.findMany({
      where: {
        eleveId,
        justificationAbsenceId: null,
        statut: {
          in: ["ABSENT", "RETARD"],
        },
      },
      orderBy: [
        {
          appel: { date: "desc" },
        },
        {
          appel: { creneau: { heureDebut: "desc" } },
        },
      ],
      take: 100,
      select: {
        id: true,
        statut: true,
        appel: {
          select: {
            date: true,
            creneau: {
              select: {
                heureDebut: true,
                heureFin: true,
                matiere: { select: { nom: true } },
              },
            },
          },
        },
      },
    });
    return presences.map((presence) => ({
      id: presence.id,
      statut: presence.statut,
      date: presence.appel.date,
      heureDebut: presence.appel.creneau.heureDebut,
      heureFin: presence.appel.creneau.heureFin,
      matiere: presence.appel.creneau.matiere?.nom ?? null,
    }));
  }

  /**
   * Crée une nouvelle justification d'absence pour un élève donné
   * @param input Les données nécessaires pour créer la justification
   * @param fichier Le fichier justificatif (pièce jointe)
   * @param user L'utilisateur effectuant la requête
   * @returns La justification créée
   */
  static async creer(
    input: CreerJustificationInput,
    fichier: Express.Multer.File | undefined,
    user: UserContext,
  ) {
    if (!fichier) {
      throw new JustificationError(
        "Le justificatif (pièce jointe) est requis",
        400,
      );
    }
    const eleve = await getEleve(input.eleveId, user);
    const presenceIds = [...new Set(input.presenceIds)];

    return prisma.$transaction(async (tx) => {
      const justification = await tx.justificationAbsence.create({
        data: {
          schoolId: eleve.schoolId,
          eleveId: eleve.id,
          motif: input.motif,
          fichierNom: fichier.originalname,
          fichierPath: fichier.filename,
          fichierMime: fichier.mimetype,
          createdById: user.id,
        },
      });

      // Le fichier protège contre une absence déjà justifiée ou appartenant à une autre élève
      const { count } = await tx.presence.updateMany({
        where: {
          id: { in: presenceIds },
          eleveId: eleve.id,
          justificationAbsenceId: null,
          statut: { in: ["ABSENT", "RETARD"] },
        },
        data: { justificationAbsenceId: justification.id },
      });
      if (count !== presenceIds.length) {
        throw new JustificationError(
          "Certaines présences n'ont pas pu être justifiées. Elles peuvent déjà être justifiées ou ne pas appartenir à cet élève.",
          400,
        );
      }
      return justification;
    });
  }

  /**
   * Liste les justifications d'absence d'un élève avec pagination
   * @param eleveId L'identifiant de l'élève
   * @param query Les paramètres de pagination et de filtrage
   * @param user L'utilisateur effectuant la requête
   * @returns La liste des justifications d'absence de l'élève avec pagination
   */
  static async lister(
    eleveId: string,
    query: ListeJustificationsQuery,
    user: UserContext,
  ) {
    const eleve = await getEleve(eleveId, user);
    const where = { eleveId: eleve.id };
    const [data, total] = await Promise.all([
      prisma.justificationAbsence.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          motif: true,
          fichierNom: true,
          createdAt: true,
          _count: { select: { presences: true } },
          billets: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              numero: true,
              dateValidite: true,
              creneau: { select: { heureDebut: true, heureFin: true } },
            },
          },
        },
      }),
      prisma.justificationAbsence.count({ where }),
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
   * Récupère les informations sur le fichier de justification d'absence correspondant à l'identifiant fourni.
   * @param justificationId L'identifiant de la justification d'absence
   * @param user L'utilisateur effectuant la requête
   * @returns Les informations sur le fichier de justification d'absence
   */
  static async getFichier(justificationId: string, user: UserContext) {
    const justification = await getJustification(justificationId, user); // Récupère la justification en s'assurant que l'utilisateur a le droit d'y accéder
    return {
      chemin: path.join(
        JUSTIFICATIFS_DIR,
        path.basename(justification.fichierPath),
      ),
      mime: justification.fichierMime,
      nom: justification.fichierNom,
    };
  }

  /**
   * Récupère les propositions de créneaux horaires pour une justification d'absence donnée.
   * @param justificationId L'identifiant de la justification d'absence
   * @param user L'utilisateur effectuant la requête
   * @param now La date et l'heure actuelles pour le calcul des propositions
   * @returns Les propositions de créneaux horaires pour la justification d'absence
   */
  static async propositions(
    justificationId: string,
    user: UserContext,
    now = new Date(),
  ) {
    const justification = await getJustification(justificationId, user); // Récupère la justification en s'assurant que l'utilisateur a le droit d'y accéder
    if (!justification.eleve.classeId) {
      throw new JustificationError("L'élève n'appartient à aucune classe", 409);
    }

    const creneaux = await prisma.creneauHoraire.findMany({
      where: { classeId: justification.eleve.classeId },
      select: {
        id: true,
        jour: true,
        heureDebut: true,
        heureFin: true,
        intitule: true,
        matiere: { select: { nom: true } },
      },
    });

    return calculerPropositions(creneaux, now); // Calcule les propositions de créneaux horaires pour la justification d'absence
  }

  /**
   * Génère un billet d'entrée pour une justification d'absence donnée.
   * @param justificationId L'identifiant de la justification d'absence
   * @param input Les informations nécessaires pour créer le billet
   * @param user L'utilisateur effectuant la requête
   * @returns Le billet d'entrée généré ou existant
   */
  static async genererBillet(
    justificationId: string,
    input: CreerBilletInput,
    user: UserContext,
  ) {
    const justification = await getJustification(justificationId, user); // Récupère la justification en s'assurant que l'utilisateur a le droit d'y accéder
    if (!justification.eleve.classeId) {
      throw new JustificationError("L'élève n'appartient à aucune classe", 409);
    }

    const creneau = await prisma.creneauHoraire.findFirst({
      where: { id: input.creneauId, classeId: justification.eleve.classeId },
      select: { id: true, jour: true },
    });
    if (!creneau) {
      throw new JustificationError(
        "Ce créneau n'existe pas pour la classe de l'élève",
        404,
      );
    }

    if (jourDeLaDate(input.date) !== creneau.jour) {
      throw new JustificationError(
        "La date ne correspond pas au jour du créneau",
        400,
      );
    }

    if (input.date < formatDateLocale(new Date())) {
      throw new JustificationError(
        "La date du billet ne peut pas être antérieure à aujourd'hui",
        400,
      );
    }

    const existant = await prisma.billetEntree.findUnique({
      where: {
        eleveId_creneauId_dateValidite: {
          eleveId: justification.eleve.id,
          creneauId: creneau.id,
          dateValidite: input.date,
        },
      },
    });
    if (existant) return existant; // Retourne le billet existant s'il existe déjà pour l'élève, le créneau et la date spécifiés

    const compact = input.date.replaceAll("-", ""); // Transforme la date en format compact (YYYYMMDD)
    const suffixe = crypto.randomUUID().slice(0, 6).toUpperCase(); // Génère un suffixe aléatoire en majuscules
    try {
      // 3. Tentative de création
      return await prisma.billetEntree.create({
        data: {
          numero: `BIL-${compact}-${suffixe}`,
          schoolId: justification.schoolId,
          eleveId: justification.eleve.id,
          justificationId: justification.id,
          creneauId: creneau.id,
          dateValidite: input.date,
          createdById: user.id,
        },
      });
    } catch (error) {
      // 4. Si une collision se produit (requête concurrente ou double-clic), Prisma lève P2002
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // On va le chercher et le retourner proprement au lieu de faire planter la requête
        const ticketConcurrent = await prisma.billetEntree.findUnique({
          where: {
            eleveId_creneauId_dateValidite: {
              eleveId: justification.eleve.id,
              creneauId: creneau.id,
              dateValidite: input.date,
            },
          },
        });

        if (ticketConcurrent) {
          return ticketConcurrent;
        }
      }

      // 5. Si c'est une autre erreur, on la propage normalement
      throw error;
    }
  }

  static async getBilletPourImpression(billetId: string, user: UserContext) {
    const billet = await prisma.billetEntree.findUnique({
      where: { id: billetId },
      include: {
        eleve: {
          select: {
            nom: true,
            prenom: true,
            matricule: true,
            classe: { select: { nom: true } },
          },
        },
        creneau: {
          select: {
            jour: true,
            heureDebut: true,
            heureFin: true,
            matiere: { select: { nom: true } },
          },
        },
        school: { select: { nom: true, adresse: true, telephone: true } },
        createdBy: { select: { nom: true, prenom: true } },
      },
    });
    if (!billet) {
      throw new JustificationError("Le billet d'entrée n'exista pas", 404);
    }
    verifierEcole(user, billet.schoolId); // Vérifie que l'utilisateur a accès à l'école du billet
    return billet; // Retourne le billet pour impression
  }
}
