import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

import { createEleveSchema } from "../schemas/eleveSchema.js";

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
