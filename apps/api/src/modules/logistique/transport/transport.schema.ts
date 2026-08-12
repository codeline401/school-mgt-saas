import { z } from "zod";

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "La date doit être au format ISO valide.",
  });

// ==========================================
// VEHICULE SCHEMAS
// ==========================================

export const CreateVehiculeSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  immatriculation: z.string().min(1, "Le numéro de plaque est requis"),
  typeVehicule: z.enum(["BUS", "MINIBUS", "VOITURE", "VAN"]),
  capacite: z.number().int().positive("La capacité doit être positive"),
  marque: z.string().optional(),
  modele: z.string().optional(),
  annee: z.number().int().optional(),
  derniereRevision: isoDateString.nullish(),
  prochaineRevision: isoDateString.nullish(),
  kilometrage: z.number().int().nonnegative().optional(),
  numeroAssurance: z.string().optional(),
  dateExpirationAssurance: isoDateString.nullish(),
});

export const UpdateVehiculeSchema = z.object({
  nom: z.string().min(1).optional(),
  immatriculation: z.string().min(1).optional(),
  typeVehicule: z.enum(["BUS", "MINIBUS", "VOITURE", "VAN"]).optional(),
  capacite: z.number().int().positive().optional(),
  marque: z.string().optional(),
  modele: z.string().optional(),
  annee: z.number().int().optional(),
  statut: z.enum(["ACTIF", "MAINTENANCE", "HORS_SERVICE", "VENDU"]).optional(),
  derniereRevision: isoDateString.nullish(),
  prochaineRevision: isoDateString.nullish(),
  kilometrage: z.number().int().nonnegative().optional(),
  numeroAssurance: z.string().optional(),
  dateExpirationAssurance: isoDateString.nullish(),
});

export const VehiculeFiltersSchema = z.object({
  statut: z.enum(["ACTIF", "MAINTENANCE", "HORS_SERVICE", "VENDU"]).optional(),
  typeVehicule: z.enum(["BUS", "MINIBUS", "VOITURE", "VAN"]).optional(),
});

// ==========================================
// CHAUFFEUR SCHEMAS
// ==========================================

export const CreateChauffeurSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  numeroPermis: z.string().min(1, "Le numéro de permis est requis"),
  typePermis: z.string().min(1, "Le type de permis est requis"),
  dateExpirationPermis: isoDateString.nullish(),
  adresse: z.string().optional(),
  dateNaissance: isoDateString.optional(),
  dateEmbauche: isoDateString.optional(),
});

export const UpdateChauffeurSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  telephone: z.string().min(1).optional(),
  numeroPermis: z.string().min(1).optional(),
  typePermis: z.string().min(1).optional(),
  dateExpirationPermis: isoDateString.nullish(),
  statut: z.enum(["ACTIF", "CONGE", "SUSPENDU", "INACTIF"]).optional(),
  adresse: z.string().optional(),
  dateNaissance: isoDateString.optional(),
  dateEmbauche: isoDateString.optional(),
});

export const ChauffeurFiltersSchema = z.object({
  statut: z.enum(["ACTIF", "CONGE", "SUSPENDU", "INACTIF"]).optional(),
});

// ==========================================
// ROUTE SCHEMAS
// ==========================================

export const CreateRouteSchema = z.object({
  nom: z.string().min(1, "Le nom de la route est requis"),
  typeRoute: z.enum(["ALLER", "RETOUR", "ALLER_RETOUR", "SORTIE"]),
  heureDepart: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm requis"),
  heureArrivee: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format HH:mm requis")
    .optional(),
  vehiculeId: z.string().uuid("ID véhicule invalide"),
  chauffeurId: z.string().uuid("ID chauffeur invalide"),
  joursActifs: z.string(), // JSON: ["LUNDI", "MARDI", etc.]
  arrets: z.string().optional(), // JSON: [{nom, heure, ordre}, ...]
});

export const UpdateRouteSchema = z.object({
  nom: z.string().min(1).optional(),
  typeRoute: z.enum(["ALLER", "RETOUR", "ALLER_RETOUR", "SORTIE"]).optional(),
  statut: z.enum(["ACTIVE", "SUSPENDUE", "ANNULEE"]).optional(),
  heureDepart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  heureArrivee: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  vehiculeId: z.string().uuid().optional(),
  chauffeurId: z.string().uuid().optional(),
  joursActifs: z.string().optional(),
  arrets: z.string().optional(),
});

export const RouteFiltersSchema = z.object({
  statut: z.enum(["ACTIVE", "SUSPENDUE", "ANNULEE"]).optional(),
  typeRoute: z.enum(["ALLER", "RETOUR", "ALLER_RETOUR", "SORTIE"]).optional(),
  vehiculeId: z.string().uuid().optional(),
  chauffeurId: z.string().uuid().optional(),
});

// ==========================================
// AFFECTATION SCHEMAS
// ==========================================

export const CreateAffectationSchema = z.object({
  eleveId: z.string().uuid("ID élève invalide"),
  routeId: z.string().uuid("ID route invalide"),
  arretMontee: z.string().optional(),
  arretDescente: z.string().optional(),
  dateDebut: isoDateString.optional(),
  dateFin: isoDateString.optional(),
});

export const UpdateAffectationSchema = z.object({
  routeId: z.string().uuid().optional(),
  arretMontee: z.string().optional(),
  arretDescente: z.string().optional(),
  statut: z.enum(["ACTIVE", "SUSPENDUE", "TERMINEE"]).optional(),
  dateDebut: isoDateString.optional(),
  dateFin: isoDateString.optional(),
});

export const AffectationFiltersSchema = z.object({
  eleveId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  statut: z.enum(["ACTIVE", "SUSPENDUE", "TERMINEE"]).optional(),
});

// Types exportés
export type CreateVehiculeInput = z.infer<typeof CreateVehiculeSchema>;
export type UpdateVehiculeInput = z.infer<typeof UpdateVehiculeSchema>;
export type CreateChauffeurInput = z.infer<typeof CreateChauffeurSchema>;
export type UpdateChauffeurInput = z.infer<typeof UpdateChauffeurSchema>;
export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;
export type CreateAffectationInput = z.infer<typeof CreateAffectationSchema>;
export type UpdateAffectationInput = z.infer<typeof UpdateAffectationSchema>;
