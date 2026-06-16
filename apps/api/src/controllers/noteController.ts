import { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma.js";
import { createNoteSchema, updateNoteSchema } from "../schemas/noteSchema.js";
import {
  isAuthorizedForSchool,
  removeUploadedFile,
  parseDateFilter,
  findNotesByClasse,
  createNote,
  updateNote,
  deleteNote,
  computeMoyennesAuto,
  computeClassement,
} from "../services/note.service.js";

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
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const notes = await findNotesByClasse(classeId);
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
 * Crée une note pour un élève dans une matière de la classe.
 *
 * Accès : PROF uniquement (rattaché à la même école), SUDO_ADMIN.
 *
 * Corps attendu (form-data ou JSON) :
 *   titre, note, noteMax?, coefficient?, eleveId, matiereId, commentaire?
 * Fichier optionnel :
 *   feuille (champ multipart, PDF/JPEG/PNG, max 10Mo)
 */
export const createClasseNote = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };

    if (req.user!.role !== "PROF" && req.user!.role !== "SUDO_ADMIN") {
      removeUploadedFile((req as any).file?.path);
      return res
        .status(403)
        .json({ error: "Seul un professeur peut saisir une note." });
    }

    const validatedData = createNoteSchema.parse(req.body);

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) {
      removeUploadedFile((req as any).file?.path);
      return res.status(404).json({ error: "Classe non trouvé" });
    }

    if (
      !isAuthorizedForSchool(
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
        error: `La note (${validatedData.note}) ne peut pas dépasser la note maximale (${validatedData.noteMax})`,
      });
    }

    const eleve = await prisma.eleve.findFirst({
      where: { id: validatedData.eleveId, classeId },
    });
    if (!eleve) {
      removeUploadedFile((req as any).file?.path);
      return res
        .status(404)
        .json({ error: "Elève non trouvé dans cette classe" });
    }

    const matiere = await prisma.matiere.findFirst({
      where: { id: validatedData.matiereId, classeId },
    });
    if (!matiere) {
      removeUploadedFile((req as any).file?.path);
      return res
        .status(404)
        .json({ error: "Matière non trouvé dans cette classe." });
    }

    const feuillePath = (req as any).file?.path ?? null;

    const note = await createNote(
      validatedData,
      classeId,
      classe.schoolId,
      req.user!.id,
      feuillePath,
    );

    res.status(201).json(note);
  } catch (err) {
    removeUploadedFile((req as any).file?.path);
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
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
 * Si un nouveau fichier est uploadé, l'ancien est supprimé du disque.
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
    if (!existingNote) {
      removeUploadedFile((req as any).file?.path);
      return res.status(404).json({ error: "Note non trouvé" });
    }

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingNote.schoolId,
      )
    ) {
      removeUploadedFile((req as any).file?.path);
      return res
        .status(403)
        .json({ error: "Accès refusé à la modification des notes" });
    }

    if (
      req.user!.role !== "SUDO_ADMIN" &&
      existingNote.createdById !== req.user!.id
    ) {
      removeUploadedFile((req as any).file?.path);
      return res.status(403).json({
        error: "Vous ne pouvez modifier que les notes que vous avez saisies.",
      });
    }

    const effectiveNoteMax =
      validatedData.noteMax ?? Number(existingNote.noteMax);
    const effectiveNote = validatedData.note ?? Number(existingNote.note);
    if (effectiveNote > effectiveNoteMax) {
      removeUploadedFile((req as any).file?.path);
      return res.status(400).json({
        error: `La note ne peut pas dépasser la note maximale (${effectiveNoteMax})`,
      });
    }

    const newFile = (req as any).file;
    const newFeuillePath = newFile?.path ?? null;

    const updatedNote = await updateNote(
      noteId,
      validatedData,
      newFeuillePath,
      !!newFile,
    );

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
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// --- DELETE /api/classes/:classeId/notes/:noteId ---------------------------------------

/**
 * Supprime une note et son fichier associé (si présent sur le disque).
 *
 * Accès: PROF créateur, ADMIN, SUDO_ADMIN
 */
export const deleteClasseNote = async (req: Request, res: Response) => {
  try {
    const { classeId, noteId } = req.params as {
      classeId: string;
      noteId: string;
    };

    const existingNote = await prisma.note.findFirst({
      where: { id: noteId, classeId },
    });
    if (!existingNote)
      return res.status(404).json({ error: "Note non trouvé" });

    if (
      !isAuthorizedForSchool(
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

    await deleteNote(noteId);

    if (existingNote.feuillePath) {
      removeUploadedFile(existingNote.feuillePath);
    }

    res.status(204).send();
  } catch (err) {
    console.error("Erreur deleteClasseNote :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// --- GET /api/classes/:classeId/moyenne-auto -----------------------------------

/**
 * Calcule les moyennes automatiques par élève et par matière pour une classe,
 * en séparant les notes de contrôle continu (INTERROGATION + DS) des notes d'examen.
 *
 * Query params optionnels : debut (YYYY-MM-DD), fin (YYYY-MM-DD)
 *
 * Accès : SUDO_ADMIN, ADMIN, PROF
 */
export const getMoyenneAutoClasse = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const { debut, fin } = req.query as { debut?: string; fin?: string };

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) return res.status(404).json({ error: "Classe non trouvée." });

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const dateFilter = parseDateFilter(debut, fin);
    if (dateFilter === null) {
      return res.status(400).json({ error: "Paramètre de date invalide." });
    }

    if (dateFilter.gte && dateFilter.lte && dateFilter.gte > dateFilter.lte) {
      return res.status(400).json({
        error:
          "La date de début ne peut pas être postérieure à la date de fin.",
      });
    }

    const result = await computeMoyennesAuto(classeId, dateFilter);
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur getMoyenneAutoClasse :", err);
    res
      .status(500)
      .json({ error: "Une erreur est survenue lors du calcul des moyennes." });
  }
};

// --- GET /api/classes/:classeId/notes/classement -----------------------------------

/**
 * Retourne le classement des élèves d'une classe.
 *
 * Query params :
 *   debut, fin    : YYYY-MM-DD (optionnel)
 *   mode          : "general" (défaut) | "matiere"
 *   matiereId     : string (requis si mode = "matiere")
 *
 * Accès : SUDO_ADMIN, ADMIN, PROF
 */
export const getClassementClasse = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const {
      debut,
      fin,
      mode = "general",
      matiereId,
    } = req.query as {
      debut?: string;
      fin?: string;
      mode?: string;
      matiereId?: string;
    };

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) return res.status(404).json({ error: "Classe non trouvée." });

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (mode !== "general" && mode !== "matiere") {
      return res.status(400).json({
        error:
          "Paramètre 'mode' invalide. Valeurs autorisées : 'general' ou 'matiere'.",
      });
    }

    if (mode === "matiere" && !matiereId) {
      return res.status(400).json({
        error: "Le paramètre 'matiereId' est requis en mode 'matiere'.",
      });
    }

    const dateFilter = parseDateFilter(debut, fin);
    if (dateFilter === null) {
      return res.status(400).json({ error: "Paramètre de date invalide." });
    }

    if (dateFilter.gte && dateFilter.lte && dateFilter.gte > dateFilter.lte) {
      return res.status(400).json({
        error:
          "La date de début ne peut pas être postérieure à la date de fin.",
      });
    }

    const result = await computeClassement(
      classeId,
      mode,
      dateFilter,
      matiereId,
    );
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur getClassementClasse :", err);
    res
      .status(500)
      .json({ error: "Une erreur est survenue lors du calcul du classement." });
  }
};

// GET /api/classes/:classeId/periodes
export const getClassePeriodes = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) return res.status(404).json({ error: "Classe non trouvée." });

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const periodes = await prisma.periode.findMany({
      where: { schoolId: classe.schoolId },
      select: { id: true, nom: true, type: true, anneeScolaire: true },
      orderBy: [{ anneeScolaire: "desc" }, { nom: "asc" }],
    });

    res.status(200).json(periodes);
  } catch (err) {
    console.error("Erreur getClassePeriodes :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};
