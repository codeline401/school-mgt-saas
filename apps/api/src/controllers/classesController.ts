import { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  createClasseSchema,
  updateClasseSchema,
} from "../schemas/classeSchema.js";

// ---- HELPERS ----------------------------------------------------------------------

/**
 * Vérifier que l'utilisateur connecté est autorisé à accéder à une ressource
 * appartenant à une écolé donnée. Le SUDO_ADMIN peut tout voir.
 */
function isAuthorizhedForSchool(
  userRole: string,
  userSchoolId: string | null | undefined,
  ressourceSchoolId: string,
): boolean {
  if (userRole === "SUDO_ADMIN") return true; // SUDO_ADMIN peut accéder à toutes les ressources
  return userSchoolId === ressourceSchoolId;
}

// GET /api/classes — liste les classes de l'école de l'utilisateur connecté
// SUDO_ADMIN peut filtrer via ?schoolId=<id>

/**
 * GET /api/classes
 * Listes les classes de l'école de l'utilisateur connecté.
 * Le SUDO_ADMIN peut filter via ?schoolId=<id>
 */
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const { schoolId: userSchoolId, role } = req.user!;

    // SUDO_ADMIN n'est rattaché à aucune école : il peut passer un schoolId en query
    // Les autres rôles doivent obligatoirement être rattachés à une école
    if (role !== "SUDO_ADMIN" && !userSchoolId) {
      return res.status(403).json({
        error: "Vous n'êtes rattaché à aucune école.",
      });
    }

    const filterSchoolId =
      role === "SUDO_ADMIN"
        ? typeof req.query.schoolId === "string"
          ? req.query.schoolId
          : undefined
        : (userSchoolId ?? undefined);

    // Un PROF ne voit que les classes auxquelles il est affecté
    if (role === "PROF") {
      const professeur = await prisma.professeur.findUnique({
        where: { userId: req.user!.id },
        include: {
          classes: {
            include: { _count: { select: { eleves: true, profs: true } } },
            orderBy: { nom: "asc" },
          },
        },
      });
      return res.status(200).json(professeur?.classes ?? []);
    }

    const classes = await prisma.classe.findMany({
      ...(filterSchoolId ? { where: { schoolId: filterSchoolId } } : {}),
      include: {
        _count: {
          select: {
            eleves: true, // Nombre d'élèves dans la classe
            profs: true, // Nombre de professeurs dans la classe
          },
        },
      },
      orderBy: { nom: "asc" },
    });

    res.status(200).json(classes);
  } catch (error) {
    console.error("Erreur lors de la récupération des classes :", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des classes" });
  }
};

/**
 * POST /api/classes
 * Créer une nouvelle classe dans l'école de l'ADMIN connecté. Le SUDO_ADMIN doit préciser un schoolId dans le body.
 */
export const createClasse = async (req: Request, res: Response) => {
  try {
    const validatedData = createClasseSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        error:
          "Vous devez être associé à une école pour créer une classe. Créez d'abord votre école.",
      });
    }

    const newClasse = await prisma.classe.create({
      data: {
        nom: validatedData.nom,
        schoolId,
      },
      include: {
        _count: {
          select: {
            eleves: true,
            profs: true,
          },
        },
      },
    });

    res.status(201).json(newClasse);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Erreur lors de la création de la classe :", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la création de la classe" });
  }
};

/**
 * GET /api/classes/:id
 * Retourne le détail d'un classe avex ses compteurs et ses professeurs
 */
export const getClasseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const classe = await prisma.classe.findUnique({
      where: { id },
      include: {
        profs: true, // Inclure les professeurs de la classe
        _count: { select: { eleves: true, profs: true } },
      },
    });

    if (!classe) {
      return res.status(404).json({ error: "Classe introuvable" });
    }

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé à cette classe" });
    }

    res.status(200).json(classe);
  } catch (err) {
    console.error("Erreur lors de la récupération de la classe :", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération de la classe" });
  }
};

/**
 * PUT /api/classes/:id
 * Met à jour le nom d'une classe. Seuls les champs envoyés sont modifiés.
 */
export const updateClasse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const validatedData = updateClasseSchema.parse(req.body); // Validation des données d'entrée

    const existingClasse = await prisma.classe.findUnique({ where: { id } });
    if (!existingClasse)
      return res.status(404).json({ error: "Classe introuvable" });

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingClasse.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé à cette classe" });
    }

    const updatedClasse = await prisma.classe.update({
      where: { id },
      // Construire le payload en excluant les champs undefined (exactOptionalPropertyTypes)
      data: {
        ...(validatedData.nom !== undefined ? { nom: validatedData.nom } : {}),
      },
      include: { _count: { select: { eleves: true, profs: true } } },
    });

    res.status(200).json(updatedClasse);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error("Erreur lors de la mise à jour de la classe :", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la mise à jour de la classe" });
  }
};

/**
 * DELETE /api/classes/:id
 * Supprime une classe. Seule une classe vide (sans élèves ni profs) peut être supprimée.
 */
export const deleteClasse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }; // Récupération de l'ID de la classe à supprimer

    const existingClasse = await prisma.classe.findUnique({
      where: { id },
      include: { _count: { select: { eleves: true } } }, // Inclure le nombre d'élèves pour vérifier si la classe est vide
    });

    if (!existingClasse)
      return res.status(404).json({ error: "Classe introuvable" });

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        existingClasse.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé à cette classe" });
    }

    if (existingClasse._count.eleves > 0) {
      return res.status(409).json({
        error: `Impossible de supprimer la classe car elle contient ${existingClasse._count.eleves} élève(s). Veuillez d'abord déplacer ou supprimer les élèves de cette classe.`,
      });
    }

    await prisma.classe.delete({ where: { id } }); // Suppression de la classe

    res.status(200).json({
      message: "Classe supprimée avec succès",
      classe: existingClasse,
    });
  } catch (err) {
    console.error("Erreur lors de la suppression de la classe :", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression de la classe" });
  }
};

/**
 * GET /api/eleves/:id/eleves
 * Retourne la liste des élèves appartenant à une classe donnée.
 */
export const getClasseEleves = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }; // Récupération de l'ID de la classe

    const classe = await prisma.classe.findUnique({
      where: { id },
    });
    if (!classe) return res.status(404).json({ error: "Classe introuvable" });

    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé à cette ressource" });
    }

    const eleves = await prisma.eleve.findMany({
      where: { classeId: id },
      orderBy: { nom: "asc" },
    });

    res.status(200).json(eleves);
  } catch (err) {
    console.error("Erreur lors de la récupération des élèves :", err);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des élèves" });
  }
};

/**
 * PATCH /api/classes/:id/prof-principal
 * Ajoute ou modifie le professeur principal d'une classe. Le corps de la requête doit contenir un champ `professeurPrincipalId` (string ou null).
 */
export const updateProfesseurPrincipal = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params as { id: string };
    const { professeurPrincipalId } = req.body as {
      professeurPrincipalId: string | null;
    };

    if (
      professeurPrincipalId !== null &&
      (typeof professeurPrincipalId !== "string" ||
        !professeurPrincipalId.trim())
    ) {
      return res.status(400).json({ error: "professeurPrincipalId invalide" });
    }

    // vérifie que la classe existe
    const classe = await prisma.classe.findUnique({
      where: { id },
      include: { profs: true },
    });
    if (!classe) {
      return res.status(404).json({ error: "Classe introuvable" });
    }

    // Le prof doit être attaché à la classe
    if (
      professeurPrincipalId !== null &&
      !classe.profs.some((p) => p.id === professeurPrincipalId)
    ) {
      return res.status(400).json({
        error: "Le professeur principal doit être assigné à cette classe",
      });
    }

    // vérifie les autorisation
    if (
      !isAuthorizhedForSchool(
        req.user!.role,
        req.user!.schoolId,
        classe.schoolId,
      )
    ) {
      return res.status(403).json({ error: "Accès refusé à cette ressource" });
    }

    // vérifie que le professeur existe
    let professeur = null;
    if (professeurPrincipalId !== null) {
      professeur = await prisma.professeur.findUnique({
        where: { id: professeurPrincipalId },
      });
      if (!professeur) {
        return res.status(404).json({ error: "Professeur introuvable" });
      }
    }

    // vérifie que le professeur appartient à la même école que la classe
    if (professeur && professeur.schoolId !== classe.schoolId) {
      return res.status(400).json({
        error: "Le professeur n'appartient pas à la même école que la classe",
      });
    }

    // Mettre à jour le professeur principal de la classe
    const updatedClasse = await prisma.classe.update({
      where: { id },
      data: {
        professeurPrincipalId: professeurPrincipalId, // peut être null pour retirer le professeur principal
      },
      include: {
        profs: true,
        _count: { select: { eleves: true, profs: true } },
      },
    });

    res.status(200).json(updatedClasse);
  } catch (err) {
    console.error(
      "Erreur lors de la mise à jour du professeur principal :",
      err,
    );
    res.status(500).json({
      error: "Erreur serveur lors de la mise à jour du professeur principal",
    });
  }
};
