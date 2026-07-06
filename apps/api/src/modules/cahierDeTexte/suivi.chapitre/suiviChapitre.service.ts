import { prisma } from "../../../lib/prisma.js";

import {
  createChapitreSchema,
  updateChapitreSchema,
} from "./suiviChapitre.schema.js";

import { AppError } from "../../cahierDeTexte/helpers/errors.js";

// --- Types ----------------------------------------------
export interface AuthUser {
  id: string;
  role: string;
  schoolId: string;
}

// --- Constantes / helpers internes ----------------------------------------------
const INCLUDE = {
  matiere: { select: { id: true, nom: true } },
  sousChapitres: { orderBy: { ordre: "asc" as const } },
};

function canRead(role: string) {
  return ["ADMIN", "PROF", "USER", "SUDO_ADMIN"].includes(role);
}

function canWrite(role: string) {
  return ["ADMIN", "PROF", "USER", "SUDO_ADMIN"].includes(role);
}

async function getClassOrThrow(classeId: string) {
  const classe = await prisma.classe.findUnique({
    where: { id: classeId },
  });
  if (!classe) {
    throw new AppError(404, "Classe non trouvée");
  }
  return classe;
}

function assertSameSchoolOrSudo(user: AuthUser, schoolId: string) {
  if (user.role !== "SUDO_ADMIN" && user.schoolId !== schoolId) {
    throw new AppError(
      403,
      "Vous n'avez pas la permission d'accéder à cette ressource",
    );
  }
}

async function assertMatiereAllowed(
  user: AuthUser,
  matiereId: string,
  classeId?: string,
) {
  const matiere = await prisma.matiere.findUnique({
    where: { id: matiereId },
    select: {
      schoolId: true,
      classeId: true,
    },
  });

  if (!matiere) {
    throw new AppError(400, "Matière non trouvée");
  }

  if (user.role !== "SUDO_ADMIN" && matiere.schoolId !== user.schoolId) {
    throw new AppError(
      403,
      "Vous n'avez pas la permission d'accéder à cette ressource",
    );
  }

  if (classeId && matiere.classeId !== classeId) {
    throw new AppError(
      400,
      "La matière n'appartient pas à la classe sélectionnée",
    );
  }

  return matiere;
}

async function getChapitreOrThrow(classeId: string, chapitreId: string) {
  const chapitre = await prisma.chapitre.findUnique({
    where: { id: chapitreId },
    include: INCLUDE,
  });

  if (!chapitre || chapitre.classeId !== classeId) {
    throw new AppError(404, "Chapitre non trouvé");
  }
  return chapitre;
}

// --- Service functions ----------------------------------------------

/**
 * Liste les chapitres d'une classe (avec leurs sous-chapitres), filtrables par maitère.
 */
export async function listChapitres(
  user: AuthUser,
  classeId: string,
  matiereId: string,
) {
  if (!canRead(user.role)) {
    throw new AppError(
      403,
      "Vous n'avez pas la permission d'accéder à cette ressource",
    );
  }

  const classe = await getClassOrThrow(classeId);
  assertSameSchoolOrSudo(user, classe.schoolId);

  return prisma.chapitre.findMany({
    where: { classeId, ...(matiereId ? { matiereId } : {}) },
    include: INCLUDE,
    orderBy: { ordre: "asc" },
  });
}

/**
 * Créer un chapitre (et ses sous-chapitres éventuels) pour une class/matière
 */
export async function createChapitre(
  user: AuthUser,
  classeId: string,
  rawData: unknown,
) {
  if (!canWrite(user.role)) {
    throw new AppError(
      403,
      "Vous n'avez pas la permission d'accéder à cette ressource",
    );
  }

  const data = createChapitreSchema.parse(rawData);

  const classe = await getClassOrThrow(classeId);
  assertSameSchoolOrSudo(user, classe.schoolId);
  await assertMatiereAllowed(user, data.matiereId, classeId);

  // Si aucun ordre n'est fourni, on place le nouveau chapitre à la fin de la liste
  let ordre = data.ordre;
  if (ordre === undefined) {
    const dernierChapitre = await prisma.chapitre.findFirst({
      where: { classeId, matiereId: data.matiereId },
      orderBy: { ordre: "desc" },
      select: { ordre: true },
    });
    ordre = (dernierChapitre?.ordre ?? -1) + 1;
  }

  return prisma.chapitre.create({
    data: {
      titre: data.titre,
      ordre,
      statut: data.statut ?? "A_FAIRE",
      classeId,
      matiereId: data.matiereId,
      schoolId: classe.schoolId,
      ...(data.sousChapitres && data.sousChapitres.length > 0
        ? {
            sousChapitres: {
              create: data.sousChapitres.map((sousChapitre, index) => ({
                titre: sousChapitre.titre,
                ordre: sousChapitre.ordre ?? index,
                statut: sousChapitre.statut ?? "A_FAIRE",
              })),
            },
          }
        : {}),
    },
    include: INCLUDE,
  });
}

/**
 * Met à jour un chapitre : titre, ordre, statut, matière, et remplace
 * la liste des sous-chapitre en totalité (delete + recreate)
 */
export async function udpateChapitre(
  user: AuthUser,
  classeId: string,
  chapitreId: string,
  rawData: unknown,
) {
  if (!canWrite(user.role)) {
    throw new AppError(
      403,
      "Vous n'avez pas la permission d'accéder à cette ressource",
    );
  }

  const existingChapitre = await getChapitreOrThrow(classeId, chapitreId);
  assertSameSchoolOrSudo(user, existingChapitre.schoolId);

  const data = createChapitreSchema.parse(rawData);
  if (data.matiereId !== existingChapitre.matiereId) {
    await assertMatiereAllowed(user, data.matiereId, classeId);
  }

  return prisma.$transaction(async (tx) => {
    if (data.sousChapitres !== undefined) {
      await tx.sousChapitre.deleteMany({
        where: { chapitreId },
      });
    }

    return tx.chapitre.update({
      where: { id: chapitreId },
      data: {
        titre: data.titre,
        ordre: data.ordre ?? existingChapitre.ordre,
        statut: data.statut ?? existingChapitre.statut,
        matiereId: data.matiereId,

        ...(data.sousChapitres !== undefined
          ? {
              sousChapitres: {
                create: data.sousChapitres.map((sousChapitre, index) => ({
                  titre: sousChapitre.titre,
                  ordre: sousChapitre.ordre ?? index,
                  statut: sousChapitre.statut ?? "A_FAIRE",
                })),
              },
            }
          : {}),
      },
      include: INCLUDE,
    });
  });
}

/**
 * Met à jour uniquement le statut d'un chapitre (toggle rapide, sans repasser tout le payload)
 */
export async function updateChapitreStatut(
  user: AuthUser,
  classeId: string,
  chapitreId: string,
  rawStatut: unknown,
) {
  if (!canWrite(user.role)) {
    throw new AppError(403, "Vous n'avez pas accès à cette ressource");
  }

  const chapitre = await getChapitreOrThrow(classeId, chapitreId);
  assertSameSchoolOrSudo(user, chapitre.schoolId);

  const { statut } = updateChapitreSchema.parse(rawStatut);

  return prisma.chapitre.update({
    where: { id: chapitreId },
    data: { statut },
    include: INCLUDE,
  });
}

/**
 * Met à jour le statut uniquement d'un sous-chapitre (toggle rapide, sans repasser tout le payload)
 */
export async function updateStatutSousChapitreStatut(
  user: AuthUser,
  classeId: string,
  chapitreId: string,
  sousChapitreId: string,
  rawStatut: unknown,
) {
  if (!canWrite(user.role)) {
    throw new AppError(403, "Vous n'avez pas accès à cette ressource");
  }

  const chapitre = await getChapitreOrThrow(classeId, chapitreId);
  assertSameSchoolOrSudo(user, chapitre.schoolId);

  const sousChapitre = await prisma.sousChapitre.findUnique({
    where: { id: sousChapitreId },
  });

  if (!sousChapitre) {
    throw new AppError(404, "Sous-chapitre non trouvé");
  }

  const { statut } = updateChapitreSchema.parse(rawStatut);

  return prisma.sousChapitre.update({
    where: { id: sousChapitreId },
    data: { statut },
  });
}

/**
 * Supprime un chapitre (et ses sous-chapitres)
 * cascade PRISMA
 */
export async function deleteChapitre(
  user: AuthUser,
  classeId: string,
  chapitreId: string,
) {
  if (!canWrite(user.role)) {
    throw new AppError(403, "Vous n'avez pas accès à cette ressource");
  }

  const ExistingChapitre = await getChapitreOrThrow(classeId, chapitreId);
  assertSameSchoolOrSudo(user, ExistingChapitre.schoolId);

  return prisma.chapitre.delete({
    where: { id: chapitreId },
  });
}
