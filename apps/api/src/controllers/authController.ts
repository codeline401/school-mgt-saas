import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { registerSchema, loginSchema } from "../schemas/authSchema.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_token";

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

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        ...(data.schoolId !== undefined && { schoolId: data.schoolId }), // Ajout conditionnel de schoolId uniquement s'il est fourni
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
