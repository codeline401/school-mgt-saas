import z from "zod";
import { TypeAffectation } from "../../../../generated/prisma/enums.js";

// -------------------------------------------
// NIVEAU
// -------------------------------------------

export const createNiveauSchema = z.object({
  nom: z.string().min(1, "Le nom du niveau est requis"),
  ordre: z.number().int().optional(),
});
export type CreateNiveauInput = z.infer<typeof createNiveauSchema>;

export const updateNiveauSchema = createNiveauSchema.partial();
export type UpdateNiveauInput = z.infer<typeof updateNiveauSchema>;

// -------------------------------------------
// SECTION
// -------------------------------------------
export const createSectionSchema = z.object({
  nom: z.string().min(1, "Le nom de la section est requis"),
  niveauId: z.string().uuid().optional(),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = createSectionSchema.partial();
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// -------------------------------------------
// OPTIONS
// -------------------------------------------
export const createOptionSchema = z.object({
  nom: z.string().min(1, "Le nom de l'option est requis"),
});
export type CreateOptionInput = z.infer<typeof createOptionSchema>;

export const updateOptionSchema = createOptionSchema.partial();
export type UpdateOptionInput = z.infer<typeof updateOptionSchema>;

// -------------------------------------------
// STRUCTURE DE CLASSE (niveau / section / option)
// -------------------------------------------
export const assignClasseStrtuctureSchema = z.object({
  niveauId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
  optionId: z.string().uuid().optional().nullable(),
});
export type AssignClasseStructureInput = z.infer<
  typeof assignClasseStrtuctureSchema
>;

// -------------------------------------------
// AFFECTATION CLASSE(inscription / transfert / promotion / etc.)
// -------------------------------------------
export const createAffectationSchema = z
  .object({
    eleveId: z.string().uuid(),
    nouvelleClasseId: z.string().uuid().optional().nullable(),
    type: z.nativeEnum(TypeAffectation),
    motif: z.string().optional(),
    anneeScolaire: z.string().min(1, "L'année scolaire est requise"),
  })
  .refine(
    (data) => data.type === TypeAffectation.RETRAIT || data.nouvelleClasseId,
    {
      message:
        "Une classe de destination est requise pour ce type d'affectation",
      path: ["nouvelleClasseId"],
    },
  );
export type CreateAffectationInput = z.infer<typeof createAffectationSchema>;
