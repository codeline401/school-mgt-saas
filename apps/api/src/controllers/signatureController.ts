import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import fs from "fs";

// GET /api/signature -------------------------------

/**
 * Retourne la singature de l'utilisateur connecté.
 * Accès: ADMIN, SUDO_AMDIN, PROF
 */
export const getMySignature = async (req: Request, res: Response) => {
  try {
    const signature = await prisma.signature.findFirst({
      where: { userId: req.user!.id },
    });

    if (!signature) {
      return res.status(404).json({ message: "Signature non trouvé !!!" });
    }

    res.status(200).json(signature);
  } catch (err) {
    console.error("Erreur lors de la récupération de la signature:", err);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de la signature",
    });
  }
};

// POST /api/signature -------------------------------

/**
 * Upload ou remplace la singature de l'utilisateur connecté.
 * Le fichier est géré par multer (champ "singature").
 * Accès: ADMIN, SUDO_AMDIN, PROF
 */
export const uploadSignature = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file; // multer ajoute le fichier à req.file

    if (!file) {
      return res
        .status(400)
        .json({ message: "Aucun fichier de signature fourni" });
    }

    // Récupère l'ancienne signature pour supprimer l'ancien fichier
    const existingSignature = await prisma.signature.findFirst({
      where: { userId: req.user!.id },
    });

    // Upsert en base (créé ou remplace la signature)
    const signature = await prisma.signature.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        filePath: file.path,
        mimeType: file.mimetype,
      },
      update: {
        filePath: file.path,
        mimeType: file.mimetype,
      },
    });

    // Supprime l'ancien fichier après l'upsert réussi
    if (existingSignature && existingSignature.filePath !== file.path) {
      try {
        if (fs.existsSync(existingSignature.filePath)) {
          fs.unlinkSync(existingSignature.filePath);
        }
      } catch (err) {
        console.error(
          "Erreur lors de la suppression de l'ancien fichier de signature:",
          err,
        );
      }
    }

    res.status(200).json(signature);
  } catch (err) {
    // Nettoyage du fichier uploadé en cas d'erreur
    const file = (req as any).file;
    if (file?.path) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {}
    }

    console.error("Erreur lors de l'upload de la signature:", err);
    res.status(500).json({
      message: "Erreur serveur lors de l'upload de la signature",
    });
  }
};

// DELETE /api/signature -------------------------------

/**
 * Supprime la signature de l'utilisateur connecté.
 * Accès: ADMIN, SUDO_AMDIN, PROF
 */
export const deleteSignature = async (req: Request, res: Response) => {
  try {
    const existingSignature = await prisma.signature.findUnique({
      where: { userId: req.user!.id },
    });

    if (!existingSignature) {
      return res
        .status(404)
        .json({ message: "Aucune Signature non trouvé !!!" });
    }

    // Suppression en DB d'abord
    await prisma.signature.delete({ where: { userId: req.user!.id } });

    // Suppression du fichier après la suppression en DB
    try {
      if (fs.existsSync(existingSignature.filePath)) {
        fs.unlinkSync(existingSignature.filePath);
      }
    } catch (err) {
      console.warn(
        "[cleanUp] Impossible de supprimer le fichier signature :",
        err,
      );
    }

    res.status(200).send(); // Réponse vide avec succès
  } catch (err) {
    console.error("Erreur lors de la suppression de la signature:", err);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression de la signature",
    });
  }
};

// GET /api/singature/file/:userId -------------------------------

/**
 * Sert l'image de la signature d'un utilisateur donné (pour l'insérer dans le templates)
 * Retourne le fichier en base64 pour usage dans HTML du bulletin
 * Accès: ADMIN, SUDO_AMDIN, PROF
 */
export const getSignatureBase64 = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };

    const signature = await prisma.signature.findUnique({
      where: { userId },
    });

    if (!signature || !fs.existsSync(signature.filePath)) {
      return res.status(404).json({ message: "Signature non trouvé !!!" });
    }

    const buffer = fs.readFileSync(signature.filePath); // Lire le fichier en tant que buffer
    const base64Data = buffer.toString("base64"); // Convertir le buffer en base64
    const dataUrl = `data:${signature.mimeType};base64,${base64Data}`; // Créer un Data URL

    res.status(200).json({ dataUrl, mimeType: signature.mimeType });
  } catch (err) {
    console.error("Erreur lors de la récupération de la signature:", err);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de la signature",
    });
  }
};
