import { prisma } from "../../../lib/prisma.js";

// interface pour typer les metadonnees de l'user qui fait l'action
interface UserContext {
  schoolId: string | null;
  role: string;
}

export class InscriptionService {
  // FLUX 1 : Création complète d'un nouvel élève
  async inscrireNouvelEleve(data: any, schoolId: string) {
    return await prisma.eleve.create({
      data: {
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        classeId: data.classeId,
        schoolId: schoolId,
        ...(data.dateNaissance
          ? { dateNaissance: new Date(`${data.dateNaissance}T00:00:00Z`) }
          : {}),
        ...(data.telephone ? { telephone: data.telephone.trim() } : {}),
        ...(data.adresse ? { adresse: data.adresse.trim() } : {}),
      },
      include: { classe: true },
    });
  }

  // FLUX 2 : Liaison/Mise à jour d'un élève existant
  /**
   * FLUX 2 : Liaison / Réinscription / Transfert d'un élève existant
   * Gère la mise à jour de classe et d'école de manière sécurisée.
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
    // Seul le SUDO_ADMIN a le droit de faire des transferts inter-écoles libres.
    if (userRole !== "SUDO_ADMIN" && eleve.schoolId !== currentUser.schoolId) {
      throw new Error("UNAUTHORIZED_SCHOOL_TRANSFER");
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
        schoolId: targetSchoolId, // Permet la réinscription locale ou le transfert d'école
      },
      include: {
        classe: true,
      },
    });
  }
}
