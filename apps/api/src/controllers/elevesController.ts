import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

import { createEleveSchema } from "../schemas/eleveSchema.js";
import { error } from "node:console";

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

    if (role !== "SUDO_ADMIN" && role !== "ADMIN" && !schoolId) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes rattaché à aucune école." });
    }

    const filterSchoolId = // Si SUDO_ADMIN, il peut passer un schoolId en query, sinon on prend celui de l'utilisateur
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
