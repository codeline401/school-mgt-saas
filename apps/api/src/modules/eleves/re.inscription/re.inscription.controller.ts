import { Request, Response } from "express";
import { InscriptionService } from "./re.inscription.service.js";
import {
  inscriptionSchema,
  reinscriptionSchema,
} from "./re.inscription.schema.js";
import { prisma } from "../../../lib/prisma.js";
import { ZodError } from "zod";

const service = new InscriptionService();

export const handleInscription = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;
    const userRole = role.toUpperCase();

    if (userRole !== "ADMIN" && userRole !== "SUDO_ADMIN") {
      return res.status(403).json({ error: "Action non autorisée." });
    }

    // 1. Validation Zod
    const validatedData = inscriptionSchema.parse(req.body);

    // 2. Détermination du schoolId (SUDO_ADMIN vs ADMIN standard)
    const effectiveSchoolId =
      userRole === "SUDO_ADMIN" ? (validatedData as any).schoolId : schoolId!;
    if (!effectiveSchoolId) {
      return res
        .status(400)
        .json({ error: "Le paramètre schoolId est requis pour ce rôle." });
    }

    // 3. Appel au service
    const nouvelEleve = await service.inscrireNouvelEleve(
      validatedData,
      effectiveSchoolId,
      { schoolId, role },
    );
    return res
      .status(201)
      .json({ message: "Élève inscrit avec succès", eleve: nouvelEleve });
  } catch (error: any) {
    if (error.name === "ZodError")
      return res.status(400).json({ error: error.errors });
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
};

// À l'intérieur de handleReinscription (et handleInscription) :
export const handleReinscription = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;
    const userRole = role.toUpperCase();

    if (userRole !== "ADMIN" && userRole !== "SUDO_ADMIN") {
      return res.status(403).json({ error: "Action non autorisée." });
    }

    const validatedData = reinscriptionSchema.parse(req.body);

    // [REVIEW FIX] : Retrait du bloc conditionnel de recherche de classe. Le service s'occupe de valider inconditionnellement la classe.
    let effectiveSchoolId = schoolId;

    if (userRole === "SUDO_ADMIN") {
      if (validatedData.schoolId) {
        effectiveSchoolId = validatedData.schoolId;
      } else {
        // Si le SUDO_ADMIN n'a pas fourni de schoolId, on va le chercher via la classe cible
        const classeCible = await prisma.classe.findUnique({
          where: { id: validatedData.classeId },
          select: { schoolId: true },
        });

        if (!classeCible) {
          return res
            .status(400)
            .json({ error: "La classe sélectionnée n'existe pas." });
        }
        effectiveSchoolId = classeCible.schoolId;
      }
    }

    if (!effectiveSchoolId) {
      return res.status(400).json({
        error: "Impossible de déterminer l'établissement de destination.",
      });
    }

    const eleveMisAJour = await service.reinscrireEleveExistant(
      validatedData.eleveId,
      validatedData.classeId,
      effectiveSchoolId,
      { schoolId, role },
    );

    return res
      .status(200)
      .json({ message: "Élève réinscrit avec succès", eleve: eleveMisAJour });
  } catch (error: any) {
    // [REVIEW FIX] : Gestion complète et explicite de toutes les erreurs connues avec journalisation
    console.error("Erreur détectée dans handleReinscription:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Données de formulaire invalides.",
        details: error.issues,
      });
    }

    switch (error.message) {
      case "ELEVE_NOT_FOUND":
        return res
          .status(404)
          .json({ error: "L'élève spécifié n'existe pas." });
      case "CLASSE_NOT_FOUND":
        return res
          .status(400)
          .json({ error: "La classe sélectionnée n'existe pas." });
      case "INVALID_CLASSE_SCHOOL_MISMATCH":
        return res.status(400).json({
          error:
            "La classe sélectionnée n'appartient pas à l'établissement cible.",
        });
      case "UNAUTHORIZED_SCHOOL_TRANSFER":
        return res.status(403).json({
          error:
            "Action interdite : cet élève n'appartient pas à votre établissement.",
        });
      case "ALREADY_ENROLLED_IN_CLASS":
        return res
          .status(400)
          .json({ error: "Cet élève est déjà inscrit dans cette classe." });
      case "UNAUTHORIZED":
        return res
          .status(403)
          .json({ error: "Droits insuffisants pour effectuer cette action." });
      default:
        return res
          .status(500)
          .json({ error: "Une erreur interne du serveur est survenue." });
    }
  }
};
