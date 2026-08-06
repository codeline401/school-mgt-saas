import z from "zod";

export const TypeTicketEnum = z.enum([
  "EQUIPEMENT",
  "BATIMENT",
  "SALLE",
  "RESEAU",
  "PLOMBERIE",
  "ELECTRICITE",
  "MOBILIER",
  "AUTRE",
]);

export const PrioriteTicketEnum = z.enum([
  "BASSE",
  "NORMALE",
  "HAUTE",
  "URGENTE",
]);

export const StatutTicketEnum = z.enum([
  "OUVERT",
  "EN_COURS",
  "RESOLU",
  "FERME",
  "ANNULE",
]);

export const TypeLocalisationEnum = z.enum(["SALLE", "BATIMENT", "EQUIPEMENT"]);

export const StatutInterventionEnum = z.enum([
  "PLANIFIEE",
  "EN_COURS",
  "TERMINEE",
  "ANNULEE",
]);

// --- Schema pour les tickets ------------------------------------
export const CreateTicketMaintenanceSchema = z.object({
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  type: TypeTicketEnum.default("AUTRE"),
  priorite: PrioriteTicketEnum.default("NORMALE"),
  localisationId: z.string().optional(),
  typeLocalisation: TypeLocalisationEnum.optional(),
  localisationNom: z.string().optional(),
  assigneAId: z.string().optional(),
});

export const UpdateTicketMaintenanceSchema = z.object({
  titre: z.string().min(3).optional(),
  description: z.string().optional(),
  type: TypeTicketEnum.optional(),
  priorite: PrioriteTicketEnum.optional(),
  statut: StatutTicketEnum.optional(),
  localisationId: z.string().optional(),
  typeLocalisation: TypeLocalisationEnum.optional(),
  localisationNom: z.string().optional(),
  assigneAId: z.string().optional(),
  dateResolution: z.string().datetime().optional(),
});

export const TicketMaintenanceFiltersSchema = z.object({
  statut: StatutTicketEnum.optional(),
  priorite: PrioriteTicketEnum.optional(),
  type: TypeTicketEnum.optional(),
  assigneAId: z.string().optional(),
  search: z.string().optional(),
});

// ─── Schémas pour les interventions ──────────────────────────────

export const CreateInterventionSchema = z.object({
  ticketId: z.string().uuid("ID du ticket invalide"),
  dateDebut: z.string().datetime("Date de début invalide"),
  dateFin: z.string().datetime().optional(),
  technicienId: z.string().uuid("ID du technicien invalide"),
  description: z.string().optional(),
  observations: z.string().optional(),
  cout: z.number().nonnegative().optional(),
  piecesUtilisees: z.string().optional(),
  statut: StatutInterventionEnum.default("PLANIFIEE"),
});

export const UpdateInterventionSchema = z.object({
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  technicienId: z.string().uuid().optional(),
  description: z.string().optional(),
  observations: z.string().optional(),
  statut: StatutInterventionEnum.optional(),
  cout: z.number().nonnegative().optional(),
  piecesUtilisees: z.string().optional(),
});

export type CreateTicketMaintenanceInput = z.infer<
  typeof CreateTicketMaintenanceSchema
>;
export type UpdateTicketMaintenanceInput = z.infer<
  typeof UpdateTicketMaintenanceSchema
>;
export type TicketMaintenanceFilters = z.infer<
  typeof TicketMaintenanceFiltersSchema
>;
export type CreateInterventionInput = z.infer<typeof CreateInterventionSchema>;
export type UpdateInterventionInput = z.infer<typeof UpdateInterventionSchema>;
