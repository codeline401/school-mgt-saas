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
  dateEcheance: string | null;
  // Uniquement rempli quand le retard est avéré ET qu'une pénalité > 0 est configurée sur la classe.
  penaliteApplicable: boolean;
  montantPenalite: string | null;
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

export class PaiementMoisDejaSoldeError extends Error {
  status = 409;
  constructor(message = "Ce mois est déjà entièrement payé") {
    super(message);
    this.name = "PaiementMoisDejaSoldeError";
  }
}

export class PaiementExcedentSansMoisSuivantError extends Error {
  status = 400;
  constructor(
    message = "Le montant saisi dépasse le solde dû et aucun mois suivant n'existe pour reporter l'excédent. Réduisez le montant.",
  ) {
    super(message);
    this.name = "PaiementExcedentSansMoisSuivantError";
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

// Renvoie le mois calendaire suivant dans l'année scolaire (Sept.→Août), ou null si Août (dernier mois).
function moisSuivantScolaire(mois: number): number | null {
  if (mois === 8) return null;
  return mois === 12 ? 1 : mois + 1;
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

    // Récupère les échéances/pénalités configurées pour les classes concernées,
    // pour éviter une requête par ligne d'écolage.
    const classeIds = [
      ...new Set(
        ecolages.map((e) => e.classeId).filter((id): id is string => !!id),
      ),
    ];

    const configs = classeIds.length
      ? await prisma.ecolageConfig.findMany({
          where: { classeId: { in: classeIds } },
          include: { echeances: true },
        })
      : [];

    const echeanceParCle = new Map<
      string,
      { dateEcheance: Date; penaliteRetard: number }
    >();
    for (const config of configs) {
      const penaliteRetard = Number(config.penaliteRetard ?? 0);
      for (const echeance of config.echeances) {
        echeanceParCle.set(
          `${config.classeId}-${config.anneeScolaire}-${echeance.mois}`,
          { dateEcheance: echeance.dateEcheance, penaliteRetard },
        );
      }
    }

    const maintenant = new Date();

    return ecolages.map((ecolage) => {
      const montantPaye = ecolage.paiementEcolages.reduce(
        (total, paiement) => total + Number(paiement.montant),
        0,
      );
      const montantRestant = Number(ecolage.montant) - montantPaye;

      const echeance = ecolage.classeId
        ? echeanceParCle.get(
            `${ecolage.classeId}-${ecolage.anneeScolaire}-${ecolage.mois}`,
          )
        : undefined;

      const enRetard =
        montantRestant > 0 &&
        !!echeance &&
        echeance.dateEcheance.getTime() < maintenant.getTime();

      // Pas de pénalité affichée si la classe n'en a pas configuré (valeur 0/nulle).
      const penaliteApplicable =
        enRetard && (echeance?.penaliteRetard ?? 0) > 0;

      return {
        id: ecolage.id,
        anneeScolaire: ecolage.anneeScolaire,
        mois: ecolage.mois,
        montant: ecolage.montant.toString(),
        montantPaye: montantPaye.toString(),
        statutPaiement: ecolage.statutPaiement,
        dateEcheance: echeance?.dateEcheance.toISOString() ?? null,
        penaliteApplicable,
        montantPenalite: penaliteApplicable
          ? String(echeance!.penaliteRetard)
          : null,
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
      const montantDu = Number(ecolage.montant); // Montant total dû pour cet écolage
      const resteDuMoisCourant = montantDu - totalDejaPaye;

      // Empêche un double encaissement sur un mois déjà soldé (ex: re-sélection du même mois payé).
      if (resteDuMoisCourant <= 0) {
        throw new PaiementMoisDejaSoldeError();
      }

      // Ce qui dépasse le solde du mois courant doit être reporté sur le mois suivant.
      const montantAppliqueMoisCourant = Math.min(
        input.montantSaisi,
        resteDuMoisCourant,
      );
      const excedent = input.montantSaisi - montantAppliqueMoisCourant;

      let ecolageMoisSuivant: typeof ecolage | null = null;
      if (excedent > 0) {
        const prochainMois = moisSuivantScolaire(input.mois!);

        // Août est le dernier mois de l'année scolaire : rien à reporter au-delà.
        if (prochainMois === null) {
          throw new PaiementExcedentSansMoisSuivantError();
        }

        ecolageMoisSuivant = await tx.ecolage.findUnique({
          where: {
            eleveId_anneeScolaire_mois: {
              eleveId,
              anneeScolaire: input.anneeScolaire,
              mois: prochainMois,
            },
          },
        });

        // Aucune ligne d'écolage générée pour ce mois suivant : on bloque toute la saisie.
        if (!ecolageMoisSuivant) {
          throw new PaiementExcedentSansMoisSuivantError();
        }
      }
      const statutMoisCourant =
        montantAppliqueMoisCourant >= resteDuMoisCourant ? "PAYE" : "PARTIEL";

      // Numéro de reçu unique: compteur par école + horodatage
      const compteur = await tx.paiementEcolage.count({
        where: { schoolId: eleve.schoolId },
      });
      const numeroRecu = `REC-${eleve.schoolId.slice(0, 8).toUpperCase()}-${Date.now()}-${compteur + 1}`; // Génération d'un numéro de reçu unique pour ce paiement

      const paiement = await tx.paiementEcolage.create({
        data: {
          numeroRecu,
          montant: montantAppliqueMoisCourant,
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
        data: { statutPaiement: statutMoisCourant },
      });

      let excedentAppliqueMoisSuivant: string | null = null;

      if (excedent > 0 && ecolageMoisSuivant) {
        const paiementsMoisSuivant = await tx.paiementEcolage.aggregate({
          where: { ecolageId: ecolageMoisSuivant.id },
          _sum: { montant: true },
        });
        const totalDejaPayeMoisSuivant = Number(
          paiementsMoisSuivant._sum.montant ?? 0,
        );
        const montantDuMoisSuivant = Number(ecolageMoisSuivant.montant);

        const numeroRecuSuivant = `REC-${eleve.schoolId.slice(0, 8).toUpperCase()}-${Date.now()}-${compteur + 2}`;

        await tx.paiementEcolage.create({
          data: {
            numeroRecu: numeroRecuSuivant,
            montant: excedent,
            modePaiement: input.modePaiement,
            referencePaiement: input.referencePaiement ?? null,
            datePaiement: input.datePaiement,
            remarque: `Excédent reporté depuis le mois ${input.mois}`,
            eleveId,
            ecolageId: ecolageMoisSuivant.id,
            schoolId: eleve.schoolId,
            agentId: user.id,
          },
        });

        const statutMoisSuivant =
          totalDejaPayeMoisSuivant + excedent >= montantDuMoisSuivant
            ? "PAYE"
            : "PARTIEL";

        await tx.ecolage.update({
          where: { id: ecolageMoisSuivant.id },
          data: { statutPaiement: statutMoisSuivant },
        });

        excedentAppliqueMoisSuivant = excedent.toString();
      }

      return {
        id: paiement.id,
        numeroRecu: paiement.numeroRecu,
        montant: paiement.montant.toString(),
        modePaiement: paiement.modePaiement,
        referencePaiement: paiement.referencePaiement,
        datePaiement: paiement.datePaiement.toISOString(),
        remarque: paiement.remarque,
        statutEcolage: statutMoisCourant,
        agentId: paiement.agentId,
        createdAt: paiement.createdAt.toISOString(),
        excedentAppliqueMoisSuivant,
      };
    });
  }
}
