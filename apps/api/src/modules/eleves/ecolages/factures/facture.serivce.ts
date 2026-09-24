import { th } from "zod/locales";
import { prisma } from "../../../../lib/prisma.js";
import {
  FactureDetail,
  FactureListResponse,
  FactureResume,
  FormatImpression,
  ListeFactureQuery,
} from "./facture.schema.js";
import { templateEngine } from "../../../../lib/templateEngine.js";
import { Buffer } from "buffer";
import { pdfGenerator } from "../../../../lib/pdfGenerator.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class FactureEleveNotFoundError extends Error {
  status = 404;
  constructor(message = "Elève introuvable") {
    super(message);
    this.name = "FactureEleveNotFoundError";
  }
}

export class FactureForbiddenError extends Error {
  status = 403;
  constructor(message = "Accès interdit à la facture") {
    super(message);
    this.name = "FactureForbiddenError";
  }
}

export class FactureNotFoundError extends Error {
  status = 404;
  constructor(message = "Facture introuvable") {
    super(message);
    this.name = "FactureNotFoundError";
  }
}

function toResume(paiement: {
  // Convert a paiement object to a FactureResume object
  id: string;
  numeroRecu: string;
  montant: { toString(): string };
  modePaiement: string;
  datePaiement: Date;
  ecolage: { anneeScolaire: string; mois: number } | null;
}): FactureResume {
  return {
    id: paiement.id,
    numeroRecu: paiement.numeroRecu,
    typeFrais: "ECOLAGE",
    montant: paiement.montant.toString(),
    modePaiement: paiement.modePaiement,
    datePaiement: paiement.datePaiement.toISOString(),
    anneeScolaire: paiement.ecolage?.anneeScolaire ?? null,
    mois: paiement.ecolage?.mois ?? null,
  };
}

export class FactureService {
  /**
   * Liste paginée des factures/reçus d'un élève, filtrage par année scolaire, type de frais et période
   */
  static async listeFacturesEleve(
    eleveId: string,
    query: ListeFactureQuery,
    user: UserContext,
  ): Promise<FactureListResponse> {
    // Vérifie si l'élève existe et appartient à l'école de l'utilisateur
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId, deletedAt: null },
      select: { id: true, schoolId: true },
    });

    if (!eleve) {
      throw new FactureEleveNotFoundError();
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== eleve.schoolId) {
      throw new FactureForbiddenError();
    }

    // Seul le type ECOLAGE est actuellement enregistré : toute autre valuer ne peut renvoyer aucune ligne
    if (query.typeFrais && query.typeFrais !== "ECOLAGE") {
      return {
        data: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const where = {
      eleveId, // Filtre par l'identifiant de l'élève
      schoolId: eleve.schoolId, // Filtre par l'identifiant de l'école de l'élève
      ...(query.anneeScolaire && {
        ecolage: { anneeScolaire: query.anneeScolaire },
      }), // Filtre par l'année scolaire si elle est spécifiée dans la requête
      ...((query.dateDebut || query.dateFin) && {
        datePaiement: {
          ...(query.dateDebut && { gte: query.dateDebut }),
          ...(query.dateFin && { lte: query.dateFin }),
        },
      }), // Filtre par la période de paiement si elle est spécifiée dans la requête
    };

    const [total, paiments] = await Promise.all([
      prisma.paiementEcolage.count({ where }),
      prisma.paiementEcolage.findMany({
        where,
        include: { ecolage: { select: { anneeScolaire: true, mois: true } } },
        orderBy: { datePaiement: "desc" },
        skip: (query.page - 1) * query.limit, // Pagination : nombre d'éléments à ignorer
        take: query.limit, // Pagination : nombre d'éléments à récupérer
      }),
    ]);

    return {
      data: paiments.map(toResume),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)), // Assure qu'il y a au moins une page même si le total est 0
      },
    };
  }

  /**
   * Détails complets d'une facture (établissement, élève, classe, agent encaisseur)
   */
  static async getFactureDetail(
    factureId: string,
    user: UserContext,
  ): Promise<FactureDetail> {
    const paiement = await prisma.paiementEcolage.findUnique({
      where: { id: factureId },
      include: {
        ecolage: { include: { classe: { select: { id: true, nom: true } } } },
        eleve: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            classe: { select: { id: true, nom: true } },
          },
        },
        school: {
          select: {
            id: true,
            nom: true,
            adresse: true,
            telephone: true,
            email: true,
            logoUrl: true,
            devise: true,
            numAutorisation: true,
          },
        },
        agent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!paiement) {
      throw new FactureNotFoundError();
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== paiement.school.id) {
      throw new FactureForbiddenError();
    }

    const classe = paiement.ecolage?.classe ?? paiement.eleve.classe ?? null;

    return {
      id: paiement.id,
      numeroRecu: paiement.numeroRecu,
      typeFrais: "ECOLAGE",
      montant: paiement.montant.toString(),
      modePaiement: paiement.modePaiement,
      datePaiement: paiement.datePaiement.toISOString(),
      anneeScolaire: paiement.ecolage?.anneeScolaire ?? null,
      mois: paiement.ecolage?.mois ?? null,
      referencePaiement: paiement.referencePaiement,
      remarque: paiement.remarque,
      createdAt: paiement.createdAt.toISOString(),
      montantDu: (paiement.ecolage?.montant ?? paiement.montant).toString(),
      ecole: paiement.school,
      eleve: {
        id: paiement.eleve.id,
        matricule: paiement.eleve.matricule,
        nom: paiement.eleve.nom,
        prenom: paiement.eleve.prenom,
        classe,
      },
      agent: paiement.agent,
    };
  }

  /**
   * Compile le HTML imprimable d'une facture selon le format demandé
   * Le dimesionnement (A5 vs ticket 80mm) est piloté par la règle CSS `@page`
   * du template `recu.hbs`, lue par Puppeteer via `preferCSSPageSize`
   */
  static async generePdfImpression(
    factureId: string,
    format: FormatImpression,
    user: UserContext,
  ): Promise<Buffer> {
    const facture = await this.getFactureDetail(factureId, user); // Récupère les détails complets de la facture pour l'impression

    // sélectionner le template Handlebars adapté
    const isThermal = format === "THERMAL";

    // 1. Toujours compiler 'recu' (qui pointe vers recu.hbs)
    const htmlContent = await templateEngine.compile("recu", {
      facture,
      isThermal,
      dateImpression: new Date(),
    });

    // 2. Transmettre à Puppeteer
    const pdfBuffer = await pdfGenerator.htmlToPdf(htmlContent, {
      format: isThermal ? undefined : "A5",
      orientation: "portrait",
    });

    return pdfBuffer;
  }
}
