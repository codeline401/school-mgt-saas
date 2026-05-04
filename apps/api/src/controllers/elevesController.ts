import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

import { createEleveSchema } from "../schemas/eleveSchema.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";

// HELPERS pour les autorisations création et modification

// method - GET /api/eleves pour récupérer tous les élèves
export const getAllEleves = async (req: Request, res: Response) => {
  try {
    const tousLesEleves = await prisma.eleve.findMany({
      include: {
        classe: true, // Inclure les données de la classe associée à chaque élève
      },
    });
    res.status(200).json(tousLesEleves);
  } catch (error) {
    console.error("Erreur lors de la récupération des élèves:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des élèves.",
    });
  }
};

// methof - POST /api/eleves pour créer un nouvel élève
export const createEleve = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!; // Récupérer l'ID de l'école et le rôle de l'utilisateur connecté

    // Vérification du rôle
    if (role !== "ADMIN" && role !== "SUDO_ADMIN") {
      return res
        .status(403)
        .json({ error: "Vous n'avez pas la permission de créer un élève." });
    }

    if (!schoolId) {
      return res
        .status(400)
        .json({
          error:
            "Vous devez être associé à une école pour créer un élève. Veuillez contacter votre administrateur.",
        });
    }

    // Valider les données d'entrée avec Zod
    const validatedData = createEleveSchema.parse(req.body);

    // Créer un nouvel élève dans la base de données
    const nouvelEleve = await prisma.eleve.create({
      data: validatedData,
    });

    res.status(201).json(nouvelEleve);
  } catch (error) {
    console.error("Erreur lors de la création de l'élève:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la création de l'élève.",
    });
  }
};

// GET /api/professeurs - liste les professeurs de l'école de l'utilisateur connecté
export const getAllProfesseurs = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!; // Récupérer l'ID de l'école et le rôle de l'utilisateur connecté

    if (role !== "SUDO_ADMIN" && !schoolId) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes rattaché à aucune école." });
    }

    const filterSchoolId =
      role === "SUDO_ADMIN"
        ? typeof req.query.schoolId === "string"
          ? req.query.schoolId
          : undefined
        : (schoolId ?? undefined);

    const professeur = await prisma.professeur.findMany({
      ...(filterSchoolId ? { where: { schoolId: filterSchoolId } } : {}),
      include: { classes: true }, // Inclure les classes associées à chaque professeur
      orderBy: { nom: "asc" }, // Trier les professeurs par nom
    });

    res.status(200).json(professeur);
  } catch (err) {
    console.error("Erreur lors de la récupération des professeurs:", err);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des professeurs.",
    });
  }
};

// DELETE /api/eleves/:id - supprimer un élève par son ID
export const deleteEleve = async (req: Request, res: Response) => {
  try {
    const { role } = req.user!; // Récupérer le rôle de l'utilisateur connecté

    // Vérification du rôle directement via req.user
    if (role !== "ADMIN" && role !== "SUDO_ADMIN") {
      return res.status(403).json({
        error:
          "Accès réfusé, vous n'avez pas la permission de supprimer cet élève!!.",
      });
    }

    const eleveId = req.params.id;

    // Vérifier si l'éllève existe
    const existingEleve = await prisma.eleve.findUnique({
      where: { id: eleveId as string },
    });

    if (!existingEleve) {
      return res.status(404).json({
        error:
          "Cet elève n'existe pas, veuillez contacter votre Administrateur!!!",
      });
    }

    await prisma.eleve.delete({
      where: { id: eleveId as string },
    });

    res
      .status(200)
      .json({ message: "Elève supprimé avec succès :", existingEleve });
  } catch (err) {
    console.error("Erreur lors de la suppréssion de l'élève", err);
    res.status(500).json({ error: "Erreur serveur!!!" });
  }
};
