import { prisma } from "../../../../lib/prisma.js";
import {
  AlerteEleve,
  AlerteQuery,
  AlerteResponse,
  TypeAlerte,
} from "./alerte.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class AlerteError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AlerteError";
  }
}

type Compteurs = {
  present: number;
  absent: number;
  absentNonJustifie: number;
  retard: number;
};

const pad = (n: number) => String(n).padStart(2, "0"); // Ajoute un zéro devant les nombres inférieurs à 10 pour le format AAAA-MM-JJ
export const formatDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // AAAA-MM-JJ

/**
 * Période par défaut: les 30 derniers jours (format AAAA-MM-JJ, comparable en chaîne)
 * @returns date au format { from: string; to: string } avec les dates au format AAAA-MM-JJ
 */
function periodeParDefaut(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: formatDate(from), to: formatDate(to) };
}

/**
 * Résout l'identifiant de l'école à utiliser en fonction du contexte utilisateur et de la requête.
 * Si l'utilisateur est un SUDO_ADMIN, l'identifiant de l'école doit être fourni dans la requête.
 * Sinon, l'identifiant de l'école de l'utilisateur est utilisé.
 * @param user Le contexte de l'utilisateur effectuant la requête.
 * @param query La requête contenant éventuellement l'identifiant de l'école.
 * @returns L'identifiant de l'école à utiliser.
 */
function resoudreEcole(user: UserContext, query: AlerteQuery): string {
  if (user.role === "SUDO_ADMIN") {
    if (!query.schoolId) {
      throw new AlerteError("schoolId est requis pour un SUDO_ADMIN", 400);
    }
    return query.schoolId;
  }
  if (!user.schoolId) {
    throw new AlerteError("L'utilisateur n'est associé à aucune école", 403);
  }
  return user.schoolId;
}

/**
 * Compte les présences, absences, absences non justifiées et retards par élève.
 * @param where Les conditions de filtrage pour les présences.
 * @returns Une map associant chaque identifiant d'élève à ses compteurs de présence, absence, absence non justifiée et retard.
 */
export async function compterParEleve(
  where: object,
): Promise<Map<string, Compteurs>> {
  const [parStatut, nonJustifiees] = await Promise.all([
    prisma.presence.groupBy({
      by: ["eleveId", "statut"],
      where,
      _count: { _all: true },
    }),
    prisma.presence.groupBy({
      by: ["eleveId"],
      where: { ...where, statut: "ABSENT", justificationAbsenceId: null },
      _count: { _all: true },
    }),
  ]);

  const map = new Map<string, Compteurs>();
  const get = (id: string): Compteurs => {
    let c = map.get(id);
    if (!c) {
      c = { present: 0, absent: 0, absentNonJustifie: 0, retard: 0 };
      map.set(id, c);
    }
    return c;
  };

  for (const l of parStatut) {
    const c = get(l.eleveId);
    if (l.statut === "PRESENT") c.present = l._count._all;
    else if (l.statut === "ABSENT") c.absent = l._count._all;
    else c.retard = l._count._all;
  }
  for (const l of nonJustifiees) {
    get(l.eleveId).absentNonJustifie = l._count._all;
  }
  return map;
}

/**
 * Évalue les compteurs d'un élève pour déterminer les types et le niveau d'alerte.
 * @param compteurs Les compteurs de présence, absence, absence non justifiée et retard de l'élève.
 * @param query La requête contenant les seuils pour les alertes.
 * @returns Un objet contenant les types d'alerte, le niveau d'alerte, le total des appels et le taux de présence.
 */
function evaluer(compteurs: Compteurs, query: AlerteQuery) {
  const totalAppels = compteurs.present + compteurs.absent + compteurs.retard;
  // Un retard compte comme présent, comme dans le suivi
  const tauxPresence =
    totalAppels > 0
      ? Math.round(
          ((compteurs.present + compteurs.retard) / totalAppels) * 1000,
        ) / 10
      : 100;

  const types: TypeAlerte[] = [];
  if (compteurs.absent >= query.seuilAbsences) types.push("ABSENCES_REPETEES");
  if (compteurs.absentNonJustifie >= query.seuilAbsences) {
    types.push("ASSIDUITE_FAIBLE");
  }

  // CRITIQUE : seuil doublé, ou plusieurs types cumulés
  const critique =
    types.length >= 2 ||
    compteurs.absent >= query.seuilAbsences * 2 ||
    compteurs.retard >= query.seuilRetards * 2;

  return {
    types,
    niveau: critique ? ("CRITIQUE" as const) : ("ATTENTION" as const),
    totalAppels,
    tauxPresence,
  };
}

export class AlerteService {
  /**
   * Liste les alertes pour les élèves selon les critères spécifiés dans la requête.
   * @param query Les critères de filtrage et de pagination des alertes.
   * @param user Le contexte de l'utilisateur effectuant la requête.
   * @returns La réponse contenant la liste des alertes et le résumé.
   */
  static async lister(
    query: AlerteQuery,
    user: UserContext,
  ): Promise<AlerteResponse> {
    const schoolId = resoudreEcole(user, query); //
    const defaut = periodeParDefaut(); //
    const from = query.from ?? defaut.from;
    const to = query.to ?? defaut.to;

    const where = {
      eleve: {
        schoolId,
        deletedAt: null,
        ...(query.classeId ? { classeId: query.classeId } : {}),
      },
      appel: { date: { gte: from, lte: to } },
    };

    const compteurs = await compterParEleve(where);

    // On ne garde que les élèves qui déclenchent au moins une alert
    const alertes = [...compteurs.entries()]
      .map(([eleveId, compteurs]) => ({
        eleveId,
        compteurs,
        ...evaluer(compteurs, query), // Évalue les compteurs pour déterminer les types et le niveau d'alerte
      }))
      .filter((alerte) => alerte.types.length > 0); // On ne garde que les élèves qui déclenchent au moins une alerte

    // Résumé calculé avant le filtre de niveai (pour rester cohérent)
    const resume = {
      total: alertes.length,
      attention: alertes.filter((alerte) => alerte.niveau === "ATTENTION")
        .length, //
      critique: alertes.filter((alerte) => alerte.niveau === "CRITIQUE").length, //
    };

    const filters = alertes
      .filter((alerte) => !query.niveau || alerte.niveau === query.niveau)
      // Le cas le plus grave à afficher d'abord
      .sort(
        (a, b) =>
          Number(b.niveau === "CRITIQUE") - Number(a.niveau === "CRITIQUE") ||
          b.compteurs.absent - a.compteurs.absent ||
          b.compteurs.retard - a.compteurs.retard,
      );

    const total = filters.length;
    const page = filters.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit,
    ); //

    // Identité des élèves de la page uniquement
    const eleves = await prisma.eleve.findMany({
      where: { id: { in: page.map((a) => a.eleveId) } },
      select: {
        id: true,
        nom: true,
        prenom: true,
        classe: { select: { id: true, nom: true } },
      },
    });

    const parId = new Map(eleves.map((eleve) => [eleve.id, eleve]));

    const data: AlerteEleve[] = page.flatMap((alerte) => {
      const eleve = parId.get(alerte.eleveId);
      if (!eleve) return [];
      return [
        {
          eleve,
          niveau: alerte.niveau,
          types: alerte.types,
          stats: {
            totalAppels: alerte.totalAppels,
            absent: alerte.compteurs.absent,
            absentNonJustifie: alerte.compteurs.absentNonJustifie,
            retard: alerte.compteurs.retard,
            tauxPresence: alerte.tauxPresence,
          },
        },
      ];
    });

    return {
      periode: { from, to },
      seuils: {
        absences: query.seuilAbsences,
        retards: query.seuilRetards,
        tauxPresence: query.seuilTauxPresence,
      },
      resume,
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
