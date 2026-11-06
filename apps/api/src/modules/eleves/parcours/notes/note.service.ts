import { Prisma } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../../lib/prisma.js";
import {
  parseDateFilter,
  weightedAvg,
} from "../../../../services/note.service.js";
import { ListeNotesQuery, ListeNotesResponse } from "./note.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class NoteParcoursError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "NoteParcoursError";
  }
}

/**
 * Restreint la requête à l'école de l'utilisateur connecté (SUDO_ADMIN: toutes les écoles)
 * @param user Contexte de l'utilisateur connecté
 * @returns Le filtre prisma à appliquer aux notes
 */
function scopeEcole(user: UserContext): Prisma.NoteWhereInput {
  if (user.role === "SUDO_ADMIN") return {};
  if (!user.schoolId) {
    throw new NoteParcoursError("Aucune école associé à l'utilisateur", 403);
  }
  return { schoolId: user.schoolId };
}

export class NoteParcoursService {
  static async lister(
    query: ListeNotesQuery,
    user: UserContext,
  ): Promise<ListeNotesResponse> {
    const dateEval = parseDateFilter(query.from, query.to); // Filtre des dates d'évaluation

    const where: Prisma.NoteWhereInput = {
      ...scopeEcole(user),
      eleve: { is: { deletedAt: null } }, // exclut les élèves archivés
      ...(query.eleveId ? { eleveId: query.eleveId } : {}),
      ...(query.classeId ? { classeId: query.classeId } : {}),
      ...(query.matiereId ? { matiereId: query.matiereId } : {}),
      ...(query.periodeId ? { periodeId: query.periodeId } : {}),
      ...(query.typeNote ? { typeNote: query.typeNote } : {}),
      ...(dateEval ? { dateEval } : {}),
    };

    const [lignes, pourMoyenne] = await Promise.all([
      prisma.note.findMany({
        where,
        select: {
          id: true,
          titre: true,
          typeNote: true,
          note: true,
          noteMax: true,
          coefficient: true,
          dateEval: true,
          commentaire: true,
          eleve: {
            select: { id: true, nom: true, prenom: true, matricule: true },
          },
          classe: { select: { id: true, nom: true } },
          matiere: { select: { id: true, nom: true } },
          periode: { select: { id: true, nom: true } },
        },
        orderBy: [{ dateEval: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.limit, //
        take: query.limit,
      }),
      // Toutes les notes du filtre : le total et la moyenne ne dépendent pas de la page
      prisma.note.findMany({
        where,
        select: { note: true, noteMax: true, coefficient: true },
      }),
    ]);

    const total = pourMoyenne.length; //

    return {
      resume: { nbNotes: total, moyenne: weightedAvg(pourMoyenne) },
      data: lignes.map((ligne) => ({
        ...ligne,
        note: Number(ligne.note),
        noteMax: Number(ligne.noteMax),
        coefficient: Number(ligne.coefficient),
        dateEval: ligne.dateEval.toDateString(),
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
