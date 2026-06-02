/**
 * @file bulletinTemplateController.ts
 * @description Contrôlleur pour le canevas personnalisé des bulletins scolaires.
 *
 * EndPoints :
 *  GET /api/bulletin-template -> lit le canevas de l'école de l'utilisateur connecté
 *  PUT /api/bulletin-template -> crée ou met à jour le canevas (upsert)
 *
 * Accès :
 *  - Lecture : ADMIN, SUDO_ADMIN, USER
 *  - Ecriture : ADMIN, SUDO_ADMIN, USER
 *
 * Le canevas esy unique par école (contrainte @unique sur schoolId)
 * Les champs manquants sont fusionnés avec DEFAULT_BULLETIN_CONFIG.
 */

import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/prisma/client.js";
import type { BulletinTemplateConfig } from "@school-mgt/types";

// Défaut local (même valeurs que DEFAULT_BULLETIN_CONFIG dans @school-mgt/types).
// On évite d'importer une valeur runtime depuis le package de types pour ne pas
// bloquer la résolution ESM de Node.js (le package n'expose que des types).
const DEFAULT_BULLETIN_CONFIG: BulletinTemplateConfig = {
  enteteTexte: "Bulletin scolaire",
  anneeTexte: "2025-2026",
  piedTexte: "Le Directeur : _______________________",
  showRang: true,
  showCoef: true,
  showNbEval: false,
  seuilBien: 14,
  seuilAssezBien: 12,
  seuilPassable: 10,
};

// GET /api/bulletin-template

/**
 * Retourne le canevas de bulletin de l'école de l'utilisateur connecté.
 * Si aucun canevas n'existe, renvoie un objet avec les valeurs par défaut.
 * (sans créer d'entrée en base)
 */
export const getBulletinTemplate = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!; // on suppose que req.user est défini grâce à un middleware d'authentification

    // SUDO_ADMIN n'appartient à aucune école, il ne peut pas gérer un canevas.
    if (role === "SUDO_ADMIN" || !schoolId) {
      return res
        .status(400)
        .json({ error: "SUDO_ADMIN n'est pas rattaché à une école" });
    }

    const template = await prisma.bulletinTemplate.findUnique({
      where: { schoolId },
    });

    if (!template) {
      // Pas encore de canevas: on renvoie les valeurs par défaut sans persister.
      return res.json({
        id: null, // pas d'ID car pas d'entrée en base
        schoolId,
        config: DEFAULT_BULLETIN_CONFIG,
        createdAt: null,
        updatedAt: null,
      });
    }

    // Fusionner avec les défauts pour garantir la complétude du JSON
    // (protection contre des migrations futures ajoutant de nouveaus champs)
    const config: BulletinTemplateConfig = {
      ...DEFAULT_BULLETIN_CONFIG,
      ...(template.config as Partial<BulletinTemplateConfig>), // on suppose que template.config est de type BulletinTemplateConfig ou un subset
    };

    return res.json({ ...template, config });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du canevas de bulletin:",
      error,
    );
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

// PUT /api/bulletin-template

/**
 * Crée ou met à jour le canevas de bulletin de l'école de l'utilisateur connecté
 * Seuls les champs présents dans BulletinTemplateConfig sont accéptés ;
 * les autre pro^priétés du body sont ignorées.
 *
 * @body Partial<BulletinTemplateConfig> - les champs à modifier
 */
export const upsertBulletinTemplate = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!; //

    if (role === "SUDO_ADMIN" || !schoolId) {
      return res
        .status(400)
        .json({ error: "SUDO_ADMIN n'est pas rattaché à une école" });
    }

    // Récupérer la config existante pour faire un merge partial
    const existing = await prisma.bulletinTemplate.findUnique({
      where: { schoolId },
      select: { config: true },
    });

    const existingConfig: BulletinTemplateConfig = {
      ...DEFAULT_BULLETIN_CONFIG,
      ...((existing?.config as Partial<BulletinTemplateConfig>) ?? {}),
    };

    // N'accepter que les clés connues (éviter d'injecter des champs arbitraires)
    const allowed: (keyof BulletinTemplateConfig)[] = [
      "enteteTexte",
      "anneeTexte",
      "piedTexte",
      "showRang",
      "showCoef",
      "showNbEval",
      "seuilBien",
      "seuilAssezBien",
      "seuilPassable",
    ];

    const incoming = req.body as Record<string, unknown>; //
    const patch: Partial<BulletinTemplateConfig> = {};
    for (const key of allowed) {
      if (key in incoming) {
        // Tanstypagesécurisé : on valide les types attendus
        const val = incoming[key];
        if (
          (typeof val === "string" &&
            ["enteteTexte", "anneeTexte", "piedTexte"].includes(key)) ||
          (typeof val === "boolean" &&
            ["showRang", "showCoef", "showNbEval"].includes(key)) ||
          (typeof val === "number" &&
            ["seuilBien", "seuilAssezBien", "seuilPassable"].includes(key))
        ) {
          (patch as Record<string, unknown>)[key] = val;
        }
      }
    }

    const newConfig: BulletinTemplateConfig = { ...existingConfig, ...patch };

    const template = await prisma.bulletinTemplate.upsert({
      where: { schoolId },
      create: { schoolId, config: newConfig as unknown as Prisma.InputJsonValue },
      update: { config: newConfig as unknown as Prisma.InputJsonValue },
    });

    return res.json({ ...template, config: newConfig });
  } catch (err) {
    console.error("[bulletinTemplate] PUT error: ", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
