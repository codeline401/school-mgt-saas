import {
  AvertissementDeliberation,
  DecisionPassage,
  DeliberationStatut,
  MentionDeliberation,
  Role,
} from "../generated/prisma/enums.js";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  createSessionsSchema,
  updateSessionsSchema,
  upsertDecisionSchema,
} from "../schemas/deliberationSchema.js";
import { ZodError } from "zod";

function isAuthorizedForSchool(
  userRole: string,
  userSchoolId: string | null | undefined,
  ressourceSchoolId: string,
): boolean {
  if (userRole === "SUDO_ADMIN") return true; // SUDO_ADMIN a accès à toutes les écoles
  return userSchoolId === ressourceSchoolId; // Les autres rôles doivent appartenir à la même école que la ressource
}

function canEdit(role: Role): boolean {
  return role === Role.SUDO_ADMIN || role === Role.ADMIN || role === Role.USER;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100; // Arrondi à 2 décimales
}

function getTauxReussite(
  decision: Array<{ decision: DecisionPassage }>,
): number | null {
  if (!decision.length) return null; // Pas de décision, taux de réussite indéterminé
  const succes = decision.filter(
    (d) => d.decision === DecisionPassage.PASSE,
  ).length;
  return round2((succes / decision.length) * 100); // Taux de réussite en pourcentage
}

export const getClasseDeliberation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { classeId } = req.params as { classeId: string }; // Récupération de l'ID de la classe depuis les paramètres de la requête

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // Recherche de la classe dans la base de données
    if (!classe) {
      return res.status(404).json({ message: "Classe non trouvée" }); // Si la classe n'existe pas, renvoyer une erreur 404
    }

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à accéder à cette classe, renvoyer une erreur 403
    }

    const sessions = await prisma.deliberationSession.findMany({
      where: { classeId },
      include: {
        decisions: {
          include: {
            eleve: { select: { id: true, nom: true, prenom: true } },
          },
          orderBy: [{ eleve: { nom: "asc" } }, { eleve: { prenom: "asc" } }],
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const result = sessions.map((session) => ({
      ...session, // Ajout du taux de réussite calculé à partir des décisions de la session
      tauxReussite:
        session.statut === DeliberationStatut.VALIDEE // Le taux de réussite n'est calculé que pour les sessions validées
          ? getTauxReussite(
              session.decisions.map((d) => ({ decision: d.decision })),
            )
          : null, // Si la session n'est pas encore validée, le taux de réussite est indéterminé
    }));

    return res.status(200).json(result); // Renvoi de la liste des sessions de délibération avec les taux de réussite
  } catch (err: unknown) {
    console.error(
      "Erreur lors de la récupération des sessions de délibération :",
      err,
    );
    return res.status(500).json({ message: "Erreur serveur" }); // En cas d'erreur, renvoyer une erreur 500
  }
};

export const createDeliberationSession = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!canEdit(req.user!.role)) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à créer une session de délibération, renvoyer une erreur 403
    }

    const { classeId } = req.params as { classeId: string }; // Récupération de l'ID de la classe depuis les paramètres de la requête
    const payload = createSessionsSchema.parse(req.body); // Validation du corps de la requête avec Zod

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // Recherche de la classe dans la base de données
    if (!classe) {
      return res.status(404).json({ message: "Classe non trouvée" }); // Si la classe n'existe pas, renvoyer une erreur 404
    }

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à accéder à cette classe, renvoyer une erreur 403
    }

    const newSession = await prisma.deliberationSession.create({
      data: {
        classeId,
        schoolId: classe.schoolId,
        periodeLabel: payload.periodeLabel,
        anneeScolaire: payload.anneeScolaire,
        compteRendu: payload.compteRendu ?? null,
        createdById: req.user!.id,
      },
      include: { decisions: true }, // Inclure les décisions associées à la session créée
    });

    return res.status(201).json(newSession); // Renvoi de la session de délibération nouvellement créée
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ message: "Données invalides", errors: err.issues }); // En cas d'erreur de validation, renvoyer une erreur 400 avec les détails des erreurs
    }
    console.error(
      "Erreur lors de la création de la session de délibération :",
      err,
    );
    return res.status(500).json({ message: "Erreur serveur" }); // En cas d'erreur, renvoyer une erreur 500
  }
};

export const updateDeliberationSession = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!canEdit(req.user!.role)) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à modifier une session de délibération, renvoyer une erreur 403
    }

    const { classeId, sessionId } = req.params as {
      classeId: string;
      sessionId: string;
    }; // Récupération de l'ID de la classe et de la session depuis les paramètres de la requête
    const payload = updateSessionsSchema.parse(req.body); // Validation du corps de la requête avec Zod

    const session = await prisma.deliberationSession.findFirst({
      where: { id: sessionId, classeId },
    });
    if (!session) {
      return res
        .status(404)
        .json({ message: "Session de délibération non trouvée" }); // Si la session de délibération n'existe pas, renvoyer une erreur 404
    }

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        session.schoolId,
      )
    ) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à accéder à cette session de délibération, renvoyer une erreur 403
    }

    if (session.statut === DeliberationStatut.VALIDEE) {
      return res.status(400).json({
        message: "Impossible de modifier une session de délibération validée",
      }); // Si la session de délibération est déjà validée, renvoyer une erreur 400
    }

    const updatedSession = await prisma.deliberationSession.update({
      where: { id: sessionId },
      data: {
        ...(payload.periodeLabel !== undefined
          ? { periodeLabel: payload.periodeLabel }
          : {}),
        ...(payload.anneeScolaire !== undefined
          ? { anneeScolaire: payload.anneeScolaire }
          : {}),
        ...(payload.compteRendu !== undefined
          ? { compteRendu: payload.compteRendu }
          : {}),
      },
      include: { decisions: true }, // Inclure les décisions associées à la session mise à jour
    });

    return res.status(200).json(updatedSession); // Renvoi de la session de délibération mise à jour
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ message: "Données invalides", errors: err.issues }); // En cas d'erreur de validation, renvoyer une erreur 400 avec les détails des erreurs
    }
    console.error(
      "Erreur lors de la mise à jour de la session de délibération :",
      err,
    );
    return res.status(500).json({ message: "Erreur serveur" }); // En cas d'erreur, renvoyer une erreur 500
  }
};

export const upsertDeliberationDecisions = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!canEdit(req.user!.role)) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à modifier les décisions de délibération, renvoyer une erreur 403
    }

    const { classeId, sessionId } = req.params as {
      classeId: string;
      sessionId: string;
    }; // Récupération de l'ID de la classe et de la session depuis les paramètres de la requête
    const payload = upsertDecisionSchema.parse(req.body); // Validation du corps de la requête avec Zod

    const session = await prisma.deliberationSession.findFirst({
      where: { id: sessionId, classeId },
    });
    if (!session) {
      return res
        .status(404)
        .json({ message: "Session de délibération non trouvée" }); // Si la session de délibération n'existe pas, renvoyer une erreur 404
    }

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        session.schoolId,
      )
    ) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à accéder à cette session de délibération, renvoyer une erreur 403
    }

    if (session.statut === DeliberationStatut.VALIDEE) {
      return res.status(400).json({
        error:
          "Impossible de modifier les décisions d'une session de délibération validée",
      }); // Si la session de délibération est déjà validée, renvoyer une erreur 400
    }

    const eleves = await prisma.eleve.findMany({
      where: { classeId },
      select: { id: true },
    });
    const eleveIds = new Set(eleves.map((e) => e.id)); // Récupération des IDs des élèves de la classe pour validation

    const invalid = payload.decisions.find((d) => !eleveIds.has(d.eleveId)); // Vérification que tous les élèves mentionnés dans les décisions appartiennent bien à la classe
    if (invalid) {
      return res.status(400).json({
        error: `Élève avec ID ${invalid.eleveId} n'appartient pas à la classe`,
      }); // Si une décision fait référence à un élève qui n'appartient pas à la classe, renvoyer une erreur 400
    }

    await prisma.$transaction(
      payload.decisions.map((d) =>
        prisma.deliberationDecision.upsert({
          where: { sessionId_eleveId: { sessionId, eleveId: d.eleveId } },
          update: {
            decision: d.decision,
            mention: d.mention ?? MentionDeliberation.AUCUNE,
            avertissement: d.avertissement ?? AvertissementDeliberation.AUCUN,
            commentaire: d.commentaire ?? null,
          },
          create: {
            sessionId,
            eleveId: d.eleveId,
            decision: d.decision,
            mention: d.mention ?? MentionDeliberation.AUCUNE,
            avertissement: d.avertissement ?? AvertissementDeliberation.AUCUN,
            commentaire: d.commentaire ?? null,
          },
        }),
      ),
    );

    const refreshed = await prisma.deliberationSession.findUnique({
      where: { id: sessionId },
      include: {
        decisions: {
          include: {
            eleve: { select: { id: true, nom: true, prenom: true } },
          },
          orderBy: [{ eleve: { nom: "asc" } }, { eleve: { prenom: "asc" } }],
        },
      },
    });

    return res.status(200).json(refreshed); // Renvoi de la session de délibération avec les décisions mises à jour
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ message: "Données invalides", errors: err.issues }); // En cas d'erreur de validation, renvoyer une erreur 400 avec les détails des erreurs
    }
    console.error("Erreur upsertDeliberationDecisions :", err);
    return res.status(500).json({ message: "Erreur serveur" }); // En cas d'erreur, renvoyer une erreur 500
  }
};

export const validateDeliberationSession = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!canEdit(req.user!.role)) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à valider une session de délibération, renvoyer une erreur 403
    }

    const { classeId, sessionId } = req.params as {
      classeId: string;
      sessionId: string;
    }; // Récupération de l'ID de la classe et de la session depuis les paramètres de la requête

    const session = await prisma.deliberationSession.findFirst({
      where: { id: sessionId, classeId },
      include: { decisions: true },
    });
    if (!session) {
      return res
        .status(404)
        .json({ message: "Session de délibération non trouvée" }); // Si la session de délibération n'existe pas, renvoyer une erreur 404
    }

    if (
      !isAuthorizedForSchool(
        req.user!.role,
        req.user!.schoolId,
        session.schoolId,
      )
    ) {
      return res.status(403).json({ message: "Accès refusé" }); // Si l'utilisateur n'est pas autorisé à accéder à cette session de délibération, renvoyer une erreur 403
    }

    if (session.statut === DeliberationStatut.VALIDEE) {
      return res
        .status(400)
        .json({ message: "Session de délibération déjà validée" }); // Si la session de délibération est déjà validée, renvoyer une erreur 400
    }

    if (!session.decisions.length) {
      return res.status(400).json({
        message:
          "Impossible de valider une session de délibération sans décisions",
      }); // Si la session de délibération ne contient aucune décision, renvoyer une erreur 400
    }

    const updatedSession = await prisma.deliberationSession.update({
      where: { id: sessionId },
      data: {
        statut: DeliberationStatut.VALIDEE,
        validatedAt: new Date(),
        validatedById: req.user!.id,
      },
      include: { decisions: true }, // Inclure les décisions associées à la session validée
    });

    const tauxReussite = getTauxReussite(
      updatedSession.decisions.map((d) => ({ decision: d.decision })),
    ); // Calcul du taux de réussite à partir des décisions de la session

    return res
      .status(200)
      .json({ session: updatedSession, tauxReussiteClasse: tauxReussite }); // Renvoi de la session de délibération validée avec le taux de réussite
  } catch (err: unknown) {
    console.error(
      "Erreur lors de la validation de la session de délibération :",
      err,
    );
    return res.status(500).json({ message: "Erreur serveur" }); // En cas d'erreur, renvoyer une erreur 500
  }
};
