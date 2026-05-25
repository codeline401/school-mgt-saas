import { Request, Response } from "express";
import { ZodError } from "zod"; // Import de ZodError pour la gestion des erreurs de validation
import { prisma } from "../lib/prisma";
import {
  updateEleveProfilSchema,
  updateParentProfilSchema,
  updateProfesseurProfilSchema,
} from "../schemas/profilSchema";

// ===================================================================
// HELPERS
// ===================================================================
/**
 * Vérifier que la ressource demandée appartient à l'école de l'utilisateur
 * le SUDO_ADMIN peut voir toutes les écoles sans restriction
 */
function isAuthorizedForSchool(
  userRole: string,
  userSchoolId: string | null | undefined,
  ressourceSchoolId: string,
): boolean {
  if (userRole === "SUDO_ADMIN") {
    return true;
  }
  return userSchoolId === ressourceSchoolId;
}

// ===================================================================
// ELEVES
// ===================================================================
/**
 * GET /api/profils/eleves/:id
 * Retourne la fiche complète d'un élève:
 * - informations personnelles
 * - classe assignée
 * - parent responsable (si lié)
 * - historique des admissions
 */
export const getElevesProfil = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }; // ID de l'élève à récupérer

    const eleve = await prisma.eleve.findUnique({
      where: { id },
      include: {
        classe: true, // Inclure les infos de la classe
        parent: true, // Inclure les infos du parent responsable
        admissions: {
          orderBy: { createdAt: "desc" }, // Historique des admissions, trié par date décroissante
        },
      },
    });

    if (!eleve) return res.status(404).json({ error: "Élève non trouvé" });

    // Vérification multi-tenant : l'utilisateur ne peut voir que son école
    if (
      !isAuthorizedForSchool(req.user!.role, req.user!.schoolId, eleve.schoolId)
    ) {
      return res.status(403).json({ error: "Accès refusé à cette ressource" });
    }

    res.status(200).json(eleve);
  } catch (err) {
    console.error("Erreur lors de la récupération du profil de l'élève :", err);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération du profil de l'élève",
    });
  }
};

/**
 * PUT /api/profils/eleves/:id
 * Met à jour la fiche d'un élève.
 * Seuls les champs envoyés sont modifiés (patch partiels)
 */
export const updateElevesProfil = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }; // ID de l'élève à mettre à jour
    const validateData = updateEleveProfilSchema.parse(req.body); // Validation des données d'entrée

    // Récupérer l'élève pour vérifier l'appartenance à l'école
    const existingEleve = await prisma.eleve.findUnique({ where: { id } });

    if (!existingEleve)
      return res.status(404).json({ error: "Élève non trouvé" });
    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingEleve.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé à cette ressource" });
    }

    // Si un nouveau classeId est fourni, vérifier qu'il appartient à la même école
    if (validateData.classeId) {
      const classe = await prisma.classe.findUnique({
        where: { id: validateData.classeId },
      });
      if (!classe || classe.schoolId !== existingEleve.schoolId) {
        return res.status(400).json({
          error:
            "La classe spécifiée est invalide ou n'appartient pas à votre école",
        });
      }
    }

    // Si un parentId est fourni, vérifier qu'il appartient à la même école
    if (validateData.parentId) {
      const parent = await prisma.parent.findUnique({
        where: { id: validateData.parentId },
      });
      if (!parent || parent.schoolId !== existingEleve.schoolId) {
        return res.status(400).json({
          error:
            "Le parent spécifié est invalide ou n'appartient pas à votre école",
        });
      }
    }

    // extraire classeId et parentId pour les traiter séparément du reste
    const { classeId, parentId, ...otherData } = validateData;

    const updateData: any = { ...otherData };
    if (classeId !== undefined) updateData.classeId = classeId;
    if (parentId !== undefined) updateData.parentId = parentId;

    const updatedEleve = await prisma.eleve.update({
      where: { id },
      data: updateData,
      include: {
        classe: true,
        parent: true,
      },
    });

    res.status(200).json(updatedEleve);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error(
      "Erreur lors de la mise à jour du profil de l'élève :",
      error,
    );
    res.status(500).json({
      error: "Erreur serveur lors de la mise à jour du profil de l'élève",
    });
  }
};

// ===================================================================
// PARENTS
// ===================================================================
/**
 * GET /api/profils/parents/:id
 * Retourne la fiche complète d'un parent avec la liste de ses enfants
 */
export const getParentProfil = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        eleves: {
          // enfant inscrits dans l'école
          include: { classe: true }, // avec leur classe respectif
        },
      },
    });

    if (!parent) return res.status(404).json({ error: "Parent introuvable" });
    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        parent.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    res.status(200).json(parent);
  } catch (err) {
    console.error("Erreur getParentProfil :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * PUT /api/profils/parents/:id
 * Met à jour les coordonée d'un parent
 */
export const updateParentProfil = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const validatedData = updateParentProfilSchema.parse(req.body);

    const existingParent = await prisma.parent.findUnique({
      where: { id },
    });
    if (!existingParent)
      return res.status(404).json({ error: "Parent introuvable" });
    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingParent.schoolId,
      )
    ) {
      return res
        .status(403)
        .json({ error: "Accès refusé pour faire la modification" });
    }

    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined),
    );

    const updatedParent = await prisma.parent.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedParent);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur lors de la mis à jour du profil Parent:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ==================================================================
// PROFESSEURS
// ==================================================================

/**
 * GET /api/profils/professeurs/:id
 * Retourne la fiche complète d'un professeur
 *  - informations personnelles
 *  - classes assignées
 *  - contrat actif
 *  - historique des remplacements assurés
 */
export const getProfesseurProfil = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const professeur = await prisma.professeur.findUnique({
      where: { id },
      include: {
        classes: true, // classes assignées
        matieres: { select: { id: true, nom: true } }, // matières enseignées
        contrat: {
          // tous les contrats (CDI, CDD, ...)
          orderBy: { dateDebut: "desc" },
        },
        remplacements: {
          // Absences / remplacements dont il était l'absent
          orderBy: { date: "desc" },
          take: 20, // Limiter à 20 derniers entrées
        },
      },
    });

    if (!professeur) {
      return res.status(404).json({ error: "Professeur introuvable" });
    }
    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        professeur.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès réfusé" });
    }

    res.status(200).json(professeur);
  } catch (err) {
    console.error("Erreur getProfesseurProfil:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * PUT /api/profils/professeur/:id
 * Met à jour la fiche d'un professeur
 * Si classeIds est fourni, la liste des classes est remplacé entièrement
 */
export const updateProfesseurProfil = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const validatedData = updateProfesseurProfilSchema.parse(req.body);

    const existingProfesseur = await prisma.professeur.findUnique({
      where: { id },
    });
    if (!existingProfesseur) {
      return res.status(404).json({ error: "Professeur introuvable" });
    }

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingProfesseur.schoolId,
      )
    ) {
      return res
        .status(403)
        .json({ error: "Accès refusé pour faire la modification" });
    }

    const { classeIds, ...restData } = validatedData;

    const updateData: any = Object.fromEntries(
      // ne mettre à jour que les champs qui sont définis dans la requête
      Object.entries(restData).filter(([, value]) => value !== undefined),
    );
    if (classeIds !== undefined) {
      const uniqueClasseIds = [...new Set(classeIds)];
      // Vérifier que tous les classeIds appartiennent à l'école du professeur
      const classesValides = await prisma.classe.findMany({
        where: {
          id: { in: uniqueClasseIds },
          schoolId: existingProfesseur.schoolId,
        },
        select: { id: true },
      });
      if (classesValides.length !== uniqueClasseIds.length) {
        return res.status(400).json({
          error:
            "Un ou plusieurs IDs de classe sont invalides ou n'appartiennent pas à votre école",
        });
      }
      // Si classeIds est fourni, on remplace entièrement la liste des classes assignées
      updateData.classes = { set: uniqueClasseIds.map((cid) => ({ id: cid })) }; // set remplace toute la relation par les nouveaux IDs fournis
    }

    const updatedProfesseur = await prisma.professeur.update({
      where: { id },
      data: updateData,
    });
    res.status(200).json(updatedProfesseur);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur lors de la mis à jour du profil Professeur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ===================================================================
// PROFIL DU PROFESSEUR CONNECTÉ
// ===================================================================
/**
 * GET /api/profils/me
 * Retourne le profil Professeur de l'utilisateur connecté (rôle PROF uniquement).
 * Inclut la liste des matières enseignées (id + nom).
 */
export const getMyProfProfil = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const prof = await prisma.professeur.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        schoolId: true,
        matieres: { select: { id: true, nom: true } },
        classes: { select: { id: true, nom: true } },
      },
    });

    if (!prof) {
      return res.status(404).json({ error: "Profil professeur introuvable." });
    }

    res.status(200).json(prof);
  } catch (err) {
    console.error("Erreur getMyProfProfil:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
