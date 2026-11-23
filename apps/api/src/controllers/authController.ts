import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { registerSchema, loginSchema } from "../schemas/authSchema.js";
import { Role } from "../generated/prisma/enums.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Vérifie si l'erreur provient d'une contrainte d'unicité Prisma (P2002)
function isUniqueConstraintError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return true;
  }
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

// Inscription d'un nouvel utilisateur
export const registerUser = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body); // Validation + normalisation email (trim + toLowerCase)

    if (
      data.role === Role.SUDO_ADMIN &&
      req.user?.realRole !== Role.SUDO_ADMIN
    ) {
      return res
        .status(403)
        .json({ error: "Création d'un SUDO_ADMIN non autorisée" });
    }

    // Vérifier si l'utilisateur existe déjà (insensible à la casse pour éviter les variantes Alice@ vs alice@)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: data.email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 12);

    let schoolId: string | null = null; // Par défaut null, sera défini selon le rôle et le code d'invitation

    // Logique selon le role
    if (data.role === Role.ADMIN) {
      // L'ADMIN n'a pas encore d'école, schoolId reste null
      // Il crééra son école plus tard dans le Dashboard après sa connexion
      schoolId = null;
    } else if (data.role === Role.SUDO_ADMIN) {
      // Le sudo-admin n'appartient à aucune école
      schoolId = null;
    } else {
      // Pour USER, PROF, ELEVE, PARENT : l'inviteCode est obligatoire pour rejoindre une école existante
      if (!data.inviteCode) {
        return res.status(400).json({
          error: "Un code d'invitation est requis pour ce type d'utilisateur",
        });
      }

      // On recherche l'école correspondante au code d'invitation
      const school = await prisma.school.findUnique({
        where: { inviteCode: data.inviteCode },
      });

      if (!school) {
        return res.status(400).json({ error: "Code d'invitation invalide" });
      }

      schoolId = school.id; // On assigne l'école trouvée à l'utilisateur
    }

    // Création de l'utilisateur avec l'email normalisé en minuscules
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        schoolId,
      },
    });

    // On ne renvoie pas le mot de passe dans la réponse
    const { password, ...userWithoutPassword } = newUser;

    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (isUniqueConstraintError(error)) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }
    console.error("Erreur lors de l'inscription:", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de l'inscription" });
  }
};

// Connexion d'un utilisateur
export const loginUser = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body); // Validation + normalisation email (trim + toLowerCase)

    // Récupère les comptes correspondant de façon insensible à la casse
    // Si d'anciens doublons de casse existent en base, on teste le mot de passe sur chaque candidat
    const candidates = await prisma.user.findMany({
      where: {
        email: {
          equals: data.email,
          mode: "insensitive",
        },
      },
      orderBy: [{ email: "asc" }, { createdAt: "asc" }],
    });

    if (candidates.length === 0) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });
    }

    // Sélectionne le compte dont le mot de passe est valide
    let matchedUser: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      const isPasswordValid = await bcrypt.compare(
        data.password,
        candidate.password,
      );
      if (isPasswordValid) {
        matchedUser = candidate;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });
    }

    let activeSchoolId = matchedUser.schoolId;

    if (matchedUser.role === Role.SUDO_ADMIN) {
      if (!data.schoolId) {
        const schools = await prisma.school.findMany({
          select: { id: true, nom: true },
          orderBy: { nom: "asc" },
        });
        // Sans école existante, le SUDO_ADMIN se connecte sans scope pour pouvoir en créer une
        if (schools.length > 0) {
          return res.status(200).json({ requireSchool: true, schools });
        }
      } else {
        const school = await prisma.school.findUnique({
          where: { id: data.schoolId },
        });
        if (!school) {
          return res.status(400).json({ error: "École introuvable" });
        }
        activeSchoolId = school.id; // école active pour la session
      }
    }

    // Générer un token JWT
    const token = jwt.sign(
      {
        id: matchedUser.id,
        role: matchedUser.role,
        schoolId: activeSchoolId,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    // On ne renvoie pas le mot de passe dans la réponse
    const { password, ...userWithoutPassword } = matchedUser;

    return res.status(200).json({
      user: {
        ...userWithoutPassword,
        schoolId: activeSchoolId,
      },
      token,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Erreur lors de la connexion:", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la connexion" });
  }
};
