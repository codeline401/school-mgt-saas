import { z } from "zod";

export const createAppelSchema = z.object({
  creneauId: z.string().uuid("ID de créneau invalide"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide, format attendu : YYYY-MM-DD"),
});

export const updatePresenceSchema = z.object({
  statut: z.enum(["PRESENT", "ABSENT", "RETARD"]),
});
