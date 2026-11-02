import { prisma } from "../../../../lib/prisma.js";
import { evaluerRegle } from "../alertes/alerte.moteur.js";
import { AlerteError } from "../alertes/alerte.service.js";
import { HistoriqueQuery, RegleInput } from "./regle.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

/**
 * Récupère l'ID de l'école associée à l'utilisateur courant.
 * @param user L'utilisateur courant
 * @returns L'ID de l'école associée à l'utilisateur
 * @throws AlerteError si l'utilisateur n'a pas d'école associée
 */
function requireSchoolId(user: UserContext): string {
  if (!user.schoolId) {
    throw new AlerteError("Aucune école associée", 403);
  }
  return user.schoolId;
}

/**
 * Récupère une règle d'alerte par son ID et l'ID de l'école.
 * @param regleId L'ID de la règle d'alerte
 * @param schoolId L'ID de l'école
 * @returns La règle d'alerte correspondante avec ses paliers
 * @throws AlerteError si la règle n'est pas trouvée
 */
async function getRegle(regleId: string, schoolId: string) {
  const regle = await prisma.regleAlerte.findFirst({
    where: { id: regleId, schoolId },
    include: { paliers: true },
  });
  if (!regle) {
    throw new AlerteError("Règle d'alerte introuvable", 404);
  }
  return regle;
}

/**
 * Vérifie si une classe existe et est associée à une école
 * @param classeId L'ID de la classe à vérifier
 * @param schoolId L'ID de l'école
 * @returns Rien si la classe est trouvée, sinon une AlerteError est levée
 * @throws AlerteError si la classe n'est pas trouvée
 */
async function verifierClasse(
  classeId: string | null | undefined,
  schoolId: string,
) {
  if (!classeId) return; // Si aucun ID de classe n'est fourni, on ne fait rien
  const classe = await prisma.classe.findFirst({
    where: { id: classeId, schoolId },
    select: { id: true },
  });
  if (!classe) {
    throw new AlerteError("Classe introuvable", 404);
  }
}

export class RegleAlerteService {
  /**
   * Crée une nouvelle règle d'alerte pour l'école de l'utilisateur courant
   * @param input Les données de la règle d'alerte à créer
   * @param user L'utilisateur courant
   */
  static async creer(input: RegleInput, user: UserContext) {
    const schoolId = requireSchoolId(user); // Récupère l'ID de l'école associée à l'utilisateur courant
    await prisma.regleAlerte.create({
      data: {
        schoolId,
        createdById: user.id,
        nom: input.nom,
        type: input.type,
        periodeJours: input.periodeJours,
        classeId: input.classeId ?? null,
        actif: input.actif,
        paliers: {
          create: input.paliers.map((palier) => ({
            seuil: palier.seuil,
            destinataire: palier.destinataires,
            message: palier.message ?? null,
          })),
        },
      },
      include: { paliers: true },
    });
  }

  /**
   * Récupère la liste des règles d'alerte pour l'école de l'utilisateur courant
   * @param user L'utilisateur courant
   * @returns La liste des règles d'alerte de l'école de l'utilisateur courant
   */
  static async lister(user: UserContext) {
    return prisma.regleAlerte.findMany({
      where: { schoolId: requireSchoolId(user) },
      include: { paliers: { orderBy: { seuil: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Modifie une règle d'alerte existante pour l'école de l'utilisateur courant
   * @param regleId L'ID de la règle à modifier
   * @param input Les nouvelles données de la règle d'alerte
   * @param user L'utilisateur courant
   * @returns La règle d'alerte mise à jour
   */
  static async modifier(regleId: string, input: RegleInput, user: UserContext) {
    const schoolId = requireSchoolId(user); // Récupère l'ID de l'école associée à l'utilisateur courant
    await getRegle(regleId, schoolId); // Vérifie que la règle existe et appartient à l'école de l'utilisateur courant
    await verifierClasse(input.classeId, schoolId); // Vérifie que la classe existe et est associée à l'école

    return prisma.$transaction(async (tx) => {
      await tx.palierAlerte.deleteMany({
        where: {
          regleId,
          seuil: { notIn: input.paliers.map((palier) => palier.seuil) },
        },
      });

      for (const palier of input.paliers) {
        const data = {
          destinataire: palier.destinataires, // Définit les destinataires du palier
          message: palier.message ?? null, // Définit le message du palier ou null si aucun message n'est fourni
        };
        await tx.palierAlerte.upsert({
          where: { regleId_seuil: { regleId, seuil: palier.seuil } },
          update: data, // Met à jour le palier existant avec les nouvelles données
          create: { regleId, seuil: palier.seuil, ...data }, // Crée un nouveau palier si aucun existant avec le même regleId et seuil n'est trouvé
        });
      }
      return tx.regleAlerte.update({
        where: { id: regleId },
        data: {
          nom: input.nom,
          type: input.type,
          periodeJours: input.periodeJours,
          classeId: input.classeId ?? null,
          actif: input.actif,
        },
        include: { paliers: { orderBy: { seuil: "asc" } } }, // Inclut les paliers associés à la règle, triés par seuil
      });
    });
  }

  /**
   * Supprime une règle d'alerte existante pour l'école de l'utilisateur courant
   * @param regleId L'ID de la règle à supprimer
   * @param user L'utilisateur courant
   * @returns L'ID de la règle supprimée
   */
  static async supprimer(regleId: string, user: UserContext) {
    await getRegle(regleId, requireSchoolId(user)); // Vérifie que la règle existe et appartient à l'école de l'utilisateur courant
    await prisma.regleAlerte.delete({ where: { id: regleId } }); // Supprime la règle d'alerte de l'école de l'utilisateur courant
    return { id: regleId };
  }

  static async apercu(regleId: string, user: UserContext) {
    const regle = await getRegle(regleId, requireSchoolId(user)); //
    const correspondances = await evaluerRegle(regle, new Date(), false); //
    return { total: correspondances.length, data: correspondances };
  }

  /**
   * Récupère l'historique des alertes déclenchées pour l'école de l'utilisateur courant, avec possibilité de filtrer par élève et par règle, et de paginer les résultats.
   * @param query Les paramètres de la requête pour filtrer et paginer l'historique
   * @param user L'utilisateur courant
   * @returns L'historique des alertes déclenchées avec pagination
   */
  static async historique(query: HistoriqueQuery, user: UserContext) {
    const where = {
      schoolId: requireSchoolId(user), // Filtre les historiques par l'école de l'utilisateur courant
      ...(query.eleveId ? { eleveId: query.eleveId } : {}), // Filtre les historiques par l'ID de l'élève si fourni
      ...(query.regleId ? { regleId: query.regleId } : {}), // Filtre les historiques par l'ID de la règle si fourni
    };

    const [data, total] = await Promise.all([
      prisma.alerteDeclenchee.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          cycle: true,
          valeur: true,
          nbNotification: true,
          createdAt: true,
          eleve: { select: { id: true, nom: true, prenom: true } },
          regle: { select: { id: true, nom: true, type: true } },
          palier: { select: { seuil: true } },
        },
      }),
      prisma.alerteDeclenchee.count({ where }),
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
}
