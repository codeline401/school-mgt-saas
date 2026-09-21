import { Decimal } from "@prisma/client/runtime/client";
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

function estConflitNumeroRecu(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002" &&
    Array.isArray((error as { meta?: { target?: unknown } }).meta?.target) &&
    (
      (error as { meta?: { target?: unknown[] } }).meta!.target as unknown[]
    ).includes("numeroRecu")
  );
}

/**
 * Crée un paiement avec un numéro de reçu garanti unique, en réessayant en cas
 * de collision concurrente (comptage identique pour deux requêtes simultanées).
 */
async function creerPaiementAvecRecuUnique(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  schoolId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
) {
  const MAX_TENTATIVES = 5;

  for (let tentative = 0; tentative < MAX_TENTATIVES; tentative++) {
    const compteur = await tx.paiementEcolage.count({ where: { schoolId } });
    const suffixe = tentative === 0 ? "" : `-${tentative}`;
    const numeroRecu = `REC-${schoolId.slice(0, 8).toUpperCase()}-${Date.now()}-${compteur + 1}${suffixe}`;

    try {
      return await tx.paiementEcolage.create({
        data: { ...data, numeroRecu },
      });
    } catch (error) {
      if (estConflitNumeroRecu(error) && tentative < MAX_TENTATIVES - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    "Impossible de générer un numéro de reçu unique après plusieurs tentatives",
  );
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

    // Rejeu d'une requête déjà traitée (ex: retry réseau) : on renvoie le paiement existant sans rien recréer.
    if (input.idempotencyKey) {
      const paiementExistant = await prisma.paiementEcolage.findUnique({
        where: {
          schoolId_idempotencyKey: {
            schoolId: eleve.schoolId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });

      if (paiementExistant) {
        return {
          id: paiementExistant.id,
          numeroRecu: paiementExistant.numeroRecu,
          montant: paiementExistant.montant.toString(),
          modePaiement: paiementExistant.modePaiement,
          referencePaiement: paiementExistant.referencePaiement,
          datePaiement: paiementExistant.datePaiement.toISOString(),
          remarque: paiementExistant.remarque,
          statutEcolage: "PARTIEL", // Statut réel déjà appliqué lors du premier appel ; non recalculé ici.
          agentId: paiementExistant.agentId,
          createdAt: paiementExistant.createdAt.toISOString(),
          excedentAppliqueMoisSuivant: null,
        };
      }
    }

    return prisma.$transaction(async (tx) => {
      // Verrouille la ligne d'écolage ciblée pour empêcher deux encaissements concurrents sur le même mois.
      const verrouille = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Ecolage"
        WHERE "eleveId" = ${eleveId}
          AND "anneeScolaire" = ${input.anneeScolaire}
          AND mois = ${input.mois}
        FOR UPDATE
      `;

      if (verrouille.length === 0) {
        throw new PaiementFraisIntrouvableError();
      }

      const ecolage = await tx.ecolage.findUniqueOrThrow({
        where: { id: verrouille[0]!.id },
      });

      const paiementExistants = await tx.paiementEcolage.aggregate({
        // Récupération de la somme des paiements existants pour cet écolage
        where: { ecolageId: ecolage.id },
        _sum: { montant: true },
      });

      const totalDejaPaye = paiementExistants._sum.montant ?? new Decimal(0); // Montant total déjà payé pour cet écolage
      const montantDu = ecolage.montant; // Montant total dû pour cet écolage
      const resteDuMoisCourant = montantDu.minus(totalDejaPaye);

      // Empêche un double encaissement sur un mois déjà soldé (ex: re-sélection du même mois payé).
      if (resteDuMoisCourant.lessThanOrEqualTo(0)) {
        throw new PaiementMoisDejaSoldeError();
      }

      const montantSaisi = new Decimal(input.montantSaisi);

      // Ce qui dépasse le solde du mois courant doit être reporté sur le mois suivant.
      const montantAppliqueMoisCourant = Decimal.min(
        montantSaisi,
        resteDuMoisCourant,
      );
      const excedent = montantSaisi.minus(montantAppliqueMoisCourant);

      let ecolageMoisSuivant: typeof ecolage | null = null;
      let resteDuMoisSuivant: Decimal | null = null;

      if (excedent.greaterThan(0)) {
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

        const paiementsMoisSuivant = await tx.paiementEcolage.aggregate({
          where: { ecolageId: ecolageMoisSuivant.id },
          _sum: { montant: true },
        });
        const totalDejaPayeMoisSuivant =
          paiementsMoisSuivant._sum.montant ?? new Decimal(0);
        resteDuMoisSuivant = ecolageMoisSuivant.montant.minus(
          totalDejaPayeMoisSuivant,
        );

        // On ne reporte que sur un seul mois suivant : au-delà, la saisie doit être fractionnée manuellement.
        if (excedent.greaterThan(resteDuMoisSuivant)) {
          throw new PaiementExcedentSansMoisSuivantError(
            "Le montant saisi dépasse le solde dû du mois courant et du mois suivant. Réduisez le montant ou encaissez en plusieurs fois.",
          );
        }
      }

      const statutMoisCourant = montantAppliqueMoisCourant.greaterThanOrEqualTo(
        resteDuMoisCourant,
      )
        ? "PAYE"
        : "PARTIEL";

      const paiement = await creerPaiementAvecRecuUnique(tx, eleve.schoolId, {
        montant: montantAppliqueMoisCourant,
        modePaiement: input.modePaiement,
        referencePaiement: input.referencePaiement ?? null,
        datePaiement: input.datePaiement,
        remarque: input.remarque ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        eleveId,
        ecolageId: ecolage.id,
        schoolId: eleve.schoolId,
        agentId: user.id,
      });

      await tx.ecolage.update({
        where: { id: ecolage.id },
        data: { statutPaiement: statutMoisCourant },
      });

      let excedentAppliqueMoisSuivant: string | null = null;

      if (excedent.greaterThan(0) && ecolageMoisSuivant && resteDuMoisSuivant) {
        await creerPaiementAvecRecuUnique(tx, eleve.schoolId, {
          montant: excedent,
          modePaiement: input.modePaiement,
          referencePaiement: input.referencePaiement ?? null,
          datePaiement: input.datePaiement,
          remarque: `Excédent reporté depuis le mois ${input.mois}`,
          eleveId,
          ecolageId: ecolageMoisSuivant.id,
          schoolId: eleve.schoolId,
          agentId: user.id,
        });

        const statutMoisSuivant = excedent.greaterThanOrEqualTo(
          resteDuMoisSuivant,
        )
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
