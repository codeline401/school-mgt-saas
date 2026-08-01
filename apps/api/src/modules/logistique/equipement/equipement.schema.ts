import z from "zod";

// Enumérations
export const CategorieEquipementEnum = z.enum([
  "AUDIOVISUEL",
  "INFORMATIQUE",
  "SPORT",
  "LABORATOIRE",
  "MOBILIER",
  "OUTILLAGE",
  "AUTRE",
]);

export const EtatEquipementEnum = z.enum([
  "NEUF",
  "BON",
  "MOYEN",
  "MAUVAIS",
  "HORS_SERVICE",
]);

export const TypeEmprunteurEnum = z.enum([
  "PROF",
  "ELEVE",
  "PERSONNEL",
  "EXTERNE",
]);

export const StatutPretEnum = z.enum([
  "EN_COURS",
  "RETOURNE",
  "EN_RETARD",
  "PERDU",
]);

// Schéme pour Equipement
export const CreateEquipementSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(200),
  reference: z.string().max(100).optional(),
  numeroSerie: z.string().max(100).optional(),
  categorie: CategorieEquipementEnum,
  etat: EtatEquipementEnum.default("BON"),
  description: z.string().max(1000).optional(),
  valeur: z.number().min(0).optional(),
  dateAcquisition: z.string().datetime().optional(),
  emplacement: z.string().max(200).optional(),
});

export type CreateEquipementInput = z.infer<typeof CreateEquipementSchema>;

export const UpdateEquipementSchema = CreateEquipementSchema.partial();

export type UpdateEquipementInput = z.infer<typeof UpdateEquipementSchema>;

// Schéma pour Prêt
export const CreatePretSchema = z.object({
  equipementId: z.string().uuid(),
  emprunteurType: TypeEmprunteurEnum,
  emprunteurNom: z.string().min(1, "Le nom de l'emprunteur est requis"),
  emprunteurId: z.string().uuid().optional(),
  datePret: z.string().datetime(),
  dateRetourPrevue: z.string().datetime(),
  motif: z.string().max(500).optional(),
  observations: z.string().max(1000).optional(),
});

export type CreatePretInput = z.infer<typeof CreatePretSchema>;

export const RetourEquipementSchema = z.object({
  dateRetourEffective: z.string().datetime(),
  etatRetour: EtatEquipementEnum,
  observations: z.string().max(1000).optional(),
});

export type RetourEquipementInput = z.infer<typeof RetourEquipementSchema>;

// Filtres
export const EquipementFiltersSchema = z.object({
  categorie: CategorieEquipementEnum.optional(),
  etat: EtatEquipementEnum.optional(),
  disponible: z.boolean().optional(),
  search: z.string().optional(),
});

export type EquipementFilters = z.infer<typeof EquipementFiltersSchema>;
