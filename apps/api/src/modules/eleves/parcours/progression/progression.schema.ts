import z from "zod";

const uuid = (label: string) => z.string().uuid(`${label} invalide`);

export const progressionParamsSchema = z.object({
  eleveId: uuid("Identifiant de l'élève"),
});

export const progressionQuerySchema = z.object({
  classeId: uuid("Identifiant de la classe").optional(),
  periodeId: uuid("Identifiant de la période").optional(),
  matiereId: uuid("Identifiant de la matière").optional(),
});

export type ProgressionQuery = z.infer<typeof progressionQuerySchema>;

export type ProgressionPeriode = {
  id: string;
  nom: string;
  anneeScolaire: string;
};

export type ProgressionMatiere = {
  id: string;
  nom: string;
  moyenne: number | null;
};

export type ProgressionPoint = {
  periode: ProgressionPeriode | null;
  date: string | null;
  moyenne: number | null;
  matiere?: { id: string; nom: string };
};

export type ProgressionResponse = {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    matricule: number;
    classe: { id: string; nom: string } | null;
  };
  points: ProgressionPoint[];
  resume: {
    moyenneGenerale: number | null;
    meilleureMatiere: ProgressionMatiere | null;
    moinsBonneMatiere: ProgressionMatiere | null;
    tendance: "HAUSSE" | "BAISSE" | "STABLE" | null;
  };
};
