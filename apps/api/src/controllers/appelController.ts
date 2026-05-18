import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  createAppelSchema,
  updatePresenceSchema,
} from "../schemas/appelSchema.js";
import { ZodError } from "zod";

const WRITE_ROLES = ["SUDO_ADMIN", "ADMIN", "PROF"];

// ── Helper : matières enseignées par le prof connecté ─────────────────────
async function getProfMatiereIds(userId: string): Promise<string[] | null> {
  const prof = await prisma.professeur.findFirst({
    where: { userId },
    select: { matieres: { select: { id: true } } },
  });
  if (!prof) return null;
  return prof.matieres.map((m) => m.id);
}

// ── Helper d'autorisation ──────────────────────────────────────────────────
async function authorizeClasse(
  classeId: string,
  userRole: string,
  userSchoolId: string | undefined,
): Promise<{ classeId: string; schoolId: string } | null> {
  const classe = await prisma.classe.findUnique({ where: { id: classeId } });
  if (!classe) return null;
  if (userRole !== "SUDO_ADMIN" && userSchoolId !== classe.schoolId)
    return null;
  return { classeId: classe.id, schoolId: classe.schoolId };
}

// GET /api/classes/:classeId/appels?date=YYYY-MM-DD
export const getAppels = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const { date } = req.query as { date?: string };
    const user = req.user!;

    const scope = await authorizeClasse(
      classeId,
      user.role,
      user.schoolId as string,
    );
    if (!scope)
      return res
        .status(404)
        .json({ error: "Classe non trouvée ou accès refusé." });

    const appels = await prisma.appel.findMany({
      where: { classeId, ...(date ? { date } : {}) },
      include: {
        creneau: {
          select: {
            id: true,
            jour: true,
            heureDebut: true,
            heureFin: true,
            intitule: true,
            couleur: true,
            matiere: { select: { id: true, nom: true } },
          },
        },
        presences: {
          include: { eleve: { select: { id: true, nom: true, prenom: true } } },
          orderBy: { eleve: { nom: "asc" } },
        },
      },
      orderBy: { date: "desc" },
    });

    res.status(200).json(appels);
  } catch (err) {
    console.error("Erreur getAppels:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// GET /api/classes/:classeId/appels/:appelId
export const getAppel = async (req: Request, res: Response) => {
  try {
    const { classeId, appelId } = req.params as {
      classeId: string;
      appelId: string;
    };
    const user = req.user!;

    const scope = await authorizeClasse(
      classeId,
      user.role,
      user.schoolId as string,
    );
    if (!scope)
      return res
        .status(404)
        .json({ error: "Classe non trouvée ou accès refusé." });

    const appel = await prisma.appel.findUnique({
      where: { id: appelId },
      include: {
        creneau: {
          select: {
            id: true,
            jour: true,
            heureDebut: true,
            heureFin: true,
            intitule: true,
            couleur: true,
            matiere: { select: { id: true, nom: true } },
          },
        },
        presences: {
          include: { eleve: { select: { id: true, nom: true, prenom: true } } },
          orderBy: { eleve: { nom: "asc" } },
        },
      },
    });

    if (!appel || appel.classeId !== classeId) {
      return res.status(404).json({ error: "Appel non trouvé." });
    }

    res.status(200).json(appel);
  } catch (err) {
    console.error("Erreur getAppel:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// POST /api/classes/:classeId/appels
// Démarre un appel (crée toutes les Presence en ABSENT par défaut)
export const createAppel = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const user = req.user!;

    if (!WRITE_ROLES.includes(user.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const data = createAppelSchema.parse(req.body);

    const classe = await prisma.classe.findUnique({
      where: { id: classeId },
      include: { eleves: { select: { id: true } } },
    });
    if (!classe) return res.status(404).json({ error: "Classe non trouvée." });
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    // Vérifier que le créneau appartient à cette classe
    const creneau = await prisma.creneauHoraire.findFirst({
      where: { id: data.creneauId, classeId },
    });
    if (!creneau)
      return res
        .status(404)
        .json({ error: "Créneau non trouvé dans cette classe." });

    // Un PROF ne peut faire l'appel que pour ses propres matières
    if (user.role === "PROF") {
      const matiereIds = await getProfMatiereIds(user.id);
      if (!matiereIds)
        return res
          .status(403)
          .json({ error: "Profil professeur introuvable." });
      if (!creneau.matiereId || !matiereIds.includes(creneau.matiereId))
        return res.status(403).json({
          error: "Vous n'enseignez pas la matière associée à ce créneau.",
        });
    }

    // Un seul appel par créneau × date
    const existing = await prisma.appel.findUnique({
      where: { creneauId_date: { creneauId: data.creneauId, date: data.date } },
    });
    if (existing) {
      return res.status(409).json({
        error: "Un appel existe déjà pour ce créneau à cette date.",
        appelId: existing.id,
      });
    }

    const appel = await prisma.appel.create({
      data: {
        creneauId: data.creneauId,
        classeId,
        schoolId: classe.schoolId,
        date: data.date,
        presences: {
          create: classe.eleves.map((e) => ({
            eleveId: e.id,
            statut: "ABSENT",
          })),
        },
      },
      include: {
        creneau: {
          select: {
            id: true,
            jour: true,
            heureDebut: true,
            heureFin: true,
            intitule: true,
            couleur: true,
            matiere: { select: { id: true, nom: true } },
          },
        },
        presences: {
          include: { eleve: { select: { id: true, nom: true, prenom: true } } },
          orderBy: { eleve: { nom: "asc" } },
        },
      },
    });

    res.status(201).json(appel);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: err.issues });
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    )
      return res.status(409).json({
        error: "Un appel existe déjà pour ce créneau à cette date.",
      });
    console.error("Erreur createAppel:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// PATCH /api/classes/:classeId/appels/:appelId/presences/:eleveId
export const updatePresence = async (req: Request, res: Response) => {
  try {
    const { classeId, appelId, eleveId } = req.params as {
      classeId: string;
      appelId: string;
      eleveId: string;
    };
    const user = req.user!;

    if (!WRITE_ROLES.includes(user.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const data = updatePresenceSchema.parse(req.body);

    const scope = await authorizeClasse(
      classeId,
      user.role,
      user.schoolId as string,
    );
    if (!scope)
      return res
        .status(404)
        .json({ error: "Classe non trouvée ou accès refusé." });

    const appel = await prisma.appel.findUnique({
      where: { id: appelId },
      select: {
        classeId: true,
        creneau: { select: { heureFin: true, matiereId: true } },
        date: true,
      },
    });
    if (!appel || appel.classeId !== classeId) {
      return res.status(404).json({ error: "Appel non trouvé." });
    }

    // Un PROF ne peut modifier les présences que pour ses propres matières
    if (user.role === "PROF") {
      const matiereIds = await getProfMatiereIds(user.id);
      if (!matiereIds)
        return res
          .status(403)
          .json({ error: "Profil professeur introuvable." });
      if (
        !appel.creneau.matiereId ||
        !matiereIds.includes(appel.creneau.matiereId)
      )
        return res.status(403).json({
          error: "Vous n'enseignez pas la matière associée à ce créneau.",
        });
    }

    // RETARD interdit après heureFin du créneau
    if (data.statut === "RETARD") {
      const now = new Date();
      const [h, m] = appel.creneau.heureFin.split(":").map(Number);
      const parts = appel.date.split("-").map(Number);
      const fin = new Date(parts[0]!, parts[1]! - 1, parts[2]!, h, m, 0, 0); // local time, no UTC shift
      if (now > fin) {
        return res.status(422).json({
          error: "Impossible de marquer un retard après la fin du cours.",
        });
      }
    }

    // Vérifier que l'élève appartient bien à cette classe
    const eleveInClasse = await prisma.eleve.findFirst({
      where: { id: eleveId, classeId },
      select: { id: true },
    });
    if (!eleveInClasse) {
      return res.status(400).json({ error: "Cet élève n'appartient pas à la classe."
      });
    }

    const presence = await prisma.presence.upsert({
      where: { appelId_eleveId: { appelId, eleveId } },
      update: { statut: data.statut },
      create: { appelId, eleveId, statut: data.statut },
      include: { eleve: { select: { id: true, nom: true, prenom: true } } },
    });

    res.status(200).json(presence);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: err.issues });
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    )
      return res.status(409).json({
        error: "Conflit de présence : enregistrement déjà existant.",
      });
    console.error("Erreur updatePresence:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// GET /api/classes/:classeId/stats/absences?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getAbsenceStats = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const { from, to } = req.query as { from?: string; to?: string };
    const user = req.user!;

    const scope = await authorizeClasse(
      classeId,
      user.role,
      user.schoolId as string,
    );
    if (!scope)
      return res
        .status(404)
        .json({ error: "Classe non trouvée ou accès refusé." });

    // Plage par défaut : mois en cours
    const today = new Date();
    const defaultFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const defaultTo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const dateFrom = from ?? defaultFrom;
    const dateTo = to ?? defaultTo;

    // Nombre d'appels sur la période
    const totalAppels = await prisma.appel.count({
      where: { classeId, date: { gte: dateFrom, lte: dateTo } },
    });

    // Élèves de la classe avec leurs présences sur la période
    const eleves = await prisma.eleve.findMany({
      where: { classeId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        presences: {
          where: {
            appel: { classeId, date: { gte: dateFrom, lte: dateTo } },
          },
          select: { statut: true },
        },
      },
      orderBy: { nom: "asc" },
    });

    const stats = eleves.map((eleve) => {
      const present = eleve.presences.filter((p) => p.statut === "PRESENT").length;
      const absent = eleve.presences.filter((p) => p.statut === "ABSENT").length;
      const retard = eleve.presences.filter((p) => p.statut === "RETARD").length;
      const appelsEleve = present + absent + retard;
      const tauxPresence =
        appelsEleve > 0
          ? Math.round(((present + retard) / appelsEleve) * 1000) / 10
          : 100;
      return {
        eleveId: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        appelsEleve, // appels où cet élève a une présence enregistrée
        present,
        absent,
        retard,
        tauxPresence,
      };
    });

    res.status(200).json({ from: dateFrom, to: dateTo, totalAppels, stats });
  } catch (err) {
    console.error("Erreur getAbsenceStats:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};
