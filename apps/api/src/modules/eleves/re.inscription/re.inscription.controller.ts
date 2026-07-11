import { Request, Response } from "express";
import { InscriptionService } from "./re.inscription.service.js";
import {
  inscriptionSchema,
  reinscriptionSchema,
} from "./re.inscription.schema.js";
import { prisma } from "../../../lib/prisma.js";

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
      userRole === "SUDO_ADMIN" ? validatedData.schoolId : schoolId!;
    if (!effectiveSchoolId) {
      return res
        .status(400)
        .json({ error: "Le paramètre schoolId est requis pour ce rôle." });
    }

    // 3. Appel au service
    const nouvelEleve = await service.inscrireNouvelEleve(
      validatedData,
      effectiveSchoolId,
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

    // DETERMINATION AUTOMATIQUE DU SCHOOL ID
    let effectiveSchoolId = schoolId;

    if (userRole === "SUDO_ADMIN") {
      // Si le SUDO_ADMIN l'a passé manuellement dans le body, on l'utilise
      if (validatedData.schoolId) {
        effectiveSchoolId = validatedData.schoolId;
      } else {
        // Sinon, on va chercher l'école directement liée à la classe choisie !
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
      return res
        .status(400)
        .json({ error: "Impossible de déterminer l'école de destination." });
    }

    // Appel au service
    const eleveMisAJour = await service.reinscrireEleveExistant(
      validatedData.eleveId,
      validatedData.classeId,
      effectiveSchoolId,
      { schoolId: schoolId!, role: userRole },
    );

    return res
      .status(200)
      .json({ message: "Élève réinscrit avec succès", eleve: eleveMisAJour });
  } catch (error: any) {
    // ... ton catch existant
  }
};
