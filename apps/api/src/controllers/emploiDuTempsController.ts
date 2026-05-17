import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createCreneauSchema } from "../schemas/emploiDuTempsSchema.js";
import { ZodError } from "zod";

const WRITE_ROLES = ["SUDO_ADMIN", "ADMIN", "USER"];

// GET /api/classes/:classeId/emploi-du-temps
export const getEmploiDuTemps = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const user = req.user!;

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) return res.status(404).json({ error: "Classe non trouvée." });

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const creneaux = await prisma.creneauHoraire.findMany({
      where: { classeId },
      include: { matiere: { select: { id: true, nom: true } } },
      orderBy: [{ heureDebut: "asc" }, { jour: "asc" }],
    });

    res.status(200).json(creneaux);
  } catch (err) {
    console.error("Erreur getEmploiDuTemps:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// POST /api/classes/:classeId/emploi-du-temps
export const createCreneau = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const user = req.user!;

    const data = createCreneauSchema.parse(req.body);

    if (data.heureDebut >= data.heureFin) {
      return res
        .status(400)
        .json({ error: "L'heure de fin doit être après l'heure de début." });
    }

    const classe = await prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) return res.status(404).json({ error: "Classe non trouvée." });

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (data.matiereId) {
      const matiere = await prisma.matiere.findFirst({
        where: { id: data.matiereId, classeId },
      });
      if (!matiere) {
        return res
          .status(404)
          .json({ error: "Matière non trouvée dans cette classe." });
      }
    }

    const creneau = await prisma.creneauHoraire.create({
      data: {
        classeId,
        schoolId: classe.schoolId,
        jour: data.jour,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        intutile: data.intutile ?? null,
        matiereId: data.matiereId ?? null,
        couleur: data.couleur ?? null,
      },
      include: { matiere: { select: { id: true, nom: true } } },
    });

    res.status(201).json(creneau);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: err.issues });
    if ((err as any)?.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un créneau existe déjà pour ce jour et cet horaire." });
    }
    console.error("Erreur createCreneau:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// PUT /api/classes/:classeId/emploi-du-temps/:id
export const updateCreneau = async (req: Request, res: Response) => {
  try {
    const { classeId, id } = req.params as { classeId: string; id: string };
    const user = req.user!;

    const data = createCreneauSchema.parse(req.body);

    if (data.heureDebut >= data.heureFin) {
      return res
        .status(400)
        .json({ error: "L'heure de fin doit être après l'heure de début." });
    }

    const existing = await prisma.creneauHoraire.findUnique({ where: { id } });
    if (!existing || existing.classeId !== classeId) {
      return res.status(404).json({ error: "Créneau non trouvé." });
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== existing.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (data.matiereId) {
      const matiere = await prisma.matiere.findFirst({
        where: { id: data.matiereId, classeId },
      });
      if (!matiere) {
        return res
          .status(404)
          .json({ error: "Matière non trouvée dans cette classe." });
      }
    }

    const updated = await prisma.creneauHoraire.update({
      where: { id },
      data: {
        jour: data.jour,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        intutile: data.intutile ?? null,
        matiereId: data.matiereId ?? null,
        couleur: data.couleur ?? null,
      },
      include: { matiere: { select: { id: true, nom: true } } },
    });

    res.status(200).json(updated);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: err.issues });
    if ((err as any)?.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Un créneau existe déjà pour ce jour et cet horaire." });
    }
    console.error("Erreur updateCreneau:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// DELETE /api/classes/:classeId/emploi-du-temps/:id
export const deleteCreneau = async (req: Request, res: Response) => {
  try {
    const { classeId, id } = req.params as { classeId: string; id: string };
    const user = req.user!;

    const existing = await prisma.creneauHoraire.findUnique({ where: { id } });
    if (!existing || existing.classeId !== classeId) {
      return res.status(404).json({ error: "Créneau non trouvé." });
    }

    if (user.role !== "SUDO_ADMIN" && user.schoolId !== existing.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    await prisma.creneauHoraire.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Erreur deleteCreneau:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};
