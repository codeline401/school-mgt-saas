import z from "zod";

export const typeSanctionSchema = z.enum([
  "AVERTISSEMENT",
  "BLAME",
  "RETENUE",
  "EXCLUSION_TEMPORAIRE",
  "CONVOCATION_PARENT",
  "AUTRE",
]);

export const statutSanctionSchema = z.enum(["EN_COURS", "TERMINEE", "ANNULEE"]);

const dateISO = z.iso.date("Date attendue au format AAAA-MM-JJ");

export const creerSanctionSchema = z.object({
  eleveId: z.string().uuid(),
  type: typeSanctionSchema,
  motif: z.string().trim().min(5).max(2000),
  details: z.string().trim().max(2000).optional(),
  dateSanction: dateISO,
  dateFin: dateISO.nullable().optional(),
});

export const modifierSanctionSchema = creerSanctionSchema
  .omit({ eleveId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Fournir au moins un champ à modifier",
  });

export const statutSanctionInputSchema = z.object({
  statut: statutSanctionSchema,
});

export const sanctionParamsSchema = z.object({
  sanctionId: z.string().uuid(),
});

export const listeSanctionsQuerySchema = z.object({
  eleveId: z.string().uuid().optional(),
  classeId: z.string().uuid().optional(),
  type: typeSanctionSchema.optional(),
  statut: statutSanctionSchema.optional(),
  from: dateISO.optional(),
  to: dateISO.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreerSanctionInput = z.infer<typeof creerSanctionSchema>;
export type ModifierSanctionInput = z.infer<typeof modifierSanctionSchema>;
export type ListeSanctionQuery = z.infer<typeof listeSanctionsQuerySchema>;
