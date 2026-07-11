import { z } from "zod";

export const reinscriptionSchema = z.object({
  eleveId: z.string().uuid("L'identifiant de l'élève est invalide."),
  classeId: z.string().uuid("L'identifiant de la classe est invalide."),
  schoolId: z
    .string()
    .uuid("L'identifiant de l'école est invalide.")
    .optional(),
  // [REVIEW FIX] : Ajout d'une vérification stricte du calendrier réel via .refine() sur la chaîne au format YYYY-MM-DD
  dateNaissance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Le format de la date doit être AAAA-MM-JJ.")
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.toISOString().startsWith(val);
      },
      {
        message:
          "La date de naissance fournie est une date de calendrier invalide.",
      },
    ),
});

export const inscriptionSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
  classeId: z.string().uuid("L'identifiant de la classe est invalide."),
  dateNaissance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Le format de la date doit être AAAA-MM-JJ.")
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.toISOString().startsWith(val);
      },
      {
        message:
          "La date de naissance fournie est une date de calendrier invalide.",
      },
    ),
});
