import { z } from "zod";

// ==========================================
// SORTIE SCOLAIRE SCHEMAS
// ==========================================

export const CreateSortieSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  type: z.enum([
    "PEDAGOGIQUE",
    "SPORTIVE",
    "CULTURELLE",
    "EXCURSION",
    "VOYAGE",
    "AUTRE",
  ]),
  dateDebut: z.string(),
  dateFin: z.string(),
  lieu: z.string().min(1, "Le lieu est requis"),
  adresseLieu: z.string().optional(),
  classeId: z.string().uuid().optional(),
  coutParEleve: z.number().nonnegative().optional(),
  budgetTotal: z.number().nonnegative().optional(),
  moyenTransport: z.string().optional(),
  equipementRequis: z.string().optional(),
  consignes: z.string().optional(),
  dateLimiteInscription: z.string().optional(),
  dateLimiteAutorisation: z.string().optional(),
});

export const UpdateSortieSchema = z.object({
  titre: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z
    .enum([
      "PEDAGOGIQUE",
      "SPORTIVE",
      "CULTURELLE",
      "EXCURSION",
      "VOYAGE",
      "AUTRE",
    ])
    .optional(),
  statut: z
    .enum(["PLANIFIEE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE"])
    .optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  lieu: z.string().min(1).optional(),
  adresseLieu: z.string().optional(),
  classeId: z.string().uuid().optional(),
  coutParEleve: z.number().nonnegative().optional(),
  budgetTotal: z.number().nonnegative().optional(),
  moyenTransport: z.string().optional(),
  equipementRequis: z.string().optional(),
  consignes: z.string().optional(),
  dateLimiteInscription: z.string().optional(),
  dateLimiteAutorisation: z.string().optional(),
});

export const SortieFiltersSchema = z.object({
  statut: z
    .enum(["PLANIFIEE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE"])
    .optional(),
  type: z
    .enum([
      "PEDAGOGIQUE",
      "SPORTIVE",
      "CULTURELLE",
      "EXCURSION",
      "VOYAGE",
      "AUTRE",
    ])
    .optional(),
  classeId: z.string().uuid().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
});

// ==========================================
// PARTICIPANT SCHEMAS
// ==========================================

export const CreateParticipantSchema = z.object({
  sortieId: z.string().uuid(),
  typeParticipant: z.enum(["ELEVE", "ACCOMPAGNATEUR"]),
  eleveId: z.string().uuid().optional(),
  accompagnateurId: z.string().uuid().optional(),
  observations: z.string().optional(),
});

export const UpdateParticipantSchema = z.object({
  statut: z
    .enum(["INSCRIT", "CONFIRME", "ANNULE", "ABSENT", "PRESENT"])
    .optional(),
  montantPaye: z.number().nonnegative().optional(),
  datePaiement: z.string().optional(),
  observations: z.string().optional(),
});

// ==========================================
// AUTORISATION SCHEMAS
// ==========================================

export const CreateAutorisationSchema = z.object({
  sortieId: z.string().uuid(),
  eleveId: z.string().uuid(),
  parentId: z.string().uuid(),
  autorise: z.boolean(),
  observations: z.string().optional(),
  contactUrgence: z.string().optional(),
  telUrgence: z.string().optional(),
  signatureUrl: z.string().optional(),
});

export const UpdateAutorisationSchema = z.object({
  autorise: z.boolean().optional(),
  observations: z.string().optional(),
  contactUrgence: z.string().optional(),
  telUrgence: z.string().optional(),
  signatureUrl: z.string().optional(),
});

// Types exportés
export type CreateSortieInput = z.infer<typeof CreateSortieSchema>;
export type UpdateSortieInput = z.infer<typeof UpdateSortieSchema>;
export type CreateParticipantInput = z.infer<typeof CreateParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof UpdateParticipantSchema>;
export type CreateAutorisationInput = z.infer<typeof CreateAutorisationSchema>;
export type UpdateAutorisationInput = z.infer<typeof UpdateAutorisationSchema>;
