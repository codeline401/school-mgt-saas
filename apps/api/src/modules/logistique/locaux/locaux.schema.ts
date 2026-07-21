import { z } from "zod";

// ==========================================
// SCHÉMAS POUR LES BÂTIMENTS
// ==========================================

export const createBatimentSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, "Le nom du bâtiment doit contenir au moins 2 caractères")
    .max(100, "Le nom du bâtiment ne peut pas dépasser 100 caractères"),
  code: z
    .string()
    .trim()
    .min(1, "Le code doit contenir au moins 1 caractère")
    .max(20, "Le code ne peut pas dépasser 20 caractères")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional(),
  nbEtages: z
    .number()
    .int("Le nombre d'étages doit être un entier")
    .min(0, "Le bâtiment doit avoir au moins 1 étage")
    .max(100, "Le nombre d'étages ne peut pas dépasser 100")
    .default(1),
});

export const updateBatimentSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, "Le nom du bâtiment doit contenir au moins 2 caractères")
    .max(100, "Le nom du bâtiment ne peut pas dépasser 100 caractères")
    .optional(),
  code: z
    .string()
    .trim()
    .min(1, "Le code doit contenir au moins 1 caractère")
    .max(20, "Le code ne peut pas dépasser 20 caractères")
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  nbEtages: z
    .number()
    .int("Le nombre d'étages doit être un entier")
    .min(1, "Le bâtiment doit avoir au moins 1 étage")
    .max(100, "Le nombre d'étages ne peut pas dépasser 100")
    .optional(),
});

// ==========================================
// SCHÉMAS POUR LES SALLES
// ==========================================

const TypeSalleEnum = z.enum([
  "COURS",
  "LABO_SCIENCE",
  "INFORMATIQUE",
  "AMPHI",
  "REUNION",
  "SPORT",
  "ADMINISTRATIF",
  "AUTRE",
]);

const StatutSalleEnum = z.enum(["DISPONIBLE", "MAINTENANCE", "RESERVEE"]);

export const createSalleSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, "Le nom de la salle doit contenir au moins 2 caractères")
    .max(100, "Le nom de la salle ne peut pas dépasser 100 caractères"),
  code: z
    .string()
    .trim()
    .min(1, "Le code doit contenir au moins 1 caractère")
    .max(20, "Le code ne peut pas dépasser 20 caractères")
    .optional(),
  type: TypeSalleEnum.default("COURS"),
  etage: z
    .number()
    .int("L'étage doit être un entier")
    .min(0, "L'étage ne peut pas être négatif")
    .max(100, "L'étage ne peut pas dépasser 100")
    .default(0),
  capacite: z
    .number()
    .int("La capacité doit être un entier")
    .min(1, "La capacité doit être au moins de 1 personne")
    .max(1000, "La capacité ne peut pas dépasser 1000 personnes"),
  pmrAccessible: z.boolean().default(true),
  equipements: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  statut: StatutSalleEnum.default("DISPONIBLE"),
  batimentId: z.string().uuid("L'identifiant du bâtiment est invalide"),
  classeId: z
    .string()
    .uuid("L'identifiant de la classe est invalide")
    .optional(),
});

export const updateSalleSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, "Le nom de la salle doit contenir au moins 2 caractères")
    .max(100, "Le nom de la salle ne peut pas dépasser 100 caractères")
    .optional(),
  code: z
    .string()
    .trim()
    .min(1, "Le code doit contenir au moins 1 caractère")
    .max(20, "Le code ne peut pas dépasser 20 caractères")
    .optional()
    .nullable(),
  type: TypeSalleEnum.optional(),
  etage: z
    .number()
    .int("L'étage doit être un entier")
    .min(0, "L'étage ne peut pas être négatif")
    .max(100, "L'étage ne peut pas dépasser 100")
    .optional(),
  capacite: z
    .number()
    .int("La capacité doit être un entier")
    .min(1, "La capacité doit être au moins de 1 personne")
    .max(1000, "La capacité ne peut pas dépasser 1000 personnes")
    .optional(),
  pmrAccessible: z.boolean().optional(),
  equipements: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .nullable(),
  statut: StatutSalleEnum.optional(),
  batimentId: z
    .string()
    .uuid("L'identifiant du bâtiment est invalide")
    .optional(),

  classeId: z
    .string()
    .uuid("L'identifiant de la classe est invalide")
    .optional()
    .nullable(),
});

// ==========================================
// TYPES INFÉRÉS
// ==========================================

export type CreateBatimentInput = z.infer<typeof createBatimentSchema>;
export type UpdateBatimentInput = z.infer<typeof updateBatimentSchema>;
export type CreateSalleInput = z.infer<typeof createSalleSchema>;
export type UpdateSalleInput = z.infer<typeof updateSalleSchema>;
