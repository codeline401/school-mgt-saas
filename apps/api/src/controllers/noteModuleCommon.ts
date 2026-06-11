import { prisma } from "../lib/prisma.js";
import { Response } from "express";

/**
 * Vérifie l'accès multi-tenant à une ressourcee d'école.
 * SUDO_ADMIN peut accéder à toutes les écoles.
 */
export function isAuthorizedForSchool(
  userRole: string,
  userSchoolId: string | null | undefined,
  ressourceSchoolId: string,
): boolean {
  if (userRole === "SUDO_ADMIN") return true; // SUDO_ADMIN a accès à toutes les écoles
  return userSchoolId === ressourceSchoolId; // Les autres rôles doivent appartenir à la même école que la ressource
}

/**
 * ROles autorisés à modifier les sous-modules Notes avancés
 */
export function canEditNotesAdvanced(role: string): boolean {
  return role === "ADMIN" || role === "SUDO_ADMIN" || role === "PROF";
}

/**
 * Récupere et valide qu'une classe existe
 */
export async function requireClasse(classeId: string) {
  return prisma.classe.findUnique({ where: { id: classeId } });
}

/**
 * Réponse standardisée quand une classe n'existe pas.
 */
export function classNotFound(res: Response) {
  return res.status(404).json({ error: "Classe non trouvée" });
}

/**
 * Réponse standardisée d'accès refusé
 */
export function forbiddenAcces(res: Response) {
  return res.status(403).json({ error: "Accès refusé" });
}
