import { Role } from "@prisma/client";

declare global {
  // Extension de l'interface Request d'Express pour inclure les informations de l'utilisateur
  namespace Express {
    interface Request {
      user?: {
        id: string; // ID de l'utilisateur
        role: Role;
        schoolId: string | null; // Ajout de schoolId pour les utilisateurs liés à une école
      };
    }
  }
}
