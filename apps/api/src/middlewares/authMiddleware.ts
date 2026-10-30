import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../generated/prisma/enums.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET_VERIFIED: string = JWT_SECRET;

// 1. Middleware pour vérifier que l'utilisateur est connecté
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization; // Récupère le token depuis les headers

  const bearerMatch = authHeader?.trim().match(/^Bearer\s+(\S+)$/i); // Vérifie que le token est au format "Bearer <token>" et extrait le token
  if (!bearerMatch) {
    // Vérifie que le token est présent et bien formaté
    return res.status(401).json({ error: "Non autorisé, token manquant" }); // 401 Unauthorized
  }

  const token = bearerMatch[1]; // Extrait le token

  if (!token) {
    return res.status(401).json({ error: "Non autorisé, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_VERIFIED);

    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "string" ||
      !Object.values(Role).includes(decoded.role as Role) ||
      (decoded.schoolId !== null && typeof decoded.schoolId !== "string")
    ) {
      return res.status(401).json({ error: "Non autorisé, token invalide" });
    }

    const realRole = decoded.role as Role;
    req.user = {
      id: decoded.id,
      // Un SUDO_ADMIN ayant choisi une école est restreint à celle-ci comme un ADMIN
      role:
        realRole === Role.SUDO_ADMIN && decoded.schoolId
          ? Role.ADMIN
          : realRole,
      realRole,
      schoolId: decoded.schoolId,
    }; // Stocke uniquement les claims attendus
    next(); // Passe au middleware suivant
  } catch (error) {
    res.status(401).json({ error: "Non autorisé, token invalide" }); // 401 Unauthorized
    console.error("Erreur d'authentification:", error);
  }
};

// 2. Middleware pour vérifier que l'utilisateur a le bon role
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Vérifie que l'utilisateur est authentifié et que son rôle est dans la liste des rôles autorisés
    if (!req.user) {
      return res.status(401).json({ error: "Non autorisé" });
    }
    if (
      !allowedRoles.includes(req.user.role) &&
      !allowedRoles.includes(req.user.realRole)
    ) {
      return res.status(403).json({ error: "Accès refusé, rôle non autorisé" });
    }
    next(); // Passe au middleware suivant si le rôle est autorisé
  };
};
