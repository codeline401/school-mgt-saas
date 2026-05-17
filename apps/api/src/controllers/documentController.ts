import { Request, Response } from "express";
import fs from "fs";
import { prisma } from "../lib/prisma.js";
import { createDocumentSchema } from "../schemas/documentSchema.js";
import { ZodError } from "zod";

function removeUploadedFile(filePath: string | undefined): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn("[cleanup] Impossible de supprimer le fichier:", filePath, e);
  }
}

// GET /api/classes/:classeId/documents
export const getClasseDocuments = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const user = req.user!;

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) return res.status(404).json({ error: "Classe non trouvée." });

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const documents = await prisma.document.findMany({
      where: { classeId },
      include: {
        uploadedBy: {
          select: { id: true, nom: true, prenom: true, role: true },
        },
        matiere: { select: { id: true, nom: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(documents);
  } catch (err) {
    console.error("Erreur getClasseDocuments:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// POST /api/classes/:classeId/documents
export const createClasseDocument = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const user = req.user!;

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ error: "Un fichier est requis." });
    }

    let validatedData;
    try {
      validatedData = createDocumentSchema.parse(req.body);
    } catch (err) {
      removeUploadedFile(file.path);
      if (err instanceof ZodError)
        return res.status(400).json({ error: err.issues });
      throw err;
    }

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) {
      removeUploadedFile(file.path);
      return res.status(404).json({ error: "Classe non trouvée." });
    }

    const allowedRoles = ["SUDO_ADMIN", "ADMIN", "PROF"];
    if (
      user.schoolId !== classe.schoolId ||
      !allowedRoles.includes(user.role)
    ) {
      removeUploadedFile(file.path);
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (validatedData.matiereId) {
      const matiere = await prisma.matiere.findFirst({
        where: { id: validatedData.matiereId, classeId },
      });
      if (!matiere) {
        removeUploadedFile(file.path);
        return res
          .status(404)
          .json({ error: "Matière non trouvée dans cette classe." });
      }
    }

    const document = await prisma.document.create({
      data: {
        titre: validatedData.titre,
        description: validatedData.description ?? null,
        type: validatedData.type,
        filePath: file.path,
        mimeType: file.mimetype,
        classeId,
        schoolId: classe.schoolId,
        uploadedById: user.id,
        ...(validatedData.matiereId
          ? { matiereId: validatedData.matiereId }
          : {}),
      },
      include: {
        uploadedBy: {
          select: { id: true, nom: true, prenom: true, role: true },
        },
        matiere: { select: { id: true, nom: true } },
      },
    });

    res.status(201).json(document);
  } catch (err) {
    removeUploadedFile((req as any).file?.path);
    console.error("Erreur createClasseDocument:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// DELETE /api/classes/:classeId/documents/:documentId
export const deleteClasseDocument = async (req: Request, res: Response) => {
  try {
    const { classeId, documentId } = req.params as {
      classeId: string;
      documentId: string;
    };
    const user = req.user!;

    const document = await prisma.document.findFirst({
      where: { id: documentId, classeId },
    });
    if (!document)
      return res.status(404).json({ error: "Document non trouvé." });

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== document.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const canDelete =
      user.role === "SUDO_ADMIN" ||
      user.role === "ADMIN" ||
      document.uploadedById === user.id;

    if (!canDelete) {
      return res.status(403).json({
        error: "Seul l'auteur ou un administrateur peut supprimer ce document.",
      });
    }

    await prisma.document.delete({ where: { id: documentId } });
    removeUploadedFile(document.filePath);

    res.status(204).end();
  } catch (err) {
    console.error("Erreur deleteClasseDocument:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};
