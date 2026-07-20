import z from "zod";

export const createReservationSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(3, "Le titre doit contenir au moins 3 caractères")
      .max(200, "Le titre ne peut pas dépasser 200 caractères"),
    description: z
      .string()
      .trim()
      .max(1000, "La description ne peut pas dépasser 1000 caractères")
      .optional(),
    dateDebut: z.string().datetime("Date de début invalide"),
    dateFin: z.string().datetime("Date de fin invalide"),
    salleId: z.string().uuid("ID de salle invalide"),
  })
  .refine((data) => new Date(data.dateFin) > new Date(data.dateDebut), {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["dateFin"],
  });

export const updateReservationSchema = z
  .object({
    titre: z
      .string()
      .trim()
      .min(3, "Le titre doit contenir au moins 3 caractères")
      .max(200, "Le titre ne peut pas dépasser 200 caractères")
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "La description ne peut pas dépasser 1000 caractères")
      .optional()
      .nullable(),
    dateDebut: z.string().datetime("Date de début invalide").optional(),
    dateFin: z.string().datetime("Date de fin invalide").optional(),
    salleId: z.string().uuid("ID de salle invalide").optional(),
  })
  .refine(
    (data) => {
      if (data.dateDebut && data.dateFin) {
        return new Date(data.dateFin) > new Date(data.dateDebut);
      }
      return true;
    },
    {
      message: "La date de fin doit être après la date de début",
      path: ["dateFin"],
    },
  );

export const approuverReservationSchema = z.object({
  statut: z.enum(["APPROUVEE", "REFUSEE"]),
  motifRefus: z
    .string()
    .trim()
    .min(10, "Le motif de refus doit contenir 10 caractères")
    .optional(),
});

// Types exportés
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type ApprouverReservationInput = z.infer<
  typeof approuverReservationSchema
>;
