import { prisma } from "../../../../lib/prisma.js";
import { SuiviQuery, SuiviResponse } from "./suivi.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class SuiviError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "SuiviError";
  }
}

const pad = (num: number) => String(num).padStart(2, "0"); // Ajoute un zéro devant les nombres inférieurs à 10 pour obtenir un format à deux chiffres

/**
 * Obtient les dates de début et de fin du mois courant
 * @returns Un objet contenant les dates de début et de fin du mois courant au format AAAA-MM-JJ
 */
function moisCourant(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const dernierJour = new Date(y, m, 0).getDate();
  return {
    // REVIEW :
    // moisCourant() returns 01-10-2026 style strings. The schema, the web client, and the SuiviResponse contract use AAAA-MM-JJ. The default values are used when from or to is missing. They are compared as strings in appel.date (gte/lte). 01-10-2026 does not sort like 2026-10-01. The query returns wrong or empty results, and periode is returned in the wrong format. The bundled web client always sends from and to, so only direct API callers hit this path.
    from: `${y}-${pad(m)}-01`,
    to: `${y}-${pad(m)}-${pad(dernierJour)}`,
  };
}

export class SuiviAbsenceService {
  static async getSuivi(
    eleveId: string,
    query: SuiviQuery,
    user: UserContext,
  ): Promise<SuiviResponse> {
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId, deletedAt: null },
      select: {
        id: true,
        nom: true,
        prenom: true,
        schoolId: true,
        classe: { select: { id: true, nom: true } },
      },
    });

    if (!eleve) {
      throw new SuiviError("Elève non trouvé", 404);
    }
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== eleve.schoolId) {
      throw new SuiviError("Accès refuséà à cet élève", 403);
    }

    const defaut = moisCourant(); // Obtient les dates de début et de fin du mois courant par défaut
    const from = query.from ?? defaut.from; // Utilise la date de début fournie dans la requête ou la date de début du mois courant par défaut
    const to = query.to ?? defaut.to; // Utilise la date de fin fournie dans la requête ou la date de fin du mois courant par défaut

    // Le résumé ignore le filtre de statut pour rester cohérent
    const wherePeriode = { eleveId, appel: { date: { gte: from, lte: to } } };
    const whereListe = {
      ...wherePeriode,
      ...(query.statut ? { statut: query.statut } : {}), // Ajoute le filtre de statut uniquement si il est présent dans la requête
    };

    const [parStatut, total, lignes] = await Promise.all([
      prisma.presence.groupBy({
        by: ["statut"],
        where: wherePeriode,
        _count: { _all: true }, // Compte le nombre total d'absences pour chaque statut
      }),
      // REVIEW :
      // total comes from count({ where: wherePeriode }), which ignores query.statut. The list uses whereListe, which includes the status filter. When the user filters by status, pagination.total and totalPages describe all records in the period, not the filtered list. The UI then shows extra pages that are empty. The summary should keep ignoring the status filter, which groupBy already does. Count the paginated list with whereListe.
      prisma.presence.count({ where: whereListe }), // Compte les lignes de la liste (période + statut)
      prisma.presence.findMany({
        where: whereListe, // Filtre les absences selon la période et le statut si fourni
        orderBy: [
          { appel: { date: "desc" } }, // Trie les absences par date décroissante
          { appel: { creneau: { heureDebut: "desc" } } }, //
        ],
        skip: (query.page - 1) * query.limit, // Ignore les premiers résultats pour la pagination
        take: query.limit, // Limite le nombre de résultats retournés pour la pagination
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
                  intitule: true,
                  matiere: { select: { nom: true } },
                },
              },
            },
          },
          justificationAbsenceId: true,
        },
      }),
    ]);

    const compte = (
      s: "PRESENT" | "ABSENT" | "RETARD", // REVIEW : const compte = (s: "PRESENT" | "ABSENT" | "RETARD") =>
    ) => parStatut.find((p) => p.statut === s)?._count._all ?? 0; // Retourne le nombre d'absences pour le statut donné, ou 0 si aucun
    const present = compte("PRESENT");
    const absent = compte("ABSENT");
    const retard = compte("RETARD");
    const totalAppels = present + absent + retard; // Calcule le nombre total d'appels pour l'élève sur la période donnée

    return {
      eleve,
      periode: { from, to },
      resume: {
        totalAppels,
        present,
        absent,
        retard,
        tauxPresence:
          totalAppels > 0
            ? Math.round(((present + retard) / totalAppels) * 1000) / 10
            : 100,
      },
      data: lignes.map((ligne) => ({
        id: ligne.id,
        date: ligne.appel.date,
        statut: ligne.statut,
        heureDebut: ligne.appel.creneau.heureDebut,
        heureFin: ligne.appel.creneau.heureFin,
        matiere: ligne.appel.creneau.matiere?.nom ?? null,
        intitule: ligne.appel.creneau.intitule,
        justifiee: ligne.justificationAbsenceId !== null,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }
}
