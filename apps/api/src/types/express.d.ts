import { Role } from "@prisma/client";

declare global {
  // Extension de l'interface Request d'Express pour inclure les informations de l'utilisateur
  namespace Express {
    interface Request {
      user?: {
        id: string; // ID de l'utilisateur
        role: Role; // rôle effectif : un SUDO_ADMIN rattaché à une école est vu comme ADMIN
        realRole: Role; // rôle présent dans le token
        schoolId: string | null; // Ajout de schoolId pour les utilisateurs liés à une école
      };
    }
  }
}
