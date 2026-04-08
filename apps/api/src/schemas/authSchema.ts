import { z } from "zod";
import { Role } from "../generated/prisma/enums";

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.nativeEnum(Role),
  schoolId: z.string().uuid("ID d'école invalide").optional(), // Optionnel pour le SUDO_ADMIN
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
