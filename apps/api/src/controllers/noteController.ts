import { Request, Response } from "express";
import fs from "fs"; // Importation du module fs pour la gestion des fichiers
import { prisma } from "../lib/prisma";
import { createNoteSchema, updateNoteSchema } from "../schemas/noteSchema.js";
import { TypeNote } from "../generated/prisma/enums.js";
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
        typeNote: validatedData.typeNote ?? "AUTRE",
        dateEval: validatedData.dateEval ?? new Date(),
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
    if (!existingNote) {
      removeUploadedFile((req as any).file?.path);
      return res.status(404).json({ error: "Note non trouvé" });
    }

    if (
      !isAuthorizhedForSchool(
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

    // Seul le créateur ou SUDO_ADMIN peut modifier
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
        ...(validatedData.typeNote !== undefined
          ? { typeNote: validatedData.typeNote }
          : {}),
        ...(validatedData.dateEval !== undefined
          ? { dateEval: validatedData.dateEval }
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

// --- GET /api/classes/:classeId/moyenne-auto -----------------------------------

/**
 * Calcule les moyennes automatiques par élève et par matière pour une classe,
 * en séparant les notes de contrôle continu (INTERROGATION + DS) des notes d'examen.
 *
 * Paramètres query optionnels :
 *   debut  : date ISO (ex: "2025-09-01") — filtre dateEval >= debut
 *   fin    : date ISO (ex: "2026-06-30") — filtre dateEval <= fin (jusqu'à 23:59:59)
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
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    // Validation et construction du filtre de date
    // Les paramètres "YYYY-MM-DD" sont interprétés comme des dates UTC (comportement
    // natif de new Date("YYYY-MM-DD")). On normalise les deux bornes en UTC pour
    // éviter toute incohérence avec setHours() qui opère en heure locale.
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (debut) {
      const d = new Date(debut);
      if (isNaN(d.getTime()))
        return res.status(400).json({ error: "Paramètre 'debut' invalide." });
      // Début : 00:00:00.000 UTC
      d.setUTCHours(0, 0, 0, 0);
      dateFilter.gte = d;
    }
    if (fin) {
      const d = new Date(fin);
      if (isNaN(d.getTime()))
        return res.status(400).json({ error: "Paramètre 'fin' invalide." });
      // Fin : 23:59:59.999 UTC
      d.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = d;
    }

    // Plage invalide : début postérieur à la fin
    if (dateFilter.gte && dateFilter.lte && dateFilter.gte > dateFilter.lte) {
      return res.status(400).json({
        error:
          "La date de début ne peut pas être postérieure à la date de fin.",
      });
    }

    const notes = await prisma.note.findMany({
      where: {
        classeId,
        // Seules les notes CC ou Examen entrent dans le calcul
        typeNote: {
          in: [TypeNote.INTERROGATION, TypeNote.DS, TypeNote.EXAMEN],
        },
        ...(Object.keys(dateFilter).length > 0 ? { dateEval: dateFilter } : {}),
      },
      include: {
        eleve: { select: { id: true, nom: true, prenom: true } },
        matiere: { select: { id: true, nom: true } },
      },
      orderBy: [
        { eleve: { nom: "asc" } },
        { matiere: { nom: "asc" } },
        { dateEval: "asc" },
      ],
    });

    // Groupement par élève puis par matière
    const eleveMap = new Map<
      string,
      {
        eleve: { id: string; nom: string; prenom: string };
        matiereMap: Map<
          string,
          {
            matiere: { id: string; nom: string };
            notesCC: typeof notes;
            notesExamen: typeof notes;
          }
        >;
      }
    >();

    for (const note of notes) {
      const eleve = note.eleve!;
      const matiere = note.matiere!;

      if (!eleveMap.has(eleve.id)) {
        eleveMap.set(eleve.id, { eleve, matiereMap: new Map() });
      }
      const eleveEntry = eleveMap.get(eleve.id)!;

      if (!eleveEntry.matiereMap.has(matiere.id)) {
        eleveEntry.matiereMap.set(matiere.id, {
          matiere,
          notesCC: [],
          notesExamen: [],
        });
      }
      const matiereEntry = eleveEntry.matiereMap.get(matiere.id)!;

      if (
        note.typeNote === TypeNote.INTERROGATION ||
        note.typeNote === TypeNote.DS
      ) {
        matiereEntry.notesCC.push(note);
      } else if (note.typeNote === TypeNote.EXAMEN) {
        matiereEntry.notesExamen.push(note);
      }
    }

    /** Moyenne pondérée normalisée sur 20. */
    function weightedAvg(ns: typeof notes): number | null {
      const valid = ns.filter((n) => Number(n.noteMax) > 0);
      if (valid.length === 0) return null;
      const sumCoef = valid.reduce((s, n) => s + Number(n.coefficient), 0);
      if (sumCoef === 0) return null;
      const sumW = valid.reduce(
        (s, n) =>
          s + (Number(n.note) / Number(n.noteMax)) * 20 * Number(n.coefficient),
        0,
      );
      return Math.round((sumW / sumCoef) * 100) / 100;
    }

    const result = Array.from(eleveMap.values()).map(
      ({ eleve, matiereMap }) => {
        const matieres = Array.from(matiereMap.values()).map(
          ({ matiere, notesCC, notesExamen }) => {
            const moyenneCC = weightedAvg(notesCC);
            const moyenneExamen = weightedAvg(notesExamen);

            let moyenneFinale: number | null = null;
            if (moyenneCC !== null && moyenneExamen !== null) {
              moyenneFinale =
                Math.round(((moyenneCC + moyenneExamen) / 2) * 100) / 100;
            } else if (moyenneCC !== null) {
              moyenneFinale = moyenneCC;
            } else if (moyenneExamen !== null) {
              moyenneFinale = moyenneExamen;
            }

            return {
              matiere,
              notesCC,
              notesExamen,
              moyenneCC,
              moyenneExamen,
              moyenneFinale,
            };
          },
        );

        // Moyenne générale = moyenne des moyennesFinale de chaque matière
        const finals = matieres
          .map((m) => m.moyenneFinale)
          .filter((m): m is number => m !== null);
        const moyenneGenerale =
          finals.length > 0
            ? Math.round(
                (finals.reduce((s, m) => s + m, 0) / finals.length) * 100,
              ) / 100
            : null;

        return { eleve, matieres, moyenneGenerale };
      },
    );

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
 * Retourne le classement des élèves d'une classe par :
 *  - mode "general" : classement par moyenne générale
 *  - mode "matière" : classement par moyenne dans une matière donnée
 *
 * Query params :
 *  - debut     : YYYY-MM-DD (optionnel)
 *  - fin       : YYYY-MM-DD (optionnel)
 *  - mode      : "general" (défaut) ou "matiere"
 *  - matiereId : string (requis si mode = "matiere")
 *
 * Accès : SUDO_ADMIN, ADMIN, PROF
 */
export const getCLassementClasse = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // ID de la classe
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
    if (!classe) {
      return res.status(404).json({ error: "Classe non trouvée." }); // 404 si la classe n'existe pas
    }

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (mode === "matiere" && !matiereId) {
      return res.status(400).json({
        error: "Le paramètre 'matiereId' est requis en mode 'matiere'.",
      });
    }

    // Construction du filtre de date (même logique que pour moyenne-auto)
    const dateFilter: { gte?: Date; lte?: Date } = {}; // filtre de date pour Prisma
    if (debut) {
      const d = new Date(debut); // validation de la date
      if (isNaN(d.getTime())) {
        // date invalide
        return res.status(400).json({ error: "Paramètre 'debut' invalide." });
      }

      d.setUTCHours(0, 0, 0, 0); // début de journée UTC
      dateFilter.gte = d; // dateEval >= debut
    }

    if (fin) {
      const d = new Date(fin); // validation de la date
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: "Paramètre 'fin' invalide." });
      }
      d.setUTCHours(23, 59, 59, 999); // fin de journée UTC
      dateFilter.lte = d; // dateEval <= fin
    }

    if (dateFilter.gte && dateFilter.lte && dateFilter.gte > dateFilter.lte) {
      return res.status(400).json({
        error:
          "La date de début ne peut pas être postérieure à la date de fin.",
      });
    }

    // --- Récupération des notes -----------------------------------------------
    const notes = await prisma.note.findMany({
      where: {
        classeId,
        typeNote: {
          in: [TypeNote.INTERROGATION, TypeNote.DS, TypeNote.EXAMEN],
        },
        ...(matiereId && mode === "matiere" ? { matiereId } : {}), // filtre par matière si mode = "matiere"
        ...(Object.keys(dateFilter).length > 0 ? { dateEval: dateFilter } : {}), // filtre de date si au moins une borne est spécifiée
      },
      include: {
        eleve: { select: { id: true, nom: true, prenom: true } }, // inclus l'élève pour le classement par élève
        matiere: { select: { id: true, nom: true } }, // inclus la matière pour le classement par matière
      },
    });

    // --- Moyenne pondérée normalisée sur 20 ------------------------------------
    function weightedAverage(ns: typeof notes): number | null {
      const valid = ns.filter((n) => Number(n.noteMax) > 0); // on ne prend en compte que les notes avec noteMax > 0
      if (!valid.length) {
        return null; // si aucune note valide, on retourne null pour indiquer l'absence de moyenne
      }

      const sumCoef = valid.reduce((s, n) => s + Number(n.coefficient), 0); // somme des coefficients
      if (!sumCoef) {
        return null; // si la somme des coefficients est nulle, on ne peut pas calculer de moyenne
      }

      const sumWeighted = valid.reduce(
        (s, n) =>
          s + (Number(n.note) / Number(n.noteMax)) * 20 * Number(n.coefficient),
        0,
      ); // somme des notes pondérées

      return Math.round((sumWeighted / sumCoef) * 100) / 100; // moyenne finale arrondie à 2 décimales
    }

    // --- Calcul de la moyenne par élève -------------------------------------
    const eleveMap = new Map<
      string,
      {
        eleve: { id: string; nom: string; prenom: string };
        notes: typeof notes;
      }
    >(); // map pour regrouper les notes par élève

    for (const note of notes) {
      const eleve = note.eleve!; // on peut forcer le non-null car la relation est incluse dans la requête Prisma
      if (!eleveMap.has(eleve.id)) {
        eleveMap.set(eleve.id, { eleve, notes: [] }); // initialisation de l'entrée pour l'élève s'il n'existe pas encore
      }

      eleveMap.get(eleve.id)!.notes.push(note); // ajout de la note à l'élève correspondant
    }

    // S'assurer que tous les élèves de la classe apparaissent (même sans note)
    const tousEleves = await prisma.eleve.findMany({
      where: { classeId },
      select: { id: true, nom: true, prenom: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });
    for (const eleve of tousEleves) {
      if (!eleveMap.has(eleve.id)) {
        eleveMap.set(eleve.id, { eleve, notes: [] }); // élève sans note
      }
    }

    interface EntreeClassement {
      eleve: { id: string; nom: string; prenom: string };
      moyenne: number | null;
      rang: number;
      exAequo: boolean;
      // Mode general uniquement
      detailMatieres?: Array<{
        matiere: { id: string; nom: string };
        moyenne: number | null;
      }>;
    }

    let entries: Omit<EntreeClassement, "rang" | "exAequo">[]; // classement sans les rangs calculés

    if (mode === "general") {
      entries = Array.from(eleveMap.values()).map(({ eleve, notes: ns }) => {
        // Moyenne par matière puis moyenne des moyennes
        const matiereMap = new Map<
          string,
          { matiere: { id: string; nom: string }; notes: typeof notes }
        >();

        for (const n of ns) {
          // regroupement des notes par matière
          const mat = n.matiere!; // non-null car inclus dans la requête
          if (!matiereMap.has(mat.id)) {
            matiereMap.set(mat.id, { matiere: mat, notes: [] }); // initialisation de l'entrée pour la matière
          }
          matiereMap.get(mat.id)!.notes.push(n); // ajout de la note à la matière correspondante
        }

        const detailMatieres = Array.from(matiereMap.values()).map(
          ({ matiere, notes: mn }) => {
            const cc = mn.filter(
              (n) =>
                n.typeNote === TypeNote.INTERROGATION ||
                n.typeNote === TypeNote.DS,
            );
            const ex = mn.filter((n) => n.typeNote === TypeNote.EXAMEN);
            const moyCC = weightedAverage(cc);
            const moyEx = weightedAverage(ex);
            let finale: number | null = null;
            if (moyCC !== null && moyEx !== null)
              finale = Math.round(((moyCC + moyEx) / 2) * 100) / 100;
            else finale = moyCC ?? moyEx;
            return { matiere, moyenne: finale };
          },
        );

        const finals = detailMatieres
          .map((d) => d.moyenne)
          .filter((m): m is number => m !== null); // moyennes finales par matière

        const moyenne =
          finals.length > 0
            ? Math.round(
                (finals.reduce((s, m) => s + m, 0) / finals.length) * 100,
              ) / 100
            : null; // moyenne générale

        return { eleve, moyenne, detailMatieres };
      });
    } else {
      // mode === "matiere"
      // mode === "matiere"
      entries = Array.from(eleveMap.values()).map(({ eleve, notes: ns }) => {
        const cc = ns.filter(
          (n) =>
            n.typeNote === TypeNote.INTERROGATION || n.typeNote === TypeNote.DS,
        );
        const ex = ns.filter((n) => n.typeNote === TypeNote.EXAMEN);
        const moyCC = weightedAverage(cc);
        const moyEx = weightedAverage(ex);
        let moyenne: number | null = null;
        if (moyCC !== null && moyEx !== null)
          moyenne = Math.round(((moyCC + moyEx) / 2) * 100) / 100;
        else moyenne = moyCC ?? moyEx;
        return { eleve, moyenne };
      });
    }

    // ── Tri décroissant + attribution des rangs (ex-aequo) ──────────────────
    const sorted = [...entries].sort((a, b) => {
      if (a.moyenne === null && b.moyenne === null) return 0;
      if (a.moyenne === null) return 1;
      if (b.moyenne === null) return -1;
      return b.moyenne - a.moyenne;
    });

    const result: EntreeClassement[] = []; // résultat final avec rangs et ex-aequo
    let currentRang = 1;
    for (let i = 0; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      if (
        i > 0 &&
        sorted[i]?.moyenne !== prev?.moyenne &&
        sorted[i]?.moyenne !== null
      ) {
        currentRang = i + 1;
      }
      const exAequo =
        sorted[i]?.moyenne !== null &&
        sorted.filter((e) => e.moyenne === sorted[i]?.moyenne).length > 1;
      result.push({
        ...sorted[i]!,
        rang: sorted[i]?.moyenne !== null ? currentRang : sorted.length,
        exAequo,
      });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur getCLassementClasse :", err);
    res
      .status(500)
      .json({ error: "Une erreur est survenue lors du calcul du classement." });
  }
};
