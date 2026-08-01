import { z } from "zod";

// Schéma de mise à jour de profil d'un ELEVE
// Tous les champs sont optionnels : on met à jour uniquement ce qui est envoyé
export const updateEleveProfilSchema = z.object({
  nom: z.string().trim().min(3).optional(),
  prenom: z.string().trim().min(3).optional(),
  dateNaissance: z.coerce.date().optional(),
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  photoUrl: z
    .string()
    .max(2 * 1024 * 1024, "Photo trop volumineuse (max 2 Mo encodé)")
    .optional(),
  classeId: z.string().uuid("ID de classe invalide").optional(),
  parentId: z.string().uuid("ID de parent invalide").nullable().optional(),
});

// Schéma pour créer un profil de parent (utilisé par l'admin pour créer un compte parent)
export const createParentSchema = z.object({
  nom: z.string().trim().min(2, "Nom requis (min 2 caractères)"),
  prenom: z.string().trim().min(2, "Prénom requis (min 2 caractères)"),
  email: z
    .preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().email("Email invalide"),
    )
    .optional(),
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  // Si fourni, le parent doit être lié à un élève existant (sinon null)
  eleveId: z.string().uuid("ID d'élève invalide").nullable().optional(),
});

// Schéma de mise à jour du profil d'un parent
export const updateParentProfilSchema = z.object({
  nom: z.string().trim().min(3).optional(),
  prenom: z.string().trim().min(3).optional(),
  email: z.string().email("Email invalide").nullable().optional(),
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
});

export const createProfesseurSchema = z.object({
  nom: z.string().trim().min(2, "Nom requis (min 2 caractères)"),
  prenom: z.string().trim().min(2, "Prénom requis (min 2 caractères)"),
  email: z.string().email("Email invalide"),
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  specialites: z.string().trim().optional(), // ex: "Mathématiques, Physique"
  classeIds: z.array(z.string().uuid("ID de classe invalide")).optional(),
  matiereIds: z.array(z.string().uuid("ID de matière invalide")).optional(),
});

// Schéma de mise à jour du profil d'un PROFESSEUR
export const updateProfesseurProfilSchema = z.object({
  nom: z.string().trim().min(3).optional(),
  prenom: z.string().trim().min(3).optional(),
  dateNaissance: z.coerce.date().optional(),
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  photoUrl: z
    .string()
    .max(2 * 1024 * 1024, "Photo trop volumineuse (max 2 Mo encodé)")
    .optional(),
  specialites: z.string().trim().optional(), // ex: "Mathématiques, Physique"
  // liste des IDs de classe à assigner (remplace la liste existante)
  classeIds: z.array(z.string().uuid("ID de classe invalide")).optional(),
});

export type UpdateEleveProfilInput = z.infer<typeof updateEleveProfilSchema>;
export type UpdateParentProfilInput = z.infer<typeof updateParentProfilSchema>;
export type UpdateProfesseurProfilInput = z.infer<
  typeof updateProfesseurProfilSchema
>;
export type CreateParentInput = z.infer<typeof createParentSchema>;
export type CreateProfesseurInput = z.infer<typeof createProfesseurSchema>;
