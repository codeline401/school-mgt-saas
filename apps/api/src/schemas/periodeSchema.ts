import { z } from "zod";

const optionalDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.coerce.date({ error: "Date invalide" }).optional(),
);

export const createPeriodeSchema = z
  .object({
    nom: z.string().min(1, "Le nom est requis").max(100),
    type: z
      .enum(["TRIMESTRE", "SEMESTRE", "ANNEE", "AUTRE"])
      .default("TRIMESTRE"),
    anneeScolaire: z
      .string()
      .min(1, "L'année scolaire est requise")
      .regex(/^\d{4}-\d{4}$/, "Format attendu : YYYY-YYYY (ex: 2026-2027)"),
    dateDebut: optionalDate,
    dateFin: optionalDate,
  })
  .refine(
    ({ dateDebut, dateFin }) => !dateDebut || !dateFin || dateFin >= dateDebut,
    {
      path: ["dateFin"],
      message: "La date de fin doit être postérieure à la date de début.",
    },
  );
