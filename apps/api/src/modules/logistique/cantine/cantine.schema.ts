import z from "zod";

const jourSemaineSchema = z.enum([
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
]);

const tarifMensuelSchema = z.preprocess(
  (val) => {
    if (
      val === null ||
      typeof val === "boolean" ||
      Array.isArray(val) ||
      (typeof val === "string" && val.trim() === "")
    ) {
      return val; // Laisse z.coerce.number() échouer avec une erreur de validation
    }
    return val;
  },
  z.coerce
    .number({
      error: "Le tarif mensuel doit être un nombre valide",
    })
    .finite()
    .min(0)
    .max(99999999.99, {
      message: "Le tarif mensuel ne peut pas dépasser 99999999.99",
    }),
);

const anneeScolaireSchema = z.string().regex(/^\d{4}-\d{4}$/, {
  message: "L'année scolaire doit être au format AAAA-AAAA",
});

export const creerOffreCantineSchema = z.object({
  nom: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).nullable().optional(),
  anneeScolaire: anneeScolaireSchema,
  tarifMensuel: tarifMensuelSchema,
  joursSemaine: z.array(jourSemaineSchema).min(1).max(7),
});

export const modiferOffreCantineSchema = z
  .object({
    nom: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    anneeScolaire: anneeScolaireSchema.optional(),
    tarifMensuel: tarifMensuelSchema.optional(),
    joursSemaine: z.array(jourSemaineSchema).min(1).max(7).optional(),
    actif: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la modification",
  });

export const offreCantineParamsSchema = z.object({
  offreId: z.string().uuid("Identifiant de l'offre de cantine invalide"),
});

export const offreCantineQuerySchema = z.object({
  anneeScolaire: anneeScolaireSchema.optional(),
  actif: z.enum(["true", "false"]).optional(),
});

export type CreerOffreCantineInput = z.infer<typeof creerOffreCantineSchema>;
export type ModifierOffreCantineInput = z.infer<
  typeof modiferOffreCantineSchema
>;
export type OffresCantineQuery = z.infer<typeof offreCantineQuerySchema>;
