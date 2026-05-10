import { Request, Response } from "express";
import fs from "fs"; // Importation du module fs pour la gestion des fichiers
import { prisma } from "../lib/prisma";
import { createNoteSchema, updateNoteSchema } from "../schemas/noteSchema";
import { ZodError } from "zod";

// --- HELPERS ---------------------------------------------------

/**
 * Vérifie qu'un utilisateur est autorisé à accéder aux ressources d'une école.
 * SUDO_ADMIN a accès à toutes les écoles ; les autres utiisateurs uniquement à la leur.
 */
function isAuthorizhedForSchool(
  userRole: string,
  userSchoolId: string | null | undefined,
  ressourceSchoolId: string,
): boolean {
  if (userRole === "SUDO_ADMIN") return true; // SUDO_ADMIN peut accéder à toutes les ressources
  return userSchoolId === ressourceSchoolId;
}

/** Supprime un fichier uploadé de manière silencieuse (best-effort). */
function removeUploadedFile(filePath: string | undefined): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn(
      "[cleanup] Impossible de supprimer le fichier uploadé :",
      filePath,
      e,
    );
  }
}

// --- GET /api/classes/:classeId/notes ---------------------------------------------------

/**
 * Retourne toutes les notes de la classe avec l'élève et la matière inclus,
 * triées par matière puis par élève.
 *
 * Accès: SUDO_ADMIN, ADMIN (même école), PROFS (même école)
 */
export const getClasseNotes = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) return res.status(404).json({ error: "Classe non trouvé" });

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const notes = await prisma.note.findMany({
      where: { classeId },
      include: {
        eleve: { select: { id: true, nom: true, prenom: true } },
        matiere: { select: { id: true, nom: true } },
      },
      orderBy: [
        { matiere: { nom: "asc" } },
        { eleve: { nom: "asc" } },
        { titre: "asc" },
      ],
    });

    res.status(200).json(notes);
  } catch (err) {
    console.error("Erreur getClasseNotes :", err);
    res.status(500).json({
      error: "Une erreur est survenu lors de la récupération des notes",
    });
  }
};

// --- POST /api/classes/:classeId/notes ---------------------------------------

/**
 * Crée une note pour un élève dans une matière de la classe
 *
 * - Vérifier que l'élève et la matière appartiennent bien à la classe
 * - Vérifier que note <= noteMax
 * - Si un fichier est joint (multipart "feuille"), il est sauvegardé par multer et son chemin est stocké dans le feuillePath
 * - Le couple (eleveId, matiereId, titre) doit être unique (409 sinon).
 *
 * Accès : PROF uniquement (rattaché à la même école), SUDO_ADMIN.
 *
 * Coprs attendu (form-data ou JSON)
 *   titre, note, noteMax?, coefficient?, eleveId, matiereId, commentaire?
 * Fichier optionnel :
 *   feuille (champ mulitpart, PDF/JPEG/PNG, max 10Mo)
 */
export const createClasseNote = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // récup l'id de la classe dans les params

    if (req.user!.role !== "PROF" && req.user!.role !== "SUDO_ADMIN") {
      removeUploadedFile((req as any).file?.path);
      return res
        .status(403)
        .json({ error: " Seul un professeur peut saisir une note." });
    }

    const validatedData = createNoteSchema.parse(req.body);

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) {
      removeUploadedFile((req as any).file?.path);
      return res.status(404).json({ error: "Classe non trouvé" });
    }

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      removeUploadedFile((req as any).file?.path);
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (validatedData.note > validatedData.noteMax) {
      removeUploadedFile((req as any).file?.path);
      return res.status(400).json({
        error: `La note (${validatedData.note}) ne peut pas dépasser na note maximale (${validatedData.noteMax})`,
      });
    }

    // Vérifier que l'élève appartient à cette classe
    const eleve = await prisma.eleve.findFirst({
      where: { id: validatedData.eleveId, classeId },
    });
    if (!eleve) {
      removeUploadedFile((req as any).file?.path);
      return res
        .status(404)
        .json({ error: " Elève non trouvé dans cette classe" });
    }

    // Vérifier que la matière appartient à cette classe
    const matiere = await prisma.matiere.findFirst({
      where: { id: validatedData.matiereId, classeId },
    });
    if (!matiere) {
      removeUploadedFile((req as any).file?.path);
      return res
        .status(404)
        .json({ error: "Matière non trouvé dans cette classe." });
    }

    // Récupérer le chemin du fichier uploadé par multer (optionnel)
    const feuillePath = (req as any).file?.path ?? null;

    const note = await prisma.note.create({
      data: {
        titre: validatedData.titre,
        note: validatedData.note,
        noteMax: validatedData.noteMax,
        coefficient: validatedData.coefficient,
        commentaire: validatedData.commentaire ?? null,
        feuillePath,
        eleveId: validatedData.eleveId,
        matiereId: validatedData.matiereId,
        classeId,
        schoolId: classe.schoolId,
        createdById: req.user!.id,
      },
    });

    res.status(201).json(note);
  } catch (err) {
    removeUploadedFile((req as any).file?.path);
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }

    // Violation de contrainte unique Prisma (doublon eleveId + matiereId + titre)
    if ((err as any)?.code === "P2002") {
      return res.status(409).json({
        error:
          "Une note avec le même titre existe déjà pour cet élève et cette matière.",
      });
    }

    console.error("Erreur createClasseNote :", err);
    res.status(500).json({
      error: "Une erreur est survenue lors de la création de la note",
    });
  }
};

// --- PUT /api/classes/:classeId/notes/:noteId ---------------------------------------

/**
 * Met à jour une note existante (valeur, coefficient, commentaire, feuille).
 * Le titre n'est pas modifiable (il fait partie de la clé unique).
 * Si un nouveau fichier est uploadé, l'ancien est supprimé du disque
 *
 * Accès: PROF créateur de la note, SUDO_ADMIN
 */
export const updateClasseNote = async (req: Request, res: Response) => {
  try {
    const { classeId, noteId } = req.params as {
      classeId: string;
      noteId: string;
    };
    const validatedData = updateNoteSchema.parse(req.body);

    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, classeId },
    });
    if (!existingNote)
      return res.status(404).json({ error: "Note non trouvé" });

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingNote.schoolId,
      )
    ) {
      return res
        .status(403)
        .json({ error: "Accès refusé à la modification des notes" });
    }

    // Seul le créateur ou SUDO_ADMIN peut modifier
    if (
      req.user!.role !== "SUDO_ADMIN" &&
      existingNote.createdById !== req.user!.id
    ) {
      return res.status(403).json({
        error: "Vous ne pouvez modifier que les notes que vous avez saisies.",
      });
    }

    const effectiveNoteMax =
      validatedData.noteMax ?? Number(existingNote.noteMax);
    const effectiveNote = validatedData.note ?? Number(existingNote.note);
    if (effectiveNote > effectiveNoteMax) {
      return res.status(400).json({
        error: `La note ne peut pas dépasser la note maximale (${effectiveNoteMax})`,
      });
    }

    // Gestion du remplacement de fichier — DB first, file cleanup after
    const newFile = (req as any).file;
    const newFeuillePath = newFile?.path ?? null;

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(validatedData.note !== undefined
          ? { note: validatedData.note }
          : {}),
        ...(validatedData.noteMax !== undefined
          ? { noteMax: validatedData.noteMax }
          : {}),
        ...(validatedData.coefficient !== undefined
          ? { coefficient: validatedData.coefficient }
          : {}),
        ...(validatedData.commentaire !== undefined
          ? { commentaire: validatedData.commentaire }
          : {}),
        ...(newFile ? { feuillePath: newFeuillePath } : {}),
      },
    });

    // Supprimer l'ancien fichier après la mise à jour réussie en BDD
    if (newFile && existingNote.feuillePath) {
      removeUploadedFile(existingNote.feuillePath);
    }

    res.status(200).json(updatedNote);
  } catch (err) {
    removeUploadedFile((req as any).file?.path);
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur updateClasseNote :", err);
    res.status(500).json({ error: "Une erreur est servenue. " });
  }
};

// --- DELETE /api/classes/:classeId/notes/:noteId ---------------------------------------

/**
 * SUpprime une note et sont fichier associé (si présent sur le disque)
 *
 * Accès: PROF créateur, ADMIN, SUDO_ADMIN
 */ export const deleteClasseNote = async (req: Request, res: Response) => {
  try {
    const { classeId, noteId } = req.params as {
      classeId: string;
      noteId: string;
    };

    // Vérifier que la note existe et appartient à la classe
    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, classeId },
    });
    if (!existingNote)
      return res.status(404).json({ error: "Note non trouvé" });

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingNote.schoolId,
      )
    ) {
      return res
        .status(403)
        .json({ error: "Accès refusé à la suppression des notes" });
    }

    const canDelete =
      req.user!.role === "SUDO_ADMIN" ||
      req.user!.role === "ADMIN" ||
      existingNote.createdById === req.user!.id;

    if (!canDelete) {
      return res.status(403).json({
        error: "Vous ne pouvez supprimer que les notes que vous avez saisies.",
      });
    }

    // DB delete d'abord — le fichier est supprimé ensuite en best-effort
    await prisma.note.delete({ where: { id: noteId } });

    if (existingNote.feuillePath) {
      removeUploadedFile(existingNote.feuillePath);
    }

    res.status(204).send(); // Retourne un statut 204 No Content pour indiquer que la suppression a réussi
  } catch (err) {
    console.error("Erreur deleteClasseNote :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};
