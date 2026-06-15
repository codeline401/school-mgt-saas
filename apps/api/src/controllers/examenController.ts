import { Request, Response } from "express";
import {
  canEditNotesAdvanced,
  classNotFound,
  forbiddenAcces,
  isAuthorizedForSchool,
  requireClasse,
} from "./noteModuleCommon.js";
import { prisma } from "../lib/prisma.js";
import {
  assignSurveillantSchema,
  createExamenIncidentSchema,
  createExamenPlanningSchema,
  createExamenSalleSchema,
  createExamenSessionSchema,
  updateExamenSessionSchema,
  updateExamenStatutSchema,
} from "../schemas/examenSchema.js";
import { ZodError } from "zod";

const EXAMEN_INCLUDE = {
  salle: true,
  matiere: { select: { id: true, nom: true } },
  surveillants: {
    include: { user: { select: { id: true, nom: true, prenom: true } } },
  },
  incidents: { orderBy: { createdAt: "desc" as const } },
};

/**
 * Valide l'accès de l'utilisateur à la classe demandée.
 */
async function validateClasseAccess(
  req: Request,
  res: Response,
  classeId: string,
) {
  const classe = await requireClasse(classeId);
  if (!classe) {
    classNotFound(res);
    return null;
  }

  if (
    !isAuthorizedForSchool(req.user!.role, req.user!.schoolId, classe.schoolId)
  ) {
    forbiddenAcces(res);
    return null;
  }

  return classe;
}

/**
 * Parse une date YYYY-MM-DD en UTC stable.
 */
function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * GET /api/classes/:classeId/notes/examens
 * Liste les épreuves d'examen de la classe avec salle/surveillants/incidents.
 */
export const getClasseExamens = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const classe = await validateClasseAccess(req, res, classeId);
    if (!classe) return;

    const sessions = await prisma.examenSession.findMany({
      where: { classeId },
      include: EXAMEN_INCLUDE,
      orderBy: [{ dateExamen: "asc" }, { heureDebut: "asc" }],
    });

    return res.status(200).json(sessions);
  } catch (err) {
    console.error("Erreur getClasseExamens:", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la récupération des sessions d'examen",
    });
  }
};

/**
 * GET /api/classes/:classeId/notes/examens/salles
 * Liste toutes les salles d'examen de l'école.
 */
export const getExamenSalles = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const classe = await validateClasseAccess(req, res, classeId);
    if (!classe) return;

    const salles = await prisma.examenSalle.findMany({
      where: { schoolId: classe.schoolId },
      orderBy: { nom: "asc" },
    });

    return res.status(200).json(salles);
  } catch (err) {
    console.error("Erreur getExamenSalles", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la récupération des salles d'examen",
    });
  }
};

/**
 * GET /api/classes/:classeId/notes/examens/surveillants
 * Liste les utilisateurs éligibles comme surveillants (PROF/ADMIN/SUDO_ADMIN) dans l'école.
 */
export const getExamenSurveillants = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string };
    const classe = await validateClasseAccess(req, res, classeId);
    if (!classe) return;

    const users = await prisma.user.findMany({
      where: {
        schoolId: classe.schoolId,
        role: { in: ["PROF", "ADMIN", "SUDO_ADMIN"] },
      },
      select: { id: true, nom: true, prenom: true, role: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return res.status(200).json(users);
  } catch (err) {
    console.error("Erreur getExamenSurveillants", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la récupération des surveillants",
    });
  }
};

/**
 * POST /api/classes/:classeId/notes/examens/salles
 * Crée une nouvelle salle.
 */
export const createExamenSalle = async (req: Request, res: Response) => {
  try {
    if (!canEditNotesAdvanced(req.user!.role)) return forbiddenAcces(res);

    const { classeId } = req.params as { classeId: string };
    const payload = createExamenSalleSchema.parse(req.body);
    const classe = await validateClasseAccess(req, res, classeId);
    if (!classe) return;

    const salle = await prisma.examenSalle.create({
      data: {
        nom: payload.nom,
        capacite: payload.capacite ?? null,
        location: payload.location ?? null,
        schoolId: classe.schoolId,
      },
    });

    return res.status(201).json(salle);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur createExamenSalle", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la création de la salle d'examen",
    });
  }
};

/**
 * POST /api/classes/:classeId/notes/examens
 * Crée une épreuve d'examen simple (un seul jour).
 */
export const createExamenSession = async (req: Request, res: Response) => {
  try {
    if (!canEditNotesAdvanced(req.user!.role)) return forbiddenAcces(res);

    const { classeId } = req.params as { classeId: string };
    const payload = createExamenSessionSchema.parse(req.body);
    const classe = await validateClasseAccess(req, res, classeId);
    if (!classe) return;

    const session = await prisma.examenSession.create({
      data: {
        titre: payload.titre,
        description: payload.description ?? null,
        classeId,
        matiereId: payload.matiereId ?? null,
        salleId: payload.salleId ?? null,
        schoolId: classe.schoolId,
        dateExamen: payload.dateExamen,
        heureDebut: payload.heureDebut,
        heureFin: payload.heureFin,
        createdById: req.user!.id,
        ...(payload.surveillantUserIds?.length
          ? {
              surveillants: {
                create: payload.surveillantUserIds.map((userId) => ({
                  userId,
                })),
              },
            }
          : {}),
      },
      include: EXAMEN_INCLUDE,
    });

    return res.status(201).json(session);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur createExamenSession :", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la création de l'épreuve d'examen",
    });
  }
};

/**
 * POST /api/classes/:classeId/notes/examens/planning
 * Crée une session détaillée sur plage de dates (une épreuve par jour) avec
 * matière, salle et surveillants pour chaque date.
 */
export const createExamenPlanning = async (req: Request, res: Response) => {
  try {
    if (!canEditNotesAdvanced(req.user!.role)) return forbiddenAcces(res);

    const { classeId } = req.params as { classeId: string };
    const payload = createExamenPlanningSchema.parse(req.body);
    const classe = await validateClasseAccess(req, res, classeId);
    if (!classe) return;

    const debut = parseDateOnly(payload.dateDebut);
    const fin = parseDateOnly(payload.dateFin);

    if (debut > fin) {
      return res.status(400).json({
        error:
          "La date de début ne peut pas être postérieure à la date de fin.",
      });
    }

    for (const epreuve of payload.epreuves) {
      const d = parseDateOnly(epreuve.dateExamen);
      if (d < debut || d > fin) {
        return res.status(400).json({
          error: `La date ${epreuve.dateExamen} est hors de la plage sélectionnée.`,
        });
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const createdSessions = [];
      for (const epreuve of payload.epreuves) {
        const session = await tx.examenSession.create({
          data: {
            titre: payload.titre,
            description: payload.description ?? null,
            classeId,
            matiereId: epreuve.matiereId,
            salleId: epreuve.salleId,
            schoolId: classe.schoolId,
            dateExamen: epreuve.dateExamen,
            heureDebut: epreuve.heureDebut,
            heureFin: epreuve.heureFin,
            createdById: req.user!.id,
            surveillants: {
              create: epreuve.surveillantUserIds.map((userId) => ({ userId })),
            },
          },
          include: EXAMEN_INCLUDE,
        });
        createdSessions.push(session);
      }
      return createdSessions;
    });

    return res.status(201).json({
      titre: payload.titre,
      dateDebut: payload.dateDebut,
      dateFin: payload.dateFin,
      epreuves: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur createExamenPlanning:", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la création du planning d'examen",
    });
  }
};

/**
 * PUT /api/classes/:classeId/notes/examens/:sessionId
 * Met à jour une épreuve d'examen.
 */
export const updateExamenSession = async (req: Request, res: Response) => {
  try {
    if (!canEditNotesAdvanced(req.user!.role)) return forbiddenAcces(res);

    const { classeId, sessionId } = req.params as {
      classeId: string;
      sessionId: string;
    };
    const payload = updateExamenSessionSchema.parse(req.body);

    const existingSession = await prisma.examenSession.findFirst({
      where: { id: sessionId, classeId },
    });

    if (!existingSession)
      return res.status(404).json({ error: "Session non trouvée" });

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingSession.schoolId,
      )
    ) {
      return forbiddenAcces(res);
    }

    const updatedSession = await prisma.examenSession.update({
      where: { id: sessionId },
      data: {
        ...(payload.titre !== undefined ? { titre: payload.titre } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description }
          : {}),
        ...(payload.matiereId !== undefined
          ? { matiereId: payload.matiereId }
          : {}),
        ...(payload.salleId !== undefined ? { salleId: payload.salleId } : {}),
        ...(payload.dateExamen !== undefined
          ? { dateExamen: payload.dateExamen }
          : {}),
        ...(payload.heureDebut !== undefined
          ? { heureDebut: payload.heureDebut }
          : {}),
        ...(payload.heureFin !== undefined
          ? { heureFin: payload.heureFin }
          : {}),
      },
      include: EXAMEN_INCLUDE,
    });

    return res.status(200).json(updatedSession);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur updateExamenSession :", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la mise à jour de l'épreuve",
    });
  }
};

/**
 * PUT /api/classes/:classeId/notes/examens/:sessionId/statut
 * Met à jour le statut de déroulement de l'épreuve.
 */
export const updateExamenStatut = async (req: Request, res: Response) => {
  try {
    if (!canEditNotesAdvanced(req.user!.role)) return forbiddenAcces(res);

    const { classeId, sessionId } = req.params as {
      classeId: string;
      sessionId: string;
    };

    const payload = updateExamenStatutSchema.parse(req.body);
    const existingExamenSession = await prisma.examenSession.findFirst({
      where: { id: sessionId, classeId },
    });

    if (!existingExamenSession)
      return res.status(404).json({ error: "Session d'examen introuvable" });

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingExamenSession.schoolId,
      )
    ) {
      return forbiddenAcces(res);
    }

    const updatedExamenStatut = await prisma.examenSession.update({
      where: { id: sessionId },
      data: {
        statut: payload.statut,
      },
    });

    return res.status(200).json(updatedExamenStatut);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur updateExamenStatut :", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la mise à jour du statut d'examen",
    });
  }
};

/**
 * POST /api/classes/:classeId/notes/examens/:sessionId/surveillants
 * Assigne ou met à jour les surveillants de l'épreuve.
 */
export const assignExamenSurveillants = async (req: Request, res: Response) => {
  try {
    if (!canEditNotesAdvanced(req.user!.role)) return forbiddenAcces(res);

    const { classeId, sessionId } = req.params as {
      classeId: string;
      sessionId: string;
    };
    const existingExamen = await prisma.examenSession.findFirst({
      where: { id: sessionId, classeId },
    });

    if (!existingExamen)
      return res.status(404).json({ error: "Session introuvable" });

    const payload = assignSurveillantSchema.parse(req.body);
    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingExamen.schoolId,
      )
    ) {
      return forbiddenAcces(res);
    }

    await prisma.$transaction(
      payload.assignations.map((a) =>
        prisma.examenSurveillance.upsert({
          where: { sessionId_userId: { sessionId, userId: a.userId } },
          update: { roleLabel: a.roleLabel ?? null },
          create: {
            sessionId,
            userId: a.userId,
            roleLabel: a.roleLabel ?? null,
          },
        }),
      ),
    );

    const refreshed = await prisma.examenSession.findUnique({
      where: { id: sessionId },
      include: {
        surveillants: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
          },
        },
      },
    });

    return res.status(200).json(refreshed);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur assignExamenSurveillants :", err);
    return res.status(500).json({
      error: "Erreur serveur lors de l'assignation des surveillants",
    });
  }
};

/**
 * POST /api/classes/:classeId/notes/examens/:sessionId/incidents
 * Ajoute un événement de suivi pendant l'épreuve.
 */
export const createExamenIncident = async (req: Request, res: Response) => {
  try {
    if (!canEditNotesAdvanced(req.user!.role)) return forbiddenAcces(res);

    const { classeId, sessionId } = req.params as {
      classeId: string;
      sessionId: string;
    };
    const payload = createExamenIncidentSchema.parse(req.body);
    const existingSession = await prisma.examenSession.findFirst({
      where: { id: sessionId, classeId },
    });

    if (!existingSession)
      return res.status(404).json({ error: "Session d'examen introuvable" });

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingSession.schoolId,
      )
    ) {
      return forbiddenAcces(res);
    }

    const incident = await prisma.examenIncident.create({
      data: {
        sessionId,
        type: payload.type,
        message: payload.message,
        createdById: req.user!.id,
      },
    });

    return res.status(201).json(incident);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur createExamenIncident :", err);
    return res.status(500).json({
      error: "Erreur serveur lors de la création de l'incident d'examen",
    });
  }
};
