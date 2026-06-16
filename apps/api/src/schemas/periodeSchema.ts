import { z } from "zod";

const optionalDate = z
  .string()
  .optional()
  .transform((v) => {
    if (!v || v.trim() === "") return undefined;
    const d = new Date(v);
    if (isNaN(d.getTime())) throw new Error(`Date invalide : ${v}`);
    return d;
  });

export const createPeriodeSchema = z.object({
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
});
