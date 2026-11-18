import z from "zod";

export const typeSuiviSanteSchema = z.enum([
  "ALLERGIE",
  "VISITE_MEDICALE",
  "SOIN",
  "MALADIE",
  "ACCIDENT",
]);

export const graviteSanteSchema = z.enum([
  "FAIBLE",
  "MODEREE",
  "ELEVEE",
  "URGENTE",
]);

const dateISO = z.iso.date("Date attendu au format AAAA-MM-JJ");

export const suiviSanteParamsSchema = z.object({
  suiviId: z.string().uuid("Identifiant du suivi invalide"),
});

export const eleveSanteParamsSchema = z.object({
  eleveId: z.string().uuid("Identifiant de l'élève invalide"),
});

export const creerSuiviSanteSchema = z
  .object({
    eleveId: z.string().uuid("Identifiant de l'élève invalide"),
    type: typeSuiviSanteSchema,
    titre: z.string().trim().min(2).max(150),
    description: z.string().trim().max(4000).nullable().optional(),
    gravite: graviteSanteSchema.nullable().optional(),
    dateEvenement: dateISO,
    dateFin: dateISO.nullable().optional(),
    notifierParents: z.boolean().optional(),
  })
  .refine((data) => !data.dateFin || data.dateEvenement <= data.dateFin, {
    message:
      "La date de fin doit être postérieure ou égale à la date de l'événement",
    path: ["dateFin"],
  });

export const modifierSuiviSanteSchema = z
  .object({
    titre: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    gravite: graviteSanteSchema.nullable().optional(),
    dateEvenement: dateISO.optional(),
    dateFin: dateISO.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Fournir au moins un champ à modifier",
  });

export const listerSuiviSanteQuerySchema = z
  .object({
    type: typeSuiviSanteSchema.optional(),
    from: dateISO.optional(),
    to: dateISO.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(5),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "La date de début doit précéder la date de fin",
    path: ["to"],
  });

export type CreerSuiviSanteInput = z.infer<typeof creerSuiviSanteSchema>;
export type ModifierSuiviSanteinput = z.infer<typeof modifierSuiviSanteSchema>;
export type ListeSuiviSanteQuery = z.infer<typeof listerSuiviSanteQuerySchema>;
