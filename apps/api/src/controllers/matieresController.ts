import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  createMatieresSchema,
  updateMatieresSchema,
} from "../schemas/matieresSchema";
import { registry, ZodError } from "zod";

// HELPERS
function isAuthorizhedForSchool(
  userRole: string,
  userSchoolId: string | null | undefined,
  ressourceSchoolId: string,
): boolean {
  if (userRole === "SUDO_ADMIN") return true; // SUDO_ADMIN peut accéder à toutes les ressources
  return userSchoolId === ressourceSchoolId;
}

/**
 * GET /api/classes/:classeId/matieres
 * Récupère les matières d'une classe spécifique.
 * Seuls les utilisateurs rattachés à l'école de la classe ou les SUDO_ADMIN peuvent accéder à cette ressource.
 */
export const getClasseMatieres = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // Récupère l'ID de la classe depuis les paramètres de l'URL

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // Récupère la classe depuis la base de données

    if (!classe) return res.status(404).json({ error: "Classe non trouvée." }); // Si la classe n'existe pas, retourne une erreur 404

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({
        error:
          "Vous n'êtes pas autorisé à accéder aux matières de cette classe.",
      }); // Si l'utilisateur n'est pas autorisé, retourne une erreur 403
    }

    const matieres = await prisma.matiere.findMany({
      where: { classeId },
      orderBy: { nom: "desc" }, // Trie les matières par nom dans l'ordre décroissant
    });

    // Un PROF ne voit que les matières qu'il enseigne dans cette classe
    if (req.user!.role === "PROF") {
      const professeur = await prisma.professeur.findUnique({
        where: { userId: req.user!.id },
        select: { matieres: { where: { classeId }, select: { id: true } } },
      });
      const profMatiereIds = new Set(
        (professeur?.matieres ?? []).map((m) => m.id),
      );
      return res
        .status(200)
        .json(matieres.filter((m) => profMatiereIds.has(m.id)));
    }

    res.status(200).json(matieres); // Retourne la liste des matières avec un statut 200
  } catch (err) {
    console.error("Erreur lors de la récupération des matières :", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // Si une erreur survient, retourne une erreur 500
  }
};

/**
 * POST /api/classes/:classeId/matieres
 * Crée une nouvelle matière pour une classe spécifique.
 * Seuls les utilisateurs rattachés à l'école de la classe ou les SUDO_ADMIN peuvent accéder à cette ressource.
 */
export const createClasseMatiere = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // Récupère l'ID de la classe depuis les paramètres de l'URL
    const validatedData = createMatieresSchema.parse(req.body); // Valide les données de la requête avec Zod

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // Récupère la classe depuis la base de données

    if (!classe) return res.status(404).json({ error: "Classe non trouvée." }); // Si la classe n'existe pas, retourne une erreur 404

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({
        error:
          "Vous n'êtes pas autorisé à créer une matière pour cette classe.",
      }); // Si l'utilisateur n'est pas autorisé, retourne une erreur 403
    }

    // Vérifier si une matière avec le même nom existe déjà pour cette classe
    const existingMatiere = await prisma.matiere.findUnique({
      where: {
        classeId_nom: {
          classeId,
          nom: validatedData.nom,
        },
      },
    });

    if (existingMatiere) {
      return res.status(409).json({
        error: `Une matière avec le nom '${validatedData.nom}' existe déjà pour cette classe.`,
      });
    }

    const newMatiere = await prisma.matiere.create({
      data: {
        nom: validatedData.nom,
        ...(validatedData.description !== undefined // Si une description est fournie, l'inclure dans les données de création
          ? { description: validatedData.description }
          : {}),
        classeId, // Associe la matière à la classe
        schoolId: classe.schoolId, // Associe la matière à l'école de la classe
      },
    });

    res.status(201).json(newMatiere); // Retourne la matière créée avec un statut 201
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues }); // Si les données ne sont pas valides, retourne une erreur 400 avec les messages d'erreur de Zod
    }
    console.error("Erreur lors de la création de la matière :", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // Si une erreur survient, retourne une erreur 500
  }
};

/**
 * PUT /api/classes/:classeId/matieres/:matiereId
 * Met à jour une matière spécifique d'une classe.
 * Seuls les utilisateurs rattachés à l'école de la classe ou les SUDO_ADMIN peuvent accéder à cette ressource.
 * Seuls les champs envoyés dans le corps de la requête sont mis à jour.
 */
export const updateClasseMatiere = async (req: Request, res: Response) => {
  try {
    const { classeId, matiereId } = {
      classeId: req.params.classeId,
      matiereId: req.params.matiereId || req.params.id, // Fallback pour utiliser `id` si `matiereId` est manquant
    }; // Récupère les IDs de la classe et de la matière depuis les paramètres de l'URL
    const validatedData = updateMatieresSchema.parse(req.body); // Valide les données de la requête avec Zod

    const matiere = await prisma.matiere.findFirst({
      where: { id: matiereId as string, classeId: classeId as string },
    }); // Récupère la matière en vérifiant qu'elle appartient bien à la classe

    if (!matiere)
      return res.status(404).json({ error: "Matière non trouvée." }); // Si la matière n'existe pas ou n'appartient pas à la classe, retourne une erreur 404

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        matiere.schoolId,
      )
    ) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes pas autorisé à modifier cette matière." }); // Si l'utilisateur n'est pas autorisé, retourne une erreur 403
    }

    const updatedMatiere = await prisma.matiere.update({
      where: { id: matiereId as string },
      data: {
        ...(validatedData.nom !== undefined ? { nom: validatedData.nom } : {}), // Si un nouveau nom est fourni, l'inclure dans les données de mise à jour
        ...(validatedData.description !== undefined
          ? { description: validatedData.description }
          : {}), // Si une nouvelle description est fournie, l'inclure dans les données de mise à jour
      },
    });

    res.status(200).json(updatedMatiere); // Retourne la matière mise à jour avec un statut 200
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues }); // Si les données ne sont pas valides, retourne une erreur 400 avec les messages d'erreur de Zod
    }
    console.error("Erreur lors de la mise à jour de la matière :", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // Si une erreur survient, retourne une erreur 500
  }
};

/**
 * DELETE /api/classes/:classeId/matieres/:matiereId
 * Supprime une matière spécifique d'une classe.
 * Seuls les utilisateurs rattachés à l'école de la classe ou les SUDO_ADMIN peuvent accéder à cette ressource.
 */
export const deleteClasseMatiere = async (req: Request, res: Response) => {
  try {
    const { classeId, matiereId } = {
      classeId: req.params.classeId,
      matiereId: req.params.matiereId || req.params.id, // Fallback pour utiliser `id` si `matiereId` est manquant
    }; // Récupère les IDs de la classe et de la matière depuis les paramètres de l'URL

    // Validation des paramètres
    if (!classeId || !matiereId) {
      return res
        .status(400)
        .json({ error: "Les paramètres classeId et matiereId sont requis." });
    }

    const matiere = await prisma.matiere.findFirst({
      where: { id: matiereId as string, classeId: classeId as string },
    }); // Récupère la matière en vérifiant qu'elle appartient bien à la classe
    if (!matiere)
      return res.status(404).json({ error: "Matière non trouvée." }); // Si la matière n'existe pas, retourne une erreur 404

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        matiere.schoolId,
      )
    ) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes pas autorisé à supprimer cette matière." }); // Si l'utilisateur n'est pas autorisé, retourne une erreur 403
    }

    await prisma.matiere.delete({ where: { id: matiereId as string } }); // Supprime la matière de la base de données

    res.status(204).send(); // Retourne un statut 204 No Content pour indiquer que la suppression a réussi
  } catch (err) {
    console.error("Erreur lors de la suppression de la matière :", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // Si une erreur survient, retourne une erreur 500
  }
};
