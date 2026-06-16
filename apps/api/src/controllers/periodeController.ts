import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ZodError } from "zod";
import { createPeriodeSchema } from "../schemas/periodeSchema.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireSchoolId(req: Request, res: Response): string | null {
  const schoolId = req.user!.schoolId;
  if (req.user!.role !== "SUDO_ADMIN" && !schoolId) {
    res.status(403).json({ error: "Vous n'êtes rattaché à aucune école." });
    return null;
  }
  return schoolId ?? null;
}

// ─── GET /api/periodes ────────────────────────────────────────────────────────

/**
 * Retourne toutes les périodes de l'école de l'utilisateur connecté.
 * SUDO_ADMIN peut filtrer via ?schoolId=
 */
export const getPeriodes = async (req: Request, res: Response) => {
  try {
    const { role, schoolId: userSchoolId } = req.user!;

    const filterSchoolId =
      role === "SUDO_ADMIN"
        ? typeof req.query.schoolId === "string"
          ? req.query.schoolId
          : undefined
        : (userSchoolId ?? undefined);

    if (role !== "SUDO_ADMIN" && !filterSchoolId) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes rattaché à aucune école." });
    }

    const periodes = await prisma.periode.findMany({
      where: filterSchoolId ? { schoolId: filterSchoolId } : {},
      orderBy: [{ anneeScolaire: "desc" }, { nom: "asc" }],
    });

    res.status(200).json(periodes);
  } catch (err) {
    console.error("Erreur getPeriodes :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// ─── POST /api/periodes ───────────────────────────────────────────────────────

/**
 * Crée une nouvelle période pour l'école de l'utilisateur connecté.
 * Accès : ADMIN, SUDO_ADMIN
 */
export const createPeriode = async (req: Request, res: Response) => {
  try {
    const schoolId = requireSchoolId(req, res);

    if (!schoolId) {
      return res.status(400).json({
        error: "Aucune école associée pour créer une période.",
      });
    }
    const validated = createPeriodeSchema.parse(req.body);

    const periode = await prisma.periode.create({
      data: {
        nom: validated.nom,
        type: validated.type,
        anneeScolaire: validated.anneeScolaire,
        dateDebut: validated.dateDebut ? new Date(validated.dateDebut) : null,
        dateFin: validated.dateFin ? new Date(validated.dateFin) : null,
        schoolId,
      },
    });

    res.status(201).json(periode);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    if ((err as any)?.code === "P2002") {
      return res.status(409).json({
        error: "Une période avec ce nom existe déjà pour cette année scolaire.",
      });
    }
    console.error("Erreur createPeriode :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// ─── DELETE /api/periodes/:id ─────────────────────────────────────────────────

/**
 * Supprime une période.
 * Impossible si des notes y sont rattachées.
 * Accès : ADMIN, SUDO_ADMIN
 */
export const deletePeriode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const periode = await prisma.periode.findUnique({
      where: { id },
      include: { _count: { select: { notes: true } } },
    });
    if (!periode)
      return res.status(404).json({ error: "Période introuvable." });

    // Vérification d'accès
    const { role, schoolId: userSchoolId } = req.user!;
    if (role !== "SUDO_ADMIN" && userSchoolId !== periode.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    if (periode._count.notes > 0) {
      return res.status(409).json({
        error: `Impossible de supprimer cette période : ${periode._count.notes} note(s) y sont rattachées.`,
      });
    }

    await prisma.periode.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if ((err as any)?.code === "P2003") {
      return res.status(409).json({
        error:
          "Impossible de supprimer cette période : elle est encore référencée.",
      });
    }
    console.error("Erreur deletePeriode :", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};
