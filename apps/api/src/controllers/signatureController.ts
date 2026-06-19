import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import fs from "fs/promises";

// ─── Helper async pour vérifier l'existence d'un fichier ─────────────────────

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function safeUnlink(filePath: string, context: string): Promise<void> {
  try {
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (err) {
    console.warn(
      `[cleanup] Impossible de supprimer le fichier (${context}) :`,
      err,
    );
  }
}

// GET /api/signature -------------------------------

/**
 * Retourne la signature de l'utilisateur connecté.
 * Accès: ADMIN, SUDO_ADMIN, PROF
 */
export const getMySignature = async (req: Request, res: Response) => {
  try {
    const signature = await prisma.signature.findUnique({
      where: { userId: req.user!.id },
    });

    if (!signature) {
      return res.status(404).json({ message: "Signature non trouvée." });
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
 * Upload ou remplace la signature de l'utilisateur connecté.
 * Le fichier est géré par multer (champ "signature").
 * Accès: ADMIN, SUDO_ADMIN, PROF
 */
export const uploadSignature = async (req: Request, res: Response) => {
  const file = (req as any).file;
  try {
    if (!file) {
      return res
        .status(400)
        .json({ message: "Aucun fichier de signature fourni" });
    }

    // Récupère l'ancienne signature pour supprimer l'ancien fichier
    const existingSignature = await prisma.signature.findUnique({
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

    // Supprime l'ancien fichier après l'upsert réussi (best-effort, async)
    if (existingSignature && existingSignature.filePath !== file.path) {
      await safeUnlink(existingSignature.filePath, "ancienne signature");
    }

    res.status(200).json(signature);
  } catch (err) {
    // Nettoyage du fichier uploadé en cas d'erreur (async)
    if (file?.path) {
      await safeUnlink(file.path, "rollback upload");
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
 * Accès: ADMIN, SUDO_ADMIN, PROF
 */
export const deleteSignature = async (req: Request, res: Response) => {
  try {
    const existingSignature = await prisma.signature.findUnique({
      where: { userId: req.user!.id },
    });

    if (!existingSignature) {
      return res.status(404).json({ message: "Aucune signature à supprimer." });
    }

    // Suppression en DB d'abord
    await prisma.signature.delete({ where: { userId: req.user!.id } });

    // Suppression du fichier après la suppression en DB (async, best-effort)
    await safeUnlink(existingSignature.filePath, "suppression signature");

    res.status(204).send();
  } catch (err) {
    console.error("Erreur lors de la suppression de la signature:", err);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression de la signature",
    });
  }
};

// GET /api/signature/file/:userId -------------------------------

/**
 * Sert l'image de la signature d'un utilisateur donné (pour l'insérer dans les templates).
 * Retourne le fichier en base64 pour usage dans le HTML du bulletin.
 *
 * SÉCURITÉ : vérifie que l'utilisateur demandeur appartient à la même école
 * que l'utilisateur ciblé (sauf SUDO_ADMIN qui voit tout), pour empêcher
 * l'accès aux signatures d'autres tenants.
 *
 * Accès: ADMIN, SUDO_ADMIN, PROF
 */
export const getSignatureBase64 = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const requester = req.user!;

    // Récupère l'utilisateur ciblé pour connaître son école
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Contrôle tenant : SUDO_ADMIN passe toujours, les autres doivent être
    // de la même école que l'utilisateur ciblé.
    const sameSchool =
      requester.role === "SUDO_ADMIN" ||
      (requester.schoolId && requester.schoolId === targetUser.schoolId);

    if (!sameSchool) {
      return res.status(403).json({
        message: "Accès refusé : cette signature appartient à une autre école.",
      });
    }

    const signature = await prisma.signature.findUnique({
      where: { userId },
    });

    if (!signature || !(await fileExists(signature.filePath))) {
      return res.status(404).json({ message: "Signature introuvable." });
    }

    const buffer = await fs.readFile(signature.filePath);
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${signature.mimeType};base64,${base64Data}`;

    res.status(200).json({ dataUrl, mimeType: signature.mimeType });
  } catch (err) {
    console.error("Erreur lors de la récupération de la signature:", err);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de la signature",
    });
  }
};
