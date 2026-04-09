import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { registerSchema, loginSchema } from "../schemas/authSchema.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Inscription d'un nouvel utilisateur
export const registerUser = async (req: Request, res: Response) => {
  try {
    //
    const data = registerSchema.parse(req.body); // Validation des données d'entrée

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 12);

    let schoolId: string | null = null; // Par défaut null, sera défini selon le rôle et le code d'invitation

    // Logique selon le role
    if (data.role === "ADMIN") {
      // L'ADMIN n'a pas encore d'école, schoolId reste null
      // Il crééra son école plus tard dans le Dashboard après sa connexion
      schoolId = null;
    } else if (data.role === "SUDO_ADMIN") {
      // Le sudo-admin n'appartient à aucun école
      schoolId = null;
    } else {
      // Pour USER, PROF, ELEVE, PARENT : l'inviteCode est obligatoire pour rejoindre une école existante
      if (!data.inviteCode) {
        return res.status(400).json({
          error: "Un code d'invitation est requis pour ce type d'utilisateur",
        });
      }

      // On recherche l'école corrspondante au code d'invitation
      const school = await prisma.school.findUnique({
        where: { inviteCode: data.inviteCode || "" },
      });

      if (!school) {
        return res.status(400).json({ error: "Code d'invitation invalide" });
      }

      schoolId = school.id; // On assigne l'école trouvée à l'utilisateur
    }

    // Création de l'utilisateur
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

    // On ne renvoit pas le mot de passe dans la réponse
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    if (error.errors) return res.status(400).json({ error: error.errors });
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription" });
  }
};

// Connexion d'un utilisateur
export const loginUser = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body); // Validation des données d'entrée

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, schoolId: user.schoolId },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    // On ne renvoit pas le mot de passe dans la réponse
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({ user: userWithoutPassword, token });
  } catch (error: any) {
    if (error.errors) return res.status(400).json({ error: error.errors });
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ error: "Erreur serveur lors de la connexion" });
  }
};
