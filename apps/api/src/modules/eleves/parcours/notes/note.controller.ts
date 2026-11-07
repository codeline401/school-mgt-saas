import type { Request, Response } from "express";
import { listeNotesQuerySchema } from "./note.schema.js";
import { NoteParcoursError, NoteParcoursService } from "./note.service.js";
import { ZodError } from "zod";
/** GET /api/eleves/parcours/notes */
export const listerNotes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const query = listeNotesQuerySchema.parse(req.query);
    const result = await NoteParcoursService.lister(query, {
      id: req.user.id,
      role: req.user.role,
      schoolId: req.user.schoolId ?? null,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error instanceof NoteParcoursError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("Erreur lors de la consultation des notes", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
