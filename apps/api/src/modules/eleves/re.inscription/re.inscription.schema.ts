import { z } from "zod";

// Pour un NOUVEL élève
export const inscriptionSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  classeId: z.string().uuid(),
  schoolId: z.string().uuid().optional(), // Optionnel si fourni par la session de l'admin
  dateNaissance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis")
    .optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
});

// Pour un élève EXISTANT
export const reinscriptionSchema = z.object({
  eleveId: z.string().uuid("ID de l'élève invalide"),
  classeId: z.string().uuid("ID de la classe invalide"),
  schoolId: z.string().uuid().optional(), // Utile si le SUDO_ADMIN le transfère d'école
});
