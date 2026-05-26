import { Request, Response } from "express";
import { ZodError } from "zod"; // Import de ZodError pour la gestion des erreurs de validation
import { prisma } from "../lib/prisma";
import {
  createParentSchema,
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
 * POST /api/profils/parents
 * Crée un parent et le lie optionnellement à un élève existant (si eleveId fourni).
 * schoolId est toujours dérivé de la session (anti-spoofing).
 * @param req
 * @param res
 * @returns
 */
export const createParent = async (req: Request, res: Response) => {
  try {
    const { role, schoolId } = req.user!; // Récupérer le rôle et l'école de l'utilisateur connecté

    if (role !== "SUDO_ADMIN" && role !== "ADMIN") {
      return res.status(403).json({
        error:
          "Accès refusé. Seuls les administrateurs peuvent créer des parents.",
      });
    }
    if (!schoolId) {
      return res.status(400).json({
        error:
          "L'utilisateur doit être associé à une école pour créer un parent.",
      });
    }

    const validatedData = createParentSchema.parse(req.body); // Validation des données d'entrée

    // Vérifier que l'élève appartient à la même école
    if (validatedData.eleveId) {
      const eleve = await prisma.eleve.findUnique({
        where: { id: validatedData.eleveId },
      });
      if (!eleve || eleve.schoolId !== schoolId) {
        return res.status(400).json({
          error:
            "L'élève spécifié est invalide ou n'appartient pas à votre école",
        });
      }
    }

    // Création du parent et liaison à l'élève dans une transaction atomique :
    // si l'update de l'élève échoue, la création du parent est annulée.
    const newParent = await prisma.$transaction(async (tx) => {
      const parent = await tx.parent.create({
        data: {
          nom: validatedData.nom,
          prenom: validatedData.prenom,
          schoolId,
          ...(validatedData.email ? { email: validatedData.email } : {}),
          ...(validatedData.telephone
            ? { telephone: validatedData.telephone }
            : {}),
          ...(validatedData.adresse ? { adresse: validatedData.adresse } : {}),
        },
      });

      if (validatedData.eleveId) {
        await tx.eleve.update({
          where: { id: validatedData.eleveId },
          data: { parentId: parent.id },
        });
      }

      return parent;
    });

    return res.status(201).json(newParent);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur lors de la création du parent :", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la création du parent" });
  }
};

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
        matieres: { select: { id: true, nom: true, classeId: true } }, // matières enseignées
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
    // PROF ne peut consulter que son propre profil
    if (req.user!.role === "PROF" && professeur.userId !== req.user!.id) {
      return res.status(403).json({ error: "Accès refusé." });
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

// ===================================================================
// EMPLOI DU TEMPS D'UN PROFESSEUR
// ===================================================================
const JOURS_ORDER: Record<string, number> = {
  LUNDI: 0,
  MARDI: 1,
  MERCREDI: 2,
  JEUDI: 3,
  VENDREDI: 4,
  SAMEDI: 5,
  DIMANCHE: 6,
};

/**
 * GET /api/profils/profs/:id/emploi-du-temps
 * Retourne tous les créneaux horaires liés aux matières enseignées par ce professeur,
 * toutes classes confondues (emploi du temps personnel fusionné).
 * Chaque créneau inclut la matière et la classe pour affichage.
 */
export const getProfEmploiDuTemps = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const user = req.user!;

    // Récupérer le prof avec ses matières
    const prof = await prisma.professeur.findUnique({
      where: { id },
      select: {
        schoolId: true,
        userId: true,
        matieres: { select: { id: true } },
      },
    });

    if (!prof)
      return res.status(404).json({ error: "Professeur introuvable." });

    // PROF ne peut consulter que son propre emploi du temps
    if (user.role === "PROF" && prof.userId !== user.id) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (!isAuthorizedForSchool(user.role, user.schoolId, prof.schoolId)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const matiereIds = prof.matieres.map((m) => m.id);

    if (matiereIds.length === 0) {
      return res.status(200).json([]);
    }

    const creneaux = await prisma.creneauHoraire.findMany({
      where: { matiereId: { in: matiereIds } },
      include: {
        matiere: { select: { id: true, nom: true } },
        classe: { select: { id: true, nom: true } },
      },
    });

    // Trier par jour puis par heure de début
    creneaux.sort((a, b) => {
      const jourDiff = (JOURS_ORDER[a.jour] ?? 0) - (JOURS_ORDER[b.jour] ?? 0);
      if (jourDiff !== 0) return jourDiff;
      return a.heureDebut.localeCompare(b.heureDebut);
    });

    res.status(200).json(creneaux);
  } catch (err) {
    console.error("Erreur getProfEmploiDuTemps:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};
