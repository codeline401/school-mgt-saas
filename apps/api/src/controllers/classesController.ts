import { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma.js";
import { createClasseSchema } from "../schemas/classeSchema.js";

// GET /api/classes — liste les classes de l'école de l'utilisateur connecté
// SUDO_ADMIN peut filtrer via ?schoolId=<id>
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const { schoolId: userSchoolId, role } = req.user!;

    // SUDO_ADMIN n'est rattaché à aucune école : il peut passer un schoolId en query
    // Les autres rôles doivent obligatoirement être rattachés à une école
    if (role !== "SUDO_ADMIN" && !userSchoolId) {
      return res.status(403).json({
        error: "Vous n'êtes rattaché à aucune école.",
      });
    }

    const filterSchoolId =
      role === "SUDO_ADMIN"
        ? typeof req.query.schoolId === "string"
          ? req.query.schoolId
          : undefined
        : (userSchoolId ?? undefined);

    const classes = await prisma.classe.findMany({
      ...(filterSchoolId ? { where: { schoolId: filterSchoolId } } : {}),
      include: {
        _count: {
          select: {
            eleves: true, // Nombre d'élèves dans la classe
            profs: true, // Nombre de professeurs dans la classe
          },
        },
      },
      orderBy: { nom: "asc" },
    });

    res.status(200).json(classes);
  } catch (error) {
    console.error("Erreur lors de la récupération des classes :", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des classes" });
  }
};

// POST /api/classes — créer une nouvelle classe dans l'école de l'ADMIN connecté
export const createClasse = async (req: Request, res: Response) => {
  try {
    const validatedData = createClasseSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        error:
          "Vous devez être associé à une école pour créer une classe. Créez d'abord votre école.",
      });
    }

    const newClasse = await prisma.classe.create({
      data: {
        nom: validatedData.nom,
        schoolId,
      },
      include: {
        _count: {
          select: {
            eleves: true,
            profs: true,
          },
        },
      },
    });

    res.status(201).json(newClasse);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Erreur lors de la création de la classe :", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la création de la classe" });
  }
};
