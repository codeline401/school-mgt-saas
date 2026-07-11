import { prisma } from "../../../lib/prisma.js"; // Ajuste le chemin selon ton projet
import { z } from "zod";
import { inscriptionSchema } from "./re.inscription.schema.js";

interface UserContext {
  schoolId: string | null;
  role: string;
}

export class InscriptionService {
  /**
   * FLUX 1 : Inscription d'un nouvel élève
   */
  // [REVIEW FIX] : Remplacement du type 'any' par z.infer<typeof inscriptionSchema> pour la sécurité du typage
  async inscrireNouvelEleve(
    data: z.infer<typeof inscriptionSchema>,
    targetSchoolId: string,
    currentUser: UserContext,
  ) {
    const userRole = currentUser.role.toUpperCase();

    if (userRole !== "ADMIN" && userRole !== "SUDO_ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    // [REVIEW FIX] : Validation centralisée de l'existence et de l'appartenance de la classe à l'école cible
    const classeCible = await prisma.classe.findUnique({
      where: { id: data.classeId },
      select: { schoolId: true },
    });
    if (!classeCible) {
      throw new Error("CLASSE_NOT_FOUND");
    }
    if (classeCible.schoolId !== targetSchoolId) {
      throw new Error("INVALID_CLASSE_SCHOOL_MISMATCH");
    }

    return await prisma.eleve.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
        classeId: data.classeId,
        schoolId: targetSchoolId,
      },
    });
  }

  /**
   * FLUX 2 : Liaison / Réinscription / Transfert d'un élève existant
   */
  async reinscrireEleveExistant(
    eleveId: string,
    classeId: string,
    targetSchoolId: string,
    currentUser: UserContext,
  ) {
    const userRole = currentUser.role.toUpperCase();

    // 1. Vérification : Est-ce que l'élève existe bel et bien ?
    const eleve = await prisma.eleve.findUnique({ where: { id: eleveId } });
    if (!eleve) {
      throw new Error("ELEVE_NOT_FOUND");
    }

    // 2. Sécurité anti-spoofing : Un ADMIN ne peut pas toucher à un élève d'une AUTRE école
    if (userRole !== "SUDO_ADMIN" && eleve.schoolId !== currentUser.schoolId) {
      throw new Error("UNAUTHORIZED_SCHOOL_TRANSFER");
    }

    // [REVIEW FIX] : Validation centralisée de l'existence et de l'appartenance de la classe à l'école cible avant update
    const classeCible = await prisma.classe.findUnique({
      where: { id: classeId },
      select: { schoolId: true },
    });
    if (!classeCible) {
      throw new Error("CLASSE_NOT_FOUND");
    }
    if (classeCible.schoolId !== targetSchoolId) {
      throw new Error("INVALID_CLASSE_SCHOOL_MISMATCH");
    }

    // 3. Optimisation : Éviter de réinscrire inutilement dans la MÊME classe et MÊME école
    if (eleve.classeId === classeId && eleve.schoolId === targetSchoolId) {
      throw new Error("ALREADY_ENROLLED_IN_CLASS");
    }

    // 4. Tout est OK -> Mise à jour (Réinscription / Transfert)
    return await prisma.eleve.update({
      where: { id: eleveId },
      data: {
        classeId: classeId,
        schoolId: targetSchoolId,
      },
      include: {
        classe: true,
      },
    });
  }
}
