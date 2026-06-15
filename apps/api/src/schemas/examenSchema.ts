import z from "zod";
import { ExamenStatut } from "../generated/prisma/enums.js";

export const createExamenSalleSchema = z.object({
  nom: z.string().trim().min(1, "Le nom de la salle est requis"),
  capacite: z.coerce.number().int().positive().optional(),
  location: z.string().trim().optional(),
});

export const createExamenSessionSchema = z
  .object({
    titre: z.string().trim().min(1, "Le titre de l'examen est requis"),
    description: z.string().trim().optional(),
    matiereId: z.string().uuid("Matiere invalide").optional(),
    salleId: z.string().uuid("Salle invalide").optional(),
    dateExamen: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format YYYY-MM-DD"),
    heureDebut: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "L'heure de début doit être au format HH:mm"),
    heureFin: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "L'heure de fin doit être au format HH:mm"),
    surveillantUserIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => data.heureDebut < data.heureFin, {
    message: "L'heure de fin doit être postérieure à l'heure de début",
    path: ["heureFin"],
  });

export const updateExamenSessionSchema = createExamenSessionSchema.partial();

export const createExamenPlanningSchema = z.object({
  titre: z.string().trim().min(1, "Le titre de la session est requis"),
  description: z.string().trim().optional(),
  dateDebut: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La date de début doit être au format YYYY-MM-DD",
    ),
  dateFin: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La date de fin doit être au format YYYY-MM-DD",
    ),
  epreuves: z
    .array(
      z.object({
        dateExamen: z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "La date doit être au format YYYY-MM-DD",
          ),
        matiereId: z.string().uuid("Matière invalide"),
        salleId: z.string().uuid("Salle invalide"),
        heureDebut: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "L'heure de début doit être au format HH:mm"),
        heureFin: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "L'heure de fin doit être au format HH:mm"),
        surveillantUserIds: z
          .array(z.string().uuid("ID surveillant invalide"))
          .min(1, "Au moins un surveillant est requis"),
      }),
    )
    .min(1, "Au moins une épreuve est requise"),
});

export const assignSurveillantSchema = z.object({
  assignations: z
    .array(
      z.object({
        userId: z.string().uuid("ID de surveillant invalide"),
        roleLabel: z.string().trim().optional(), // Label de rôle optionnel pour information, pas utilisé pour la validation côté serveur
      }),
    )
    .min(1, "Au moins un surveillant doit être assigné"),
});

export const createExamenIncidentSchema = z.object({
  type: z.string().trim().min(1, "Le type d'incident est requis"),
  message: z.string().trim().min(1, "Le message de l'incident est requis"),
});

export const updateExamenStatutSchema = z.object({
  statut: z.nativeEnum(ExamenStatut),
});
