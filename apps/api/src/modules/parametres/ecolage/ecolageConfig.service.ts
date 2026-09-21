import { prisma } from "../../../lib/prisma.js";
import {
  EcolageConfigResponse,
  UpsertEcolageConfigInput,
} from "./ecolageConfig.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class ClasseNotFoundError extends Error {
  status = 404;
  constructor(message = "Classe non trouvée") {
    super(message);
    this.name = "ClasseNotFoundError";
  }
}

export class ClasseForbiddenError extends Error {
  status = 403;
  constructor(message = "Accès interdit à cette classe") {
    super(message);
    this.name = "ClasseForbiddenError";
  }
}

export class EcolageConfigNotFoundError extends Error {
  status = 404;
  constructor(message = "Configuration d'écolage non trouvée") {
    super(message);
    this.name = "EcolageConfigNotFoundError";
  }
}

// L'année scolaire "2026-2027" démarre en Septembre 2026 et se termine en juin 2027
function resolveAnneeCivile(anneeScolaire: string, mois: number): number {
  const [premiereAnnee, secondeAnnee] = anneeScolaire.split("-").map(Number);
  return mois >= 9 ? premiereAnnee : secondeAnnee; // Si le mois est septembre ou après, on prend la première année, sinon la seconde année
}

function buildDateEcheance(
  anneeScolaire: string,
  mois: number,
  jourEcheance: number,
): Date {
  const annee = resolveAnneeCivile(anneeScolaire, mois);
  return new Date(annee, mois - 1, jourEcheance); // Les mois en JavaScript sont indexés à partir de 0 (0 = janvier, 11 = décembre)
}

async function assertClasseAccessible(classeId: string, user: UserContext) {
  const classe = await prisma.classe.findUnique({
    where: { id: classeId },
    select: { id: true, schoolId: true },
  });

  if (!classe) {
    throw new ClasseNotFoundError();
  }
  if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
    throw new ClasseForbiddenError();
  }

  return classe;
}

function toResponse(config: {
  id: string;
  classeId: string;
  anneeScolaire: string;
  montantMensuel: { toString(): string };
  jourEcheance: number;
  penaliteRetard: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
  echeances: {
    id: string;
    mois: number;
    montant: { toString(): string };
    dateEcheance: Date;
  }[];
}): EcolageConfigResponse {
  return {
    id: config.id,
    classeId: config.classeId,
    anneeScolaire: config.anneeScolaire,
    montantMensuel: Number(config.montantMensuel.toString()),
    jourEcheance: config.jourEcheance,
    penaliteRetard: config.penaliteRetard?.toString() ?? null,
    echeances: config.echeances
      .sort((a, b) => a.mois - b.mois)
      .map((e) => ({
        id: e.id,
        mois: e.mois,
        montant: e.montant.toString(),
        dateEcheance: e.dateEcheance.toISOString(),
      })),
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export class EcolageConfigService {
  /**
   * Récupère la configuration d'écolage d'une classe pour une année scolaire donnée
   */
  static async getByClasse(
    classeId: string,
    anneeScolaire: string,
    user: UserContext,
  ): Promise<EcolageConfigResponse> {
    // Vérifie que l'utilisateur a accès à la classe
    await assertClasseAccessible(classeId, user);

    const config = await prisma.ecolageConfig.findUnique({
      // Récupère la configuration d'écolage pour la classe et l'année scolaire données
      where: { classeId_anneeScolaire: { classeId, anneeScolaire } },
      include: { echeances: true },
    });

    if (!config) {
      throw new EcolageConfigNotFoundError();
    }

    return toResponse(config);
  }

  /**
   * Créer ou remplace la configuration d'écolage d'une classe pour une année scolaire donnée
   * Les échéances existantes sont recalculées entièrement à chaque appel.
   */
  static async upsertConfig(
    classeId: string,
    input: UpsertEcolageConfigInput,
    user: UserContext,
  ): Promise<EcolageConfigResponse> {
    const classe = await assertClasseAccessible(classeId, user);

    const config = await prisma.$transaction(async (tx) => {
      const upserted = await tx.ecolageConfig.upsert({
        where: {
          classeId_anneeScolaire: {
            classeId,
            anneeScolaire: input.anneeScolaire,
          },
        },
        update: {
          montantMensuel: input.montantMensuel,
          jourEcheance: input.jourEcheance,
          penaliteRetard: input.penaliteRetard ?? null,
        },
        create: {
          classeId,
          schoolId: classe.schoolId,
          anneeScolaire: input.anneeScolaire,
          montantMensuel: input.montantMensuel,
          jourEcheance: input.jourEcheance,
          penaliteRetard: input.penaliteRetard ?? null,
          createdById: user.id,
        },
      });

      // Remplacement complet: évite les échéances orphélines d'une saisie précédante
      await tx.ecolageEcheance.deleteMany({ where: { configId: upserted.id } });

      await tx.ecolageEcheance.createMany({
        // Crée les nouvelles échéances pour la configuration d'écolage
        data: input.mois.map((m) => ({
          configId: upserted.id,
          mois: m.mois,
          montant: m.montant ?? input.montantMensuel,
          dateEcheance: buildDateEcheance(
            input.anneeScolaire,
            m.mois,
            input.jourEcheance,
          ),
        })),
      });

      return tx.ecolageConfig.findUniqueOrThrow({
        // Récupère la configuration d'écolage mise à jour avec les échéances incluses
        where: { id: upserted.id },
        include: { echeances: true },
      });
    });

    return toResponse(config);
  }

  /**
   * Génère (ou met à jour) les lignes `Ecolages` dues pour tous les élèves actifs
   * de la classe, à partir de la configuration existante, Idempotent: rejouer
   * cette action ne duplique pas les lignes déjà créées (contraintes unique
   * eleveId + anneeScolaire + mois) et ne touche pas au statut déjà payée.
   */
  static async genererEcolagesPourClasse(
    classeId: string,
    anneeScolaire: string,
    user: UserContext,
  ): Promise<{ elevesTraites: number; lignesCreees: number }> {
    await assertClasseAccessible(classeId, user); // Vérifie que l'utilisateur a accès à la classe avant de générer les écolages

    const config = await prisma.ecolageConfig.findUnique({
      where: { classeId_anneeScolaire: { classeId, anneeScolaire } },
      include: { echeances: true },
    });

    if (!config) {
      throw new EcolageConfigNotFoundError();
    }

    const eleves = await prisma.eleve.findMany({
      where: { classeId, deletedAt: null, statut: "ACTIF" },
      select: { id: true },
    });

    let lignesCreees = 0;

    await prisma.$transaction(async (tx) => {
      for (const eleve of eleves) {
        for (const echeance of config.echeances) {
          const result = await tx.ecolage.upsert({
            where: {
              eleveId_anneeScolaire_mois: {
                eleveId: eleve.id,
                anneeScolaire,
                mois: echeance.mois,
              },
            },
            // Ne pas écraser le montant d'un écolage déjà facturé/payé
            update: {},
            create: {
              eleveId: eleve.id,
              classeId,
              schoolId: config.schoolId,
              anneeScolaire,
              mois: echeance.mois,
              montant: echeance.montant,
            },
          });

          if (result.createdAt.getTime() === result.updatedAt.getTime()) {
            // Si l'écolage a été créé (et non mis à jour)
            lignesCreees++;
          }
        }
      }
    });

    return { elevesTraites: eleves.length, lignesCreees };
  }
}
