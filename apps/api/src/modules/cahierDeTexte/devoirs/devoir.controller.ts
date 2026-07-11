import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";

export const getAdminDevoirs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const { schoolId } = req.user;
    const { classeId, matiereId, dateRendu } = req.query;

    // Si le schoolId est null (ex: SUDO_ADMIN) et qu'on n'a pas filtré l'école,
    // adapte la condition selon tes règles d'accès métier
    const devoirs = await prisma.devoir.findMany({
      where: {
        cahierTexte: {
          ...(schoolId && { schoolId: schoolId }), // N'applique le filtre schoolId que s'il existe
          ...(classeId && { classeId: String(classeId) }),
          ...(matiereId && { matiereId: String(matiereId) }),
        },
        ...(dateRendu && { dateRendu: String(dateRendu) }),
      },
      include: {
        cahierTexte: {
          include: {
            classe: { select: { nom: true } },
            matiere: { select: { nom: true } },
            professeur: { select: { nom: true, prenom: true } },
          },
        },
      },
      orderBy: {
        dateRendu: "desc",
      },
    });

    return res.status(200).json(devoirs);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des devoirs" });
  }
};
