import z from "zod";
import { TypeResponsable } from "../../../../generated/prisma/enums.js";

export const typeResponsableEnum = z.enum([
  TypeResponsable.PARENT,
  TypeResponsable.TUTEUR,
]);

// Un responsable est créé avec au moins un élève à affilier
export const createResponsableSchema = z.object({
  nom: z
    .string()
    .min(1, "Le nom est requis")
    .trim()
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  prenom: z
    .string()
    .min(1, "Le prénom est requis")
    .trim()
    .max(100, "Le prénom ne peut pas dépasser 100 caractères"),
  type: typeResponsableEnum.default("PARENT"),
  email: z.string().trim().email("Email invalide").nullish(),
  telephone: z.string().trim().max(30).nullish(),
  adresse: z.string().trim().max(250).nullish(),
  eleveIds: z
    .array(z.string().uuid("ID élève invalide"))
    .min(1, "Au moins un élève doit être associé au responsable"),
});

export const updateResponsableSchema = createResponsableSchema
  .omit({ eleveIds: true })
  .partial();

export const affilierEleveSchema = z.object({
  eleveIds: z
    .array(z.string().uuid("ID élève invalide"))
    .min(1, "Au moins un élève doit être associé au responsable"),
});

export type CreateResponsableInput = z.infer<typeof createResponsableSchema>;
export type UpdateResponsableInput = z.infer<typeof updateResponsableSchema>;
export type AffilierEleveInput = z.infer<typeof affilierEleveSchema>;
