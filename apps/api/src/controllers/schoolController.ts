import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createSchoolSchema } from "../schemas/schoolSchema.js";

// GET /api/schools - résérvé au SUDO_ADMIN
// Retourne toutes les écoles avec le nombre d'élèves, classes et profs
export const getAllSchools = async (req: Request, res: Response) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            eleves: true, // Nombre d'élèves dans l'école
            classes: true, // Nombre de classes dans l'école
            profs: true, // Nombre de professeurs dans l'école
            users: true, // Nombre total d'utilisateurs dans l'école (inclut élèves, profs, parents)
          },
        },
      },
      orderBy: { createdAt: "desc" }, // Trier par date de création décroissante
    });

    res.status(200).json(schools);
  } catch (error) {
    console.error("Erreur lors de la récupération des écoles :", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des écoles" });
  }
};

// POST /api/schools - réservé à l'ADMIN et SUDO_ADMIN
// Créer une nouvelle école et lié l'ADMIN créateur à cette nouvelle école
export const createSchool = async (req: Request, res: Response) => {
  try {
    const validatedData = createSchoolSchema.parse(req.body); // Validation des données d'entrée

    const adminId = req.user!.id; // Récupérer l'ID de l'admin à partir du token d'authentification

    // Vérifier que l'admin existe et récupérer son école actuelle (s'il en a une)
    const existingUser = await prisma.user.findUnique({
      where: { id: adminId },
      include: { school: true },
    });

    if (existingUser?.schoolId) {
      return res.status(400).json({
        error:
          "Vous êtes déjà associé à une école. Veuillez contacter un SUDO_ADMIN pour créer une nouvelle école.",
      });
    }

    // Créer l'école - l'inviteCode est généré auto par Prisma
    const newSchool = await prisma.school.create({
      data: {
        nom: validatedData.nom,
      },
    });

    // Lier l'ADMIN à l'école qu'il vient de créer
    await prisma.user.update({
      where: { id: adminId },
      data: { schoolId: newSchool.id },
    });

    res.status(201).json(newSchool);
  } catch (error: any) {
    if (error.errors) return res.status(400).json({ error: error.errors }); // Erreurs de validation Zod
    console.error("Erreur lors de la création de l'école :", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la création de l'école" });
  }
};
