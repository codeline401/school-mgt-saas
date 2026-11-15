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
      const key = query.matiereId
        ? `matière:${note.periode?.id ?? "sans-periode"} : ${date}` // Clé unique pour chaque matière et date
        : note.periode //
          ? `periode:${note.periode.id}` // Clé unique pour chaque période
          : `date:${date}`; // Clé unique pour chaque date

      const groupeExistant = groupes.get(key); // Récupère le groupe existant pour cette clé, s'il existe

      if (groupeExistant) {
        groupeExistant.notes.push(note); // Ajoute la note au groupe existant
        groupeExistant.ordre = Math.min(
          groupeExistant.ordre,
          note.periode?.dateDebut?.getTime() ?? note.dateEval.getTime(),
        );
      } else {
        groupes.set(key, {
          // Crée un nouveau groupe pour cette clé
          periode: note.periode // Inclut les informations de la période si elle existe
            ? {
                id: note.periode.id,
                nom: note.periode.nom,
                anneeScolaire: note.periode.anneeScolaire,
              }
            : null,
          date: query.matiereId || !note.periode ? date : null, // Inclut la date si c'est une matière ou s'il n'y a pas de période associée
          ...(query.matiereId ? { matiere: note.matiere } : {}), // Inclut les informations de la matière si c'est une matière spécifique
          notes: [note], // Initialise le groupe avec la note actuelle
          ordre: note.periode?.dateDebut?.getTime() ?? note.dateEval.getTime(), // Définit l'ordre du groupe en fonction de la date de début de la période ou de la date de l'évaluation
        });
      }
    }

    const points: ProgressionPoint[] = [...groupes.values()]
      .sort((a, b) => a.ordre - b.ordre) // Transforme les groupes en tableau de points de progression et les trie par ordre
      .map((groupe) => ({
        periode: groupe.periode,
        date: groupe.date,
        moyenne: weightedAvg(groupe.notes),
        ...(groupe.matiere ? { matiere: groupe.matiere } : {}),
      }));

    const notesParMatiere = new Map<string, LigneNote[]>(); // Regroupe les notes par matière

    for (const note of notes) {
      const groupe = notesParMatiere.get(note.matiere.id) ?? []; // Récupère le groupe de notes pour cette matière, ou initialise un tableau vide s'il n'existe pas
      groupe.push(note); // Ajoute la note au groupe
      notesParMatiere.set(note.matiere.id, groupe); // Met à jour le groupe dans la map
    }

    const moyennesMatieres: ProgressionMatiere[] = [
      ...notesParMatiere.entries(),
    ]
      .map(([matiereId, notesMatiere]) => ({
        id: matiereId,
        nom: notesMatiere[0].matiere.nom, // Utilise le nom de la matière à partir de la première note du groupe
        moyenne: weightedAvg(notesMatiere), // Calcule la moyenne pondérée des notes pour cette matière
      }))
      .filter(
        (matiere): matiere is ProgressionMatiere & { moyenne: number } =>
          matiere.moyenne !== null, // Filtre les matières qui ont une moyenne calculée
      )
      .sort((a, b) => a.moyenne - b.moyenne); // Trie les matières par moyenne croissante

    return {
      eleve,
      points,
      resume: {
        moyenneGenerale: weightedAvg(notes), // Calcule la moyenne générale de toutes les notes de l'élève
        meilleureMatiere: moyennesMatieres.at(-1) ?? null, // Récupère la matière avec la meilleure moyenne, ou null si aucune matière n'a de moyenne
        moinsBonneMatiere: moyennesMatieres[0] ?? null, // Récupère la matière avec la moins bonne moyenne, ou null si aucune matière n'a de moyenne
        tendance: calculerTendance(points), // Calcule la tendance des points de progression de l'élève
      },
    };
  }
}
