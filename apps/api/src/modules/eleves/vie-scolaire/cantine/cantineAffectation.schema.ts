import z from "zod";

const dateISO = z.iso.date("Date attendue au format AAAA-MM-JJ"); //

export const eleveCantineParamsSchema = z.object({
  eleveId: z.string().uuid("Identifiant de l'affectation invalide"),
});

export const affectationCantineParamsSchema = z.object({
  affectionId: z.string().uuid("Identifiant de l'affectation invalide"),
});

export const creerAffectationCantineSchema = z
  .object({
    eleveId: z.string().uuid("Identifiant de l'élève invalide"),
    offreCantineId: z.string().uuid("Identifiant de l'offre cantine invalide"),
    dateDebut: dateISO,
    dateFin: dateISO.nullable().optional(),
    regimeSpecial: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => !data.dateFin || data.dateDebut <= data.dateFin, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["dateFin"],
  });

export const terminerAffectationCantineSchema = z.object({
  dateFin: dateISO.optional(),
});

export type CreerAffectationCantineInput = z.infer<
  typeof creerAffectationCantineSchema
>;
export type TerminerAffectationCantineInput = z.infer<
  typeof terminerAffectationCantineSchema
>;
