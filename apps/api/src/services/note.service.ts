import fs from "fs";
import { prisma } from "../lib/prisma.js";
import { TypeNote } from "../generated/prisma/enums.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NoteCreateInput {
  titre: string;
  note: number;
  noteMax: number;
  coefficient: number;
  commentaire?: string | null;
  typeNote?: string;
  dateEval?: Date;
  eleveId: string;
  matiereId: string;
}

export interface NoteUpdateInput {
  note?: number;
  noteMax?: number;
  coefficient?: number;
  commentaire?: string | null;
  typeNote?: string;
  dateEval?: Date;
}

export interface DateFilter {
  gte?: Date;
  lte?: Date;
}

export interface MoyenneResult {
  eleve: { id: string; nom: string; prenom: string };
  matieres: Array<{
    matiere: { id: string; nom: string };
    notesCC: any[];
    notesExamen: any[];
    moyenneCC: number | null;
    moyenneExamen: number | null;
    moyenneFinale: number | null;
  }>;
  moyenneGenerale: number | null;
}

export interface EntreeClassement {
  eleve: { id: string; nom: string; prenom: string };
  moyenne: number | null;
  rang: number;
  exAequo: boolean;
  detailMatieres?: Array<{
    matiere: { id: string; nom: string };
    moyenne: number | null;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Vérifie qu'un utilisateur est autorisé à accéder aux ressources d'une école.
 * SUDO_ADMIN a accès à toutes les écoles ; les autres utilisateurs uniquement à la leur.
 */
export function isAuthorizedForSchool(
  userRole: string,
  userSchoolId: string | null | undefined,
  resourceSchoolId: string,
): boolean {
  if (userRole === "SUDO_ADMIN") return true;
  return userSchoolId === resourceSchoolId;
}

/** Supprime un fichier uploadé de manière silencieuse (best-effort). */
export function removeUploadedFile(filePath: string | undefined): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn(
      "[cleanup] Impossible de supprimer le fichier uploadé :",
      filePath,
      e,
    );
  }
}

/** Moyenne pondérée normalisée sur 20. */
export function weightedAvg(notes: any[]): number | null {
  const valid = notes.filter((n) => Number(n.noteMax) > 0);
  if (valid.length === 0) return null;
  const sumCoef = valid.reduce(
    (s: number, n: any) => s + Number(n.coefficient),
    0,
  );
  if (sumCoef === 0) return null;
  const sumW = valid.reduce(
    (s: number, n: any) =>
      s + (Number(n.note) / Number(n.noteMax)) * 20 * Number(n.coefficient),
    0,
  );
  return Math.round((sumW / sumCoef) * 100) / 100;
}

/**
 * Parse et valide les bornes de date depuis des strings "YYYY-MM-DD".
 * Retourne null en cas de date invalide (le contrôleur renverra alors une 400).
 */
export function parseDateFilter(
  debut?: string,
  fin?: string,
): DateFilter | null {
  const filter: DateFilter = {};

  if (debut) {
    const d = new Date(debut);
    if (isNaN(d.getTime())) return null;
    d.setUTCHours(0, 0, 0, 0);
    filter.gte = d;
  }
  if (fin) {
    const d = new Date(fin);
    if (isNaN(d.getTime())) return null;
    d.setUTCHours(23, 59, 59, 999);
    filter.lte = d;
  }

  return filter;
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

/** Retourne toutes les notes d'une classe, triées par matière puis par élève. */
export async function findNotesByClasse(classeId: string) {
  return prisma.note.findMany({
    where: { classeId },
    include: {
      eleve: { select: { id: true, nom: true, prenom: true } },
      matiere: { select: { id: true, nom: true } },
    },
    orderBy: [
      { matiere: { nom: "asc" } },
      { eleve: { nom: "asc" } },
      { titre: "asc" },
    ],
  });
}

/** Crée une note. */
export async function createNote(
  data: NoteCreateInput,
  classeId: string,
  schoolId: string,
  createdById: string,
  feuillePath: string | null,
) {
  return prisma.note.create({
    data: {
      titre: data.titre,
      note: data.note,
      noteMax: data.noteMax,
      coefficient: data.coefficient,
      commentaire: data.commentaire ?? null,
      typeNote: (data.typeNote as any) ?? "AUTRE",
      dateEval: data.dateEval ?? new Date(),
      feuillePath,
      eleveId: data.eleveId,
      matiereId: data.matiereId,
      classeId,
      schoolId,
      createdById,
    },
  });
}

/** Met à jour une note existante. */
export async function updateNote(
  noteId: string,
  data: NoteUpdateInput,
  newFeuillePath: string | null,
  hasNewFile: boolean,
) {
  return prisma.note.update({
    where: { id: noteId },
    data: {
      ...(data.note !== undefined ? { note: data.note } : {}),
      ...(data.noteMax !== undefined ? { noteMax: data.noteMax } : {}),
      ...(data.coefficient !== undefined
        ? { coefficient: data.coefficient }
        : {}),
      ...(data.commentaire !== undefined
        ? { commentaire: data.commentaire }
        : {}),
      ...(data.typeNote !== undefined
        ? { typeNote: data.typeNote as any }
        : {}),
      ...(data.dateEval !== undefined ? { dateEval: data.dateEval } : {}),
      ...(hasNewFile ? { feuillePath: newFeuillePath } : {}),
    },
  });
}

/** Supprime une note par son id. */
export async function deleteNote(noteId: string) {
  return prisma.note.delete({ where: { id: noteId } });
}

/** Calcule les moyennes automatiques par élève et par matière pour une classe. */
export async function computeMoyennesAuto(
  classeId: string,
  dateFilter: DateFilter,
): Promise<MoyenneResult[]> {
  const notes = await prisma.note.findMany({
    where: {
      classeId,
      typeNote: { in: [TypeNote.INTERROGATION, TypeNote.DS, TypeNote.EXAMEN] },
      ...(Object.keys(dateFilter).length > 0 ? { dateEval: dateFilter } : {}),
    },
    include: {
      eleve: { select: { id: true, nom: true, prenom: true } },
      matiere: { select: { id: true, nom: true } },
    },
    orderBy: [
      { eleve: { nom: "asc" } },
      { matiere: { nom: "asc" } },
      { dateEval: "asc" },
    ],
  });

  const eleveMap = new Map<
    string,
    {
      eleve: { id: string; nom: string; prenom: string };
      matiereMap: Map<
        string,
        {
          matiere: { id: string; nom: string };
          notesCC: typeof notes;
          notesExamen: typeof notes;
        }
      >;
    }
  >();

  for (const note of notes) {
    const eleve = note.eleve!;
    const matiere = note.matiere!;

    if (!eleveMap.has(eleve.id)) {
      eleveMap.set(eleve.id, { eleve, matiereMap: new Map() });
    }
    const eleveEntry = eleveMap.get(eleve.id)!;

    if (!eleveEntry.matiereMap.has(matiere.id)) {
      eleveEntry.matiereMap.set(matiere.id, {
        matiere,
        notesCC: [],
        notesExamen: [],
      });
    }
    const matiereEntry = eleveEntry.matiereMap.get(matiere.id)!;

    if (
      note.typeNote === TypeNote.INTERROGATION ||
      note.typeNote === TypeNote.DS
    ) {
      matiereEntry.notesCC.push(note);
    } else if (note.typeNote === TypeNote.EXAMEN) {
      matiereEntry.notesExamen.push(note);
    }
  }

  return Array.from(eleveMap.values()).map(({ eleve, matiereMap }) => {
    const matieres = Array.from(matiereMap.values()).map(
      ({ matiere, notesCC, notesExamen }) => {
        const moyenneCC = weightedAvg(notesCC);
        const moyenneExamen = weightedAvg(notesExamen);

        let moyenneFinale: number | null = null;
        if (moyenneCC !== null && moyenneExamen !== null) {
          moyenneFinale =
            Math.round(((moyenneCC + moyenneExamen) / 2) * 100) / 100;
        } else if (moyenneCC !== null) {
          moyenneFinale = moyenneCC;
        } else if (moyenneExamen !== null) {
          moyenneFinale = moyenneExamen;
        }

        return {
          matiere,
          notesCC,
          notesExamen,
          moyenneCC,
          moyenneExamen,
          moyenneFinale,
        };
      },
    );

    const finals = matieres
      .map((m) => m.moyenneFinale)
      .filter((m): m is number => m !== null);

    const moyenneGenerale =
      finals.length > 0
        ? Math.round(
            (finals.reduce((s, m) => s + m, 0) / finals.length) * 100,
          ) / 100
        : null;

    return { eleve, matieres, moyenneGenerale };
  });
}

/** Calcule le classement des élèves d'une classe. */
export async function computeClassement(
  classeId: string,
  mode: "general" | "matiere",
  dateFilter: DateFilter,
  matiereId?: string,
): Promise<EntreeClassement[]> {
  const notes = await prisma.note.findMany({
    where: {
      classeId,
      typeNote: { in: [TypeNote.INTERROGATION, TypeNote.DS, TypeNote.EXAMEN] },
      ...(matiereId && mode === "matiere" ? { matiereId } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { dateEval: dateFilter } : {}),
    },
    include: {
      eleve: { select: { id: true, nom: true, prenom: true } },
      matiere: { select: { id: true, nom: true } },
    },
  });

  // Groupement par élève
  const eleveMap = new Map<
    string,
    { eleve: { id: string; nom: string; prenom: string }; notes: typeof notes }
  >();

  for (const note of notes) {
    const eleve = note.eleve!;
    if (!eleveMap.has(eleve.id)) {
      eleveMap.set(eleve.id, { eleve, notes: [] });
    }
    eleveMap.get(eleve.id)!.notes.push(note);
  }

  // S'assurer que tous les élèves de la classe apparaissent (même sans note)
  const tousEleves = await prisma.eleve.findMany({
    where: { classeId },
    select: { id: true, nom: true, prenom: true },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
  for (const eleve of tousEleves) {
    if (!eleveMap.has(eleve.id)) {
      eleveMap.set(eleve.id, { eleve, notes: [] });
    }
  }

  let entries: Omit<EntreeClassement, "rang" | "exAequo">[];

  if (mode === "general") {
    entries = Array.from(eleveMap.values()).map(({ eleve, notes: ns }) => {
      const matiereMap = new Map<
        string,
        { matiere: { id: string; nom: string }; notes: typeof notes }
      >();

      for (const n of ns) {
        const mat = n.matiere!;
        if (!matiereMap.has(mat.id)) {
          matiereMap.set(mat.id, { matiere: mat, notes: [] });
        }
        matiereMap.get(mat.id)!.notes.push(n);
      }

      const detailMatieres = Array.from(matiereMap.values()).map(
        ({ matiere, notes: mn }) => {
          const cc = mn.filter(
            (n) =>
              n.typeNote === TypeNote.INTERROGATION ||
              n.typeNote === TypeNote.DS,
          );
          const ex = mn.filter((n) => n.typeNote === TypeNote.EXAMEN);
          const moyCC = weightedAvg(cc);
          const moyEx = weightedAvg(ex);
          let finale: number | null = null;
          if (moyCC !== null && moyEx !== null)
            finale = Math.round(((moyCC + moyEx) / 2) * 100) / 100;
          else finale = moyCC ?? moyEx;
          return { matiere, moyenne: finale };
        },
      );

      const finals = detailMatieres
        .map((d) => d.moyenne)
        .filter((m): m is number => m !== null);

      const moyenne =
        finals.length > 0
          ? Math.round(
              (finals.reduce((s, m) => s + m, 0) / finals.length) * 100,
            ) / 100
          : null;

      return { eleve, moyenne, detailMatieres };
    });
  } else {
    entries = Array.from(eleveMap.values()).map(({ eleve, notes: ns }) => {
      const cc = ns.filter(
        (n) =>
          n.typeNote === TypeNote.INTERROGATION || n.typeNote === TypeNote.DS,
      );
      const ex = ns.filter((n) => n.typeNote === TypeNote.EXAMEN);
      const moyCC = weightedAvg(cc);
      const moyEx = weightedAvg(ex);
      let moyenne: number | null = null;
      if (moyCC !== null && moyEx !== null)
        moyenne = Math.round(((moyCC + moyEx) / 2) * 100) / 100;
      else moyenne = moyCC ?? moyEx;
      return { eleve, moyenne };
    });
  }

  // Tri décroissant + attribution des rangs (ex-aequo)
  const sorted = [...entries].sort((a, b) => {
    if (a.moyenne === null && b.moyenne === null) return 0;
    if (a.moyenne === null) return 1;
    if (b.moyenne === null) return -1;
    return b.moyenne - a.moyenne;
  });

  const result: EntreeClassement[] = [];
  let currentRang = 1;

  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    if (
      i > 0 &&
      sorted[i]?.moyenne !== prev?.moyenne &&
      sorted[i]?.moyenne !== null
    ) {
      currentRang = i + 1;
    }
    const exAequo =
      sorted[i]?.moyenne !== null &&
      sorted.filter((e) => e.moyenne === sorted[i]?.moyenne).length > 1;

    result.push({
      ...sorted[i]!,
      rang: sorted[i]?.moyenne !== null ? currentRang : sorted.length,
      exAequo,
    });
  }

  return result;
}
