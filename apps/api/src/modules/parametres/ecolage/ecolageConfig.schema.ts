import z from "zod";

export const classeParamsSchema = z.object({
  classeId: z.string().uuid("ID classe invalide"),
});

export const anneeScolaireQuerySchema = z.object({
  anneeScolaire: z
    .string()
    .regex(
      /^\d{4}-\d{4}$/,
      "Année scolaire invalide, format attendu : AAAA-AAAA",
    ),
});

const moisEcheanceSchema = z.object({
  mois: z.number().int().min(1).max(12),
  // Si absent, le montant mensuel par défaut de la configuration est utilisé
  montant: z.coerce
    .number()
    .positive("Le montant doit être positif")
    .optional(),
});

export const upsertEcolageConfigSchema = z
  .object({
    anneeScolaire: z
      .string()
      .regex(
        /^\d{4}-\d{4}$/,
        "Année scolaire invalide, format attendu : AAAA-AAAA",
      ),
    montantMensuel: z.coerce.number().positive("Le montant doit être positif"),
    jourEcheance: z.number().int().min(1).max(31).default(10),
    penaliteRetard: z.coerce.number().nonnegative().nullish(),
    mois: z
      .array(moisEcheanceSchema)
      .min(1, "Sélectionnez au moins un mois à facturer"),
  })
  .refine(
    (data) => new Set(data.mois.map((m) => m.mois)).size === data.mois.length,
    {
      message: "Un même mois ne peut être configuré qu'une seule fois",
      path: ["mois"],
    },
  );

export const genererEcolagesSchema = z.object({
  anneeScolaire: z
    .string()
    .regex(
      /^\d{4}-\d{4}$/,
      "Année scolaire invalide, format attendu : AAAA-AAAA",
    ),
});

export const ecolageConfigResponseSchema = z.object({
  id: z.string().uuid(),
  classeId: z.string().uuid(),
  anneeScolaire: z.string(),
  montantMensuel: z.number().int(),
  jourEcheance: z.number().int(),
  penaliteRetard: z.string().nullable(),
  echeances: z.array(
    z.object({
      id: z.string().uuid(),
      mois: z.number().int(),
      montant: z.string(),
      dateEcheance: z.string().datetime(),
    }),
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UpsertEcolageConfigInput = z.infer<
  typeof upsertEcolageConfigSchema
>;
export type GenererEcolagesInput = z.infer<typeof genererEcolagesSchema>;
export type EcolageConfigResponse = z.infer<typeof ecolageConfigResponseSchema>;
