import z from "zod";

export const statutChapitreEnum = z.enum(["A_FAIRE", "EN_COURS", "FAIT"]);

// Un sous chapitre : "id" est optionnel, absent = nouveau sous-chapitre à créer
export const sousChapitreInputSchema = z.object({
  titre: z.string().min(1, "Le titre du sous-chapitre est requis"),
  ordre: z.number().int().optional(),
  statut: statutChapitreEnum.optional(),
});

export const createChapitreSchema = z.object({
  titre: z.string().min(1, "Le titre du chapitre est requis"),
  matiereId: z.string().min(1, "La matière est requise."),
  ordre: z.number().int().optional(),
  statut: statutChapitreEnum.optional(),
  sousChapitres: z.array(sousChapitreInputSchema).optional(),
});

export const updateChapitreSchema = z.object({
  statut: statutChapitreEnum,
});

export type CreateChapitreInput = z.infer<typeof createChapitreSchema>;
export type UpdateChapitreInput = z.infer<typeof updateChapitreSchema>;
