import { z } from "zod";

// Schéma de mise à jour de profil d'un ELEVE
// Tous les champs sont optionnels : on met à jour uniquement ce qui est envoyé
export const updateEleveProfilSchema = z.object({
  nom: z.string().trim().min(3).optional(),
  prenom: z.string().trim().min(3).optional(),
  dateNaissance: z.string().optional(), // on reçoit une string ISO ou une date
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  photoUrl: z.string().url("URL invalide").optional(),
  classeId: z.string().uuid("ID de classe invalide").optional(),
  parentId: z.string().uuid("ID de parent invalide").nullable().optional(),
});

// Schéma de misà jour du profil d'un parent
export const updateParentProfilSchema = z.object({
  nom: z.string().trim().min(3).optional(),
  prenom: z.string().trim().min(3).optional(),
  email: z.string().email("Email invalide").nullable().optional(),
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
});

// Schéma de mise à jour du profil d'un PROFESSEUR
export const updateProfesseurProfilSchema = z.object({
  nom: z.string().trim().min(3).optional(),
  prenom: z.string().trim().min(3).optional(),
  dateNaissance: z.string().optional(), // on reçoit une string ISO ou une date
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  photoUrl: z.string().url("URL invalide").optional(),
  specialites: z.string().trim().optional(), // ex: "Mathématiques, Physique"
  // liste des IDs de classe à assigner (remplace la liste existante)
  classeIds: z.array(z.string().uuid("ID de classe invalide")).optional(),
});

export type UpdateEleveProfilInput = z.infer<typeof updateEleveProfilSchema>;
export type UpdateParentProfilInput = z.infer<typeof updateParentProfilSchema>;
export type UpdateProfesseurProfilInput = z.infer<
  typeof updateProfesseurProfilSchema
>;
