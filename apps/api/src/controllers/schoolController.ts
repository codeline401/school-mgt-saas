import { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/enums.js";
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
    const userRole = req.user!.role;

    // Transaction atomique : lecture + création + mise à jour dans une seule opération
    const newSchool = await prisma.$transaction(async (tx) => {
      // Re-vérifier l'utilisateur à l'intérieur de la transaction (évite TOCTOU)
      const existingUser = await tx.user.findUnique({
        where: { id: adminId },
      });

      if (!existingUser) {
        const err: any = new Error("USER_NOT_FOUND");
        err.code = "USER_NOT_FOUND";
        throw err;
      }

      if (userRole === Role.ADMIN && existingUser.schoolId) {
        const err: any = new Error("ALREADY_HAS_SCHOOL");
        err.code = "ALREADY_HAS_SCHOOL";
        throw err;
      }

      // Créer l'école - l'inviteCode est généré auto par Prisma
      const school = await tx.school.create({
        data: {
          nom: validatedData.nom,
        },
      });

      // Lier l'ADMIN à l'école qu'il vient de créer (les SUDO_ADMIN ne sont pas liés à une école)
      // updateMany with schoolId: null guard prevents a concurrent transaction from
      // assigning a second school (write-time check eliminates the TOCTOU window).
      if (userRole === Role.ADMIN) {
        const { count } = await tx.user.updateMany({
          where: { id: adminId, schoolId: null },
          data: { schoolId: school.id },
        });
        if (count === 0) {
          // Another concurrent request already assigned a school; abort the tx.
          const err: any = new Error("ALREADY_HAS_SCHOOL");
          err.code = "ALREADY_HAS_SCHOOL";
          throw err;
        }
      }

      return school;
    });

    res.status(201).json(newSchool);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error.code === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    if (error.code === "ALREADY_HAS_SCHOOL") {
      return res.status(400).json({
        error:
          "Vous êtes déjà associé à une école. Veuillez contacter un SUDO_ADMIN pour créer une nouvelle école.",
      });
    }
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Une école avec ce nom existe déjà." });
    }
    console.error("Erreur lors de la création de l'école :", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la création de l'école" });
  }
};
