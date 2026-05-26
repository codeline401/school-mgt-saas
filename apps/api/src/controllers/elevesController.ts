import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

import { createEleveSchema } from "../schemas/eleveSchema.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";

// =============================================================================
// SCHÉMAS ZOD — Validation des données d'import Excel
// =============================================================================

/**
 * Schéma de validation pour une ligne du fichier Excel.
 * Le champ `classe` contient le NOM de la classe (ex: "6ème A"),
 * pas son UUID — la résolution nom → id est faite côté contrôleur.
 */
const importRowSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  classe: z.string().min(1), // nom lisible de la classe (ex: "6ème A")
  dateNaissance: z.string().optional(), // format YYYY-MM-DD attendu
  telephone: z.string().optional(),
  adresse: z.string().optional(),
});

/**
 * Schéma racine du body POST /api/eleves/import.
 * Limite à 500 élèves par appel pour éviter les abus.
 */
const importElevesSchema = z.object({
  eleves: z.array(importRowSchema).min(1).max(500),
});

// =============================================================================
// CONTRÔLEUR — POST /api/eleves/import
// =============================================================================

/**
 * Importe une liste d'élèves en masse depuis un fichier Excel (parsé côté client).
 *
 * Flux :
 *  1. Valide le rôle (ADMIN / SUDO_ADMIN uniquement).
 *  2. Charge toutes les classes de l'école pour construire un Map nom → id.
 *  3. Itère sur chaque ligne : résout la classe, crée l'élève en base.
 *  4. Les lignes en erreur (classe introuvable, doublon, etc.) sont collectées
 *     et renvoyées au client sans bloquer le reste de l'import.
 *
 * Réponse : { created: number, errors: Array<{ ligne, nom, prenom, raison }> }
 */
export const importEleves = async (req: Request, res: Response) => {
  try {
    const { role, schoolId } = req.user!;

    // Seuls les administrateurs peuvent importer des élèves en masse
    if (role !== "ADMIN" && role !== "SUDO_ADMIN") {
      return res.status(403).json({ error: "Accès refusé." });
    }
    if (!schoolId) {
      return res.status(400).json({ error: "Aucune école associée." });
    }

    // Validation du corps de la requête
    const parsed = importElevesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.flatten() });
    }

    // Charger toutes les classes de l'école pour résoudre nom → UUID
    // (comparaison insensible à la casse et aux espaces superflus)
    const classes = await prisma.classe.findMany({
      where: { schoolId },
      select: { id: true, nom: true },
    });
    const classeMap = new Map(
      classes.map((c) => [c.nom.toLowerCase().trim(), c.id]),
    );

    // Accumulateurs de résultats
    const created: string[] = [];
    const errors: {
      ligne: number;
      nom: string;
      prenom: string;
      raison: string;
    }[] = [];

    for (let i = 0; i < parsed.data.eleves.length; i++) {
      const row = parsed.data.eleves[i]!;

      // Résolution du nom de classe → UUID Prisma
      const classeId = classeMap.get(row.classe.toLowerCase().trim());

      if (!classeId) {
        // Classe inconnue : on log l'erreur et on passe à la ligne suivante
        errors.push({
          ligne: i + 2, // +2 : ligne 1 = en-tête, i commence à 0
          nom: row.nom,
          prenom: row.prenom,
          raison: `Classe "${row.classe}" introuvable`,
        });
        continue;
      }

      // Validation du format de date par ligne — évite de rejeter tout le lot
      // si une seule date est mal saisie (ex: "05/20/2010" au lieu de "2010-05-20")
      if (row.dateNaissance && !/^\d{4}-\d{2}-\d{2}$/.test(row.dateNaissance)) {
        errors.push({
          ligne: i + 2,
          nom: row.nom,
          prenom: row.prenom,
          raison: `Date invalide "${row.dateNaissance}" — format YYYY-MM-DD attendu`,
        });
        continue;
      }

      try {
        // Création individuelle pour capturer les erreurs par ligne
        // (ex: contrainte d'unicité nom+prenom+schoolId)
        const eleve = await prisma.eleve.create({
          data: {
            nom: row.nom.trim(),
            prenom: row.prenom.trim(),
            classeId,
            schoolId,
            ...(row.dateNaissance
              ? {
                  // Suffixe Z pour forcer le parsing UTC et éviter
                  // les décalages de date selon le fuseau horaire du serveur
                  dateNaissance: new Date(`${row.dateNaissance}T00:00:00Z`),
                }
              : {}),
            ...(row.telephone ? { telephone: row.telephone.trim() } : {}),
            ...(row.adresse ? { adresse: row.adresse.trim() } : {}),
          },
        });
        created.push(eleve.id);
      } catch {
        // Doublon ou violation de contrainte DB
        errors.push({
          ligne: i + 2,
          nom: row.nom,
          prenom: row.prenom,
          raison: "Élève déjà existant ou erreur de création",
        });
      }
    }

    // Retourne le bilan : nombre créés + détail des lignes ignorées
    return res.status(200).json({
      created: created.length,
      errors,
    });
  } catch (err) {
    console.error("[importEleves]", err);
    return res.status(500).json({ error: "Erreur serveur lors de l'import." });
  }
};

// HELPERS pour les autorisations création et modification

// method - GET /api/eleves pour récupérer tous les élèves
export const getAllEleves = async (req: Request, res: Response) => {
  try {
    const tousLesEleves = await prisma.eleve.findMany({
      include: {
        classe: true, // Inclure les données de la classe associée à chaque élève
      },
    });
    res.status(200).json(tousLesEleves);
  } catch (error) {
    console.error("Erreur lors de la récupération des élèves:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des élèves.",
    });
  }
};

// methof - POST /api/eleves pour créer un nouvel élève
export const createEleve = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!; // Récupérer l'ID de l'école et le rôle de l'utilisateur connecté

    // Vérification du rôle
    if (role !== "ADMIN" && role !== "SUDO_ADMIN") {
      return res
        .status(403)
        .json({ error: "Vous n'avez pas la permission de créer un élève." });
    }

    if (role !== "SUDO_ADMIN" && !schoolId) {
      return res.status(400).json({
        error:
          "Vous devez être associé à une école pour créer un élève. Veuillez contacter votre administrateur.",
      });
    }

    // Valider les données d'entrée avec Zod
    const validatedData = createEleveSchema.parse(req.body);

    // Dérive l'école depuis la session authentifiée ; seul SUDO_ADMIN peut cibler
    // une école différente via le corps de la requête (protection anti-spoofing).
    const effectiveSchoolId =
      role === "SUDO_ADMIN" ? validatedData.schoolId : schoolId!;

    // Créer un nouvel élève dans la base de données
    const nouvelEleve = await prisma.eleve.create({
      data: {
        nom: validatedData.nom,
        prenom: validatedData.prenom,
        classeId: validatedData.classeId,
        schoolId: effectiveSchoolId,
        ...(validatedData.dateNaissance != null
          ? { dateNaissance: validatedData.dateNaissance }
          : {}),
        ...(validatedData.telephone != null
          ? { telephone: validatedData.telephone }
          : {}),
        ...(validatedData.adresse != null
          ? { adresse: validatedData.adresse }
          : {}),
        ...(validatedData.photoUrl != null
          ? { photoUrl: validatedData.photoUrl }
          : {}),
        ...(validatedData.parentId !== undefined
          ? { parentId: validatedData.parentId }
          : {}),
      },
    });

    res.status(201).json(nouvelEleve);
  } catch (error) {
    console.error("Erreur lors de la création de l'élève:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la création de l'élève.",
    });
  }
};

// GET /api/professeurs - liste les professeurs de l'école de l'utilisateur connecté
export const getAllProfesseurs = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!; // Récupérer l'ID de l'école et le rôle de l'utilisateur connecté

    if (role !== "SUDO_ADMIN" && !schoolId) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes rattaché à aucune école." });
    }

    const filterSchoolId =
      role === "SUDO_ADMIN"
        ? typeof req.query.schoolId === "string"
          ? req.query.schoolId
          : undefined
        : (schoolId ?? undefined);

    const professeur = await prisma.professeur.findMany({
      ...(filterSchoolId ? { where: { schoolId: filterSchoolId } } : {}),
      include: { classes: true }, // Inclure les classes associées à chaque professeur
      orderBy: { nom: "asc" }, // Trier les professeurs par nom
    });

    res.status(200).json(professeur);
  } catch (err) {
    console.error("Erreur lors de la récupération des professeurs:", err);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des professeurs.",
    });
  }
};

// DELETE /api/eleves/:id - supprimer un élève par son ID
export const deleteEleve = async (req: Request, res: Response) => {
  try {
    const { role, schoolId } = req.user!; // Récupérer le rôle de l'utilisateur connecté + school

    if (role !== "SUDO_ADMIN" && !schoolId) {
      return res
        .status(403)
        .json({ error: "Vous n'êtes rattaché à aucune école." });
    }

    // Vérification du rôle directement via req.user
    if (role !== "ADMIN" && role !== "SUDO_ADMIN") {
      return res.status(403).json({
        error:
          "Accès réfusé, vous n'avez pas la permission de supprimer cet élève!!.",
      });
    }

    const eleveId = req.params.id;

    // Vérifier si l'éllève existe
    const existingEleve = await prisma.eleve.findFirst({
      where: {
        id: eleveId as string,
        ...(role !== "SUDO_ADMIN" && schoolId ? { schoolId } : {}), // Si l'utilisateur est ADMIN, on filtre par schoolId
      },
    });

    if (!existingEleve) {
      return res.status(404).json({
        error:
          "Cet elève n'existe pas, veuillez contacter votre Administrateur!!!",
      });
    }

    await prisma.eleve.delete({
      where: { id: eleveId as string },
    });

    res
      .status(200)
      .json({ message: "Elève supprimé avec succès :", existingEleve });
  } catch (err) {
    console.error("Erreur lors de la suppréssion de l'élève", err);
    res.status(500).json({ error: "Erreur serveur!!!" });
  }
};
