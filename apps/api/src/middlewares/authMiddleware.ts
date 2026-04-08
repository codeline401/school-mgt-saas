import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../generated/prisma/enums";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// 1. Middleware pour vérifier que l'utilisateur est connecté
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization; // Récupère le token depuis les headers

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Vérifie que le token est présent et bien formaté
    return res.status(401).json({ error: "Non autorisé, token manquant" }); // 401 Unauthorized
  }

  const token = authHeader.split(" ")[1]!; // Extrait le token

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as {
      id: string;
      role: Role;
      schoolId: string | null;
    }; // Vérifie et décode le token
    req.user = decoded; // Stocke les informations de l'utilisateur dans la requête pour les middlewares suivants
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
