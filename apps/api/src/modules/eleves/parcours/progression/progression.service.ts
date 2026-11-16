import { Prisma } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../../lib/prisma.js";
import { weightedAvg } from "../../../../services/note.service.js";
import {
  ProgressionMatiere,
  ProgressionPoint,
  ProgressionQuery,
} from "./progression.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class ProgressionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ProgressionError";
  }
}

type LigneNote = {
  note: Prisma.Decimal;
  noteMax: Prisma.Decimal;
  coefficient: Prisma.Decimal;
  dateEval: Date;
  periode: {
    id: string;
    nom: string;
    anneeScolaire: string;
    dateDebut: Date | null;
  } | null;
  matiere: {
    id: string;
    nom: string;
  };
};

type PointAgrege = {
  periode: ProgressionPoint["periode"];
  date: string | null;
  matiere?: ProgressionPoint["matiere"];
  notes: LigneNote[];
  ordre: number;
};

function dateISO(date: Date): string {
  return date.toISOString().slice(0, 10); // Format date as YYYY-MM-DD
}

/**
 * Calculate the trend of progression points based on their moyenne values.
 * @param points Array of progression points to analyze
 * @returns "HAUSSE" if the trend is increasing, "BAISSE" if decreasing, "STABLE" if no significant change, or null if insufficient data
 */
function calculerTendance(
  points: ProgressionPoint[],
): "HAUSSE" | "BAISSE" | "STABLE" | null {
  const valuers = points
    .map((point) => point.moyenne) // Extract the moyenne value from each point
    .filter((valeur): valeur is number => valeur !== null); // Keep only non-null values

  if (valuers.length < 2) return null; // Pas assez de données pour déterminer la tendance

  const variation = valuers[valuers.length - 1] - valuers[0]; // Calcule la différence entre la dernière et la première valeur
  if (variation > 0.05) return "HAUSSE";
  if (variation < -0.05) return "BAISSE";
  return "STABLE";
}

export class ProgressionService {
  static async getProgression(
    eleveId: string,
    query: ProgressionQuery,
    user: UserContext,
  ) {
    if (!user.schoolId) {
      throw new ProgressionError(
        "Vous devez appartenir à une école pour accéder à cette ressource",
        403,
      );
    }

    const eleve = await prisma.eleve.findFirst({
      where: {
        id: eleveId,
        schoolId: user.schoolId,
        deletedAt: null, // Ensure the student is not deleted
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        matricule: true,
        classe: {
          select: { id: true, nom: true },
        },
      },
    });

    if (!eleve) {
      throw new ProgressionError("Élève introuvable", 404);
    }

    const where: Prisma.NoteWhereInput = {
      eleveId,
      schoolId: user.schoolId,
      eleve: { is: { deletedAt: null } },
      ...(query.classeId ? { classeId: query.classeId } : {}),
      ...(query.matiereId ? { matiereId: query.matiereId } : {}),
      ...(query.periodeId ? { periodeId: query.periodeId } : {}),
    };

    const notes: LigneNote[] = await prisma.note.findMany({
      where,
      select: {
        note: true,
        noteMax: true,
        coefficient: true,
        dateEval: true,
        periode: {
          select: {
            id: true,
            nom: true,
            anneeScolaire: true,
            dateDebut: true,
          },
        },
        matiere: {
          select: { id: true, nom: true },
        },
      },
      orderBy: [{ dateEval: "asc" }, { createdAt: "asc" }],
    });

    if (notes.length === 0) {
      return {
        eleve,
        points: [],
        resume: {
          moyenneGenerale: null,
          meilleureMatiere: null,
          moinsBonneMatiere: null,
          tendance: null,
        },
      };
    }

    const groupes = new Map<string, PointAgrege>();

    for (const note of notes) {
      const date = dateISO(note.dateEval);

      // Détermination de la clé et de l'ordre selon qu'on filtre par matière ou non
      const key = query.matiereId
        ? `matière:${note.periode?.id ?? "sans-periode"} : ${date}` // Clé unique par date d'évaluation si matiereId est présent
        : note.periode
          ? `periode:${note.periode.id}` // Clé unique par période
          : `date:${date}`;

      // Si query.matiereId est présent, on se base strictement sur dateEval. Sinon on garde la période.
      const timestampOrdre = query.matiereId
        ? note.dateEval.getTime()
        : (note.periode?.dateDebut?.getTime() ?? note.dateEval.getTime());

      const groupeExistant = groupes.get(key);

      if (groupeExistant) {
        groupeExistant.notes.push(note);
        groupeExistant.ordre = Math.min(groupeExistant.ordre, timestampOrdre);
      } else {
        groupes.set(key, {
          periode: note.periode
            ? {
                id: note.periode.id,
                nom: note.periode.nom,
                anneeScolaire: note.periode.anneeScolaire,
              }
            : null,
          date: query.matiereId || !note.periode ? date : null,
          ...(query.matiereId ? { matiere: note.matiere } : {}),
          notes: [note],
          ordre: timestampOrdre,
        });
      }
    }

    const points: ProgressionPoint[] = [...groupes.values()]
      .sort((a, b) => a.ordre - b.ordre) // Correction du tiret manquant
      .map((groupe) => ({
        periode: groupe.periode,
        date: groupe.date,
        moyenne: weightedAvg(groupe.notes),
        ...(groupe.matiere ? { matiere: groupe.matiere } : {}),
      }));

    const notesParMatiere = new Map<string, LigneNote[]>();

    for (const note of notes) {
      const groupe = notesParMatiere.get(note.matiere.id) ?? [];
      groupe.push(note);
      notesParMatiere.set(note.matiere.id, groupe);
    }

    const moyennesMatieres: ProgressionMatiere[] = [
      ...notesParMatiere.entries(),
    ]
      .map(([matiereId, notesMatiere]) => ({
        id: matiereId,
        nom: notesMatiere[0].matiere.nom,
        moyenne: weightedAvg(notesMatiere),
      }))
      .filter(
        (matiere): matiere is ProgressionMatiere & { moyenne: number } =>
          matiere.moyenne !== null,
      )
      .sort((a, b) => a.moyenne - b.moyenne); // Correction du tiret manquant

    return {
      eleve,
      points,
      resume: {
        moyenneGenerale: weightedAvg(notes),
        meilleureMatiere: moyennesMatieres.at(-1) ?? null,
        moinsBonneMatiere: moyennesMatieres[0] ?? null,
        tendance: calculerTendance(points),
      },
    };
  }
}
