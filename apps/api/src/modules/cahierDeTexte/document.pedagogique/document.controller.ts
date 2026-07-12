import { Request, Response } from "express";
import { getDocumentsService } from "./document.service.js";

export const getDocuments = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.schoolId) {
      return res
        .status(401)
        .json({ message: "Non authentifié ou école non spécifiée." });
    }

    const { schoolId } = req.user;
    const { classeId, matiereId, type } = req.query;

    const documents = await getDocumentsService(
      schoolId,
      classeId ? String(classeId) : undefined,
      matiereId ? String(matiereId) : undefined,
      type ? String(type) : undefined,
    );

    return res.status(200).json(documents);
  } catch (error) {
    console.error("Erreur dans getDocuments:", error);
    return res.status(500).json({
      message:
        "Une erreur est survenue lors de la récupération de la documentothèque.",
    });
  }
};
