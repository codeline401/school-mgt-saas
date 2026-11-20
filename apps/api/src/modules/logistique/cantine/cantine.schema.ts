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

const anneeScolaireSchema = z.string().regex(/^\d{4}-\d{4}$/, {
  message: "L'année scolaire doit être au format AAAA-AAAA",
});

export const creerOffreCantineSchema = z.object({
  nom: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).nullable().optional(),
  anneeScolaire: anneeScolaireSchema,
  tarifMensuel: z.coerce.number().finite().min(0), // Le tarif mensuel doit être un nombre positif
  joursSemaine: z.array(jourSemaineSchema).min(1).max(7), // Au moins un jour de la semaine doit être sélectionné
});

export const modiferOffreCantineSchema = z
  .object({
    nom: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    anneeScolaire: anneeScolaireSchema.optional(),
    tarifMensuel: z.coerce.number().finite().min(0).optional(),
    joursSemaine: z.array(jourSemaineSchema).min(1).max(7).optional(),
    actif: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0, // Au moins un champ doit être fourni pour la modification
    {
      message: "Au moins un champ doit être fourni pour la modification",
    },
  );

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
