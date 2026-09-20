import { prisma } from "../../../../lib/prisma.js";
import {
  EnregistrerPaiementInput,
  PaiementResponse,
} from "./paiement.schema.js";

export type EcolageLigneResponse = {
  id: string;
  anneeScolaire: string;
  mois: number;
  montant: string;
  montantPaye: string;
  statutPaiement: string;
};

type UserContext = {
  id: string;
  role: string;
  schoolId: string;
};

export class PaiementEleveNotFoundError extends Error {
  status = 404;
  constructor(message = "Elève introuvable") {
    super(message); // Appel du constructeur de la classe parente Error avec le message fourni
    this.name = "PaiementEleveNotFoundError";
  }
}

export class PaiementEleveForbiddenError extends Error {
  status = 403;
  constructor(message = "Accès refusé à cet élève") {
    super(message); // Appel du constructeur de la classe parente Error avec le message fourni
    this.name = "PaiementEleveForbiddenError";
  }
}

export class PaiementFraisIntrouvableError extends Error {
  status = 404;
  constructor(
    message = "Aucune ligne de frais correspondante pour cette période",
  ) {
    super(message); // Appel du constructeur de la classe parente Error avec le message fourni
    this.name = "PaiementFraisIntruvableError";
  }
}

export class PaiementEcolageService {
  static async getEcolagesEleve(
    eleveId: string,
    user: UserContext,
  ): Promise<EcolageLigneResponse[]> {
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId, deletedAt: null },
      select: { id: true, schoolId: true },
    });

    if (!eleve) {
      throw new PaiementEleveNotFoundError();
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== eleve.schoolId) {
      throw new PaiementEleveForbiddenError();
    }

    const ecolages = await prisma.ecolage.findMany({
      where: { eleveId, schoolId: eleve.schoolId },
      orderBy: [{ anneeScolaire: "desc" }, { mois: "asc" }],
      include: {
        paiementEcolages: {
          select: { montant: true },
        },
      },
    });

    return ecolages.map((ecolage) => {
      const montantPaye = ecolage.paiementEcolages.reduce(
        (total, paiement) => total + Number(paiement.montant),
        0,
      );

      return {
        id: ecolage.id,
        anneeScolaire: ecolage.anneeScolaire,
        mois: ecolage.mois,
        montant: ecolage.montant.toString(),
        montantPaye: montantPaye.toString(),
        statutPaiement: ecolage.statutPaiement,
      };
    });
  }

  /**
   * Enregistrer un paiement pour un élève
   * @param eleveId
   * @param input
   * @param user
   */
  static async enregistrerPaiement(
    eleveId: string,
    input: EnregistrerPaiementInput,
    user: UserContext,
  ): Promise<PaiementResponse> {
    const eleve = await prisma.eleve.findUnique({
      // Recherche de l'élève dans la base de données en fonction de son ID et de l'absence de suppression logique
      where: { id: eleveId, deletedAt: null },
      select: { id: true, schoolId: true },
    });

    if (!eleve) {
      throw new PaiementEleveNotFoundError();
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== eleve.schoolId) {
      throw new PaiementEleveForbiddenError();
    }

    if (input.typeFrais !== "ECOLAGE") {
      // Traitement DROIT_INSCRIPTION / FRAIS_EXAMEN à brancher sur DroitInscription
      throw new PaiementFraisIntrouvableError(
        "Type de frais non encore supporté par ce service",
      );
    }

    return prisma.$transaction(async (tx) => {
      const ecolage = await tx.ecolage.findUnique({
        where: {
          eleveId_anneeScolaire_mois: {
            eleveId,
            anneeScolaire: input.anneeScolaire,
            mois: input.mois!,
          },
        },
      });

      if (!ecolage) {
        throw new PaiementFraisIntrouvableError();
      }

      const paiementExistants = await tx.paiementEcolage.aggregate({
        // Récupération de la somme des paiements existants pour cet écolage
        where: { ecolageId: ecolage.id },
        _sum: { montant: true },
      });

      const totalDejaPaye = Number(paiementExistants._sum.montant ?? 0); // Montant total déjà payé pour cet écolage
      const nouveauTotal = totalDejaPaye + input.montantSaisi; // Nouveau total après ajout du paiement saisi
      const montantDu = Number(ecolage.montant); // Montant total dû pour cet écolage

      const nouveauStatut = nouveauTotal >= montantDu ? "PAYE" : "PARTIEL"; // Détermination du nouveau statut de l'écolage en fonction du montant payé

      // Numéro de reçu unique: compteur par école + horodatage
      const compteur = await tx.paiementEcolage.count({
        where: { schoolId: eleve.schoolId },
      });
      const numeroRecu = `REC-${eleve.schoolId.slice(0, 8).toUpperCase()}-${Date.now()}-${compteur + 1}`; // Génération d'un numéro de reçu unique pour ce paiement

      const paiement = await tx.paiementEcolage.create({
        data: {
          numeroRecu,
          montant: input.montantSaisi,
          modePaiement: input.modePaiement,
          referencePaiement: input.referencePaiement ?? null,
          datePaiement: input.datePaiement,
          remarque: input.remarque ?? null,
          eleveId,
          ecolageId: ecolage.id,
          schoolId: eleve.schoolId,
          agentId: user.id,
        },
      });

      await tx.ecolage.update({
        where: { id: ecolage.id },
        data: { statutPaiement: nouveauStatut },
      });

      return {
        id: paiement.id,
        numeroRecu: paiement.numeroRecu,
        montant: paiement.montant.toString(),
        modePaiement: paiement.modePaiement,
        referencePaiement: paiement.referencePaiement,
        datePaiement: paiement.datePaiement.toISOString(),
        remarque: paiement.remarque,
        statutEcolage: nouveauStatut,
        agentId: paiement.agentId,
        createdAt: paiement.createdAt.toISOString(),
      };
    });
  }
}
