import { z } from "zod";
import { Role } from "../generated/prisma/enums";

// Schema d'inscription pour la validation des données d'inscription et de connexion
export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  nom: z.string().min(3, "Le nom est requis"),
  prenom: z.string().min(3, "Le prénom est requis"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.nativeEnum(Role),

  // Optionnel : uniquement pour USER, PROF, ELEVE, PARENT
  inviteCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
