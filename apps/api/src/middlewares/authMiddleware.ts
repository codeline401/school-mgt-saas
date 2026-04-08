import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../generated/prisma/enums";

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

    req.user = {
      id: decoded.id,
      role: decoded.role as Role,
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
    // Retourne une fonction middleware
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      // Vérifie que l'utilisateur est authentifié et que son rôle est autorisé
      return res.status(403).json({ error: "Accès refusé, rôle non autorisé" }); // 403 Forbidden
    }
    next(); // Passe au middleware suivant si le rôle est autorisé
  };
};
