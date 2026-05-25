import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createCahierTexteSchema } from "../schemas/cahierDeTexteSchema";
import { ZodError } from "zod";

// --- HELPER : trouve le professeur lié au User connecté ------------------------
async function getProfRecord(userId: string) {
  return prisma.professeur.findFirst({
    where: { userId },
    select: { id: true, schoolId: true },
  });
}

// --- HELPER : accès lecture autorisé -------------------------------------------
function canRead(role: string) {
  return ["SUDO_ADMIN", "ADMIN", "USER", "PROF"].includes(role);
}

const INCLUDE = {
  matiere: { select: { id: true, nom: true } },
  classe: { select: { id: true, nom: true } },
  devoir: { orderBy: { dateRendu: "asc" as const } },
};

// GET /api/classes/:classeId/cahier-de-texte
export const getCahierTextes = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // récupère l'id de la classe depuis les paramètres de l'URL
    const { matiereId } = req.query as { matiereId?: string }; // récupère l'id de la matière depuis les paramètres de la requête (query)
    const user = req.user!; // récupère les informations de l'utilisateur connecté

    if (!canRead(user.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // vérifie que la classe existe
    if (!classe) {
      return res.status(404).json({ error: "Classe non trouvée." });
    }
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    // PROF ne voit que ses propres cahier de texte
    let profFilter: { professeurId?: string } = {}; // si l'utilisateur est un professeur, on ajoute un filtre pour ne récupérer que les cahiers de texte liés à ce professeur
    if (user.role === "PROF") {
      const prof = await getProfRecord(user.id); // récupère les informations du professeur lié à l'utilisateur connecté
      if (!prof) {
        return res
          .status(403)
          .json({ error: "Profil professeur introuvable." });
      }
      profFilter = { professeurId: prof.id }; // ajoute le filtre pour ne récupérer que les cahiers de texte liés à ce professeur
    }

    const entries = await prisma.cahierTexte.findMany({
      where: { classeId, ...profFilter, ...(matiereId ? { matiereId } : {}) }, // ajoute un filtre pour ne récupérer que les cahiers de texte liés à la matière spécifiée (si elle est présente dans les paramètres de la requête)
      include: INCLUDE, // inclut les informations liées à la matière, la classe et les devoirs associés à chaque cahier de texte
      orderBy: { date: "desc" }, // trie les cahiers de texte par date décroissante
    });

    res.status(200).json(entries); // retourne les cahiers de texte récupérés
  } catch (err) {
    console.error("Erreur getCahierTextes:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// GET /api/classes/:classeId/cahier-de-texte/devoirs
export const getDevoirs = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // récupère l'id de la classe depuis les paramètres de l'URL
    const user = req.user!; // récupère les informations de l'utilisateur connecté

    if (!canRead(user.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // vérifie que la classe existe
    if (!classe) {
      return res.status(404).json({ error: "Classe non trouvée." }); // si la classe n'existe pas, retourne une erreur 404
    }
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
      return res.status(403).json({ error: "Accès refusé." }); // si l'utilisateur n'est pas un super admin et que son école ne correspond pas à celle de la classe, retourne une erreur 403
    }

    let profIdFilter: string | undefined;
    if (user.role === "PROF") {
      const prof = await getProfRecord(user.id); // récupère les informations du professeur lié à l'utilisateur connecté
      if (!prof) {
        return res
          .status(403)
          .json({ error: "Profil professeur introuvable." }); // si le profil du professeur n'est pas trouvé, retourne une erreur 403
      }
      profIdFilter = prof.id;
    }

    const devoirs = await prisma.devoir.findMany({
      where: {
        cahierTexte: {
          classeId,
          ...(profIdFilter ? { professeurId: profIdFilter } : {}),
        },
      },
      include: {
        cahierTexte: {
          select: {
            id: true,
            titre: true,
            date: true,
            matiere: { select: { id: true, nom: true } }, // inclut les informations de la matière liée au cahier de texte
          },
        },
      },
    });
    res.status(200).json(devoirs); // retourne les devoirs récupérés
  } catch (err) {
    console.error("Erreur getDevoirs:", err);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
};

// POST /api/classes/:classeId/cahier-de-texte
export const createCahierTexte = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // récupère l'id de la classe depuis les paramètres de l'URL
    const user = req.user!; // récupère les informations de l'utilisateur connecté

    const prof = await getProfRecord(user.id); // récupère les informations du professeur lié à l'utilisateur connecté
    if (!prof)
      return res.status(403).json({ error: "Profil professeur introuvable." }); // si le profil du professeur n'est pas trouvé, retourne une erreur 403

    const data = createCahierTexteSchema.parse(req.body); // valide les données de la requête avec le schéma de validation

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // vérifie que la classe existe
    if (!classe) return res.status(404).json({ error: "Classe non trouvée." }); // si la classe n'existe pas, retourne une erreur 404
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
      return res.status(403).json({ error: "Accès refusé." }); // si l'utilisateur n'est pas un super admin et que son école ne correspond pas à celle de la classe, retourne une erreur 403
    }

    if (data.matiereId) {
      const matiere = await prisma.matiere.findUnique({
        where: { id: data.matiereId },
        select: { schoolId: true },
      });
      if (!matiere) return res.status(400).json({ error: "Matière introuvable." });
      if (user.role !== "SUDO_ADMIN" && matiere.schoolId !== user.schoolId) {
        return res.status(403).json({ error: "Matière non autorisée." });
      }
    }

    const newCahierTexte = await prisma.cahierTexte.create({
      data: {
        titre: data.titre,
        detail: data.detail ?? null,
        date: data.date,
        classeId,
        matiereId: data.matiereId ?? null,
        professeurId: prof.id,
        schoolId: classe.schoolId,
        ...(data.devoirs && data.devoirs.length > 0
          ? { devoir: { create: data.devoirs.map((d) => ({ ...d, description: d.description ?? null })) } }
          : {}),
      },
      include: INCLUDE,
    });

    res.status(201).json(newCahierTexte); // retourne le cahier de texte créé
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues }); // si les données de la requête ne sont pas valides, retourne une erreur 400 avec les détails des erreurs de validation
    }
    console.error("Erreur createCahierTexte:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // pour toute autre erreur, retourne une erreur 500
  }
};

// PUT /api/classes/:classeId/cahier-de-texte/:id
export const updateCahierTexte = async (req: Request, res: Response) => {
  try {
    const { classeId, id } = req.params as { classeId: string; id: string };
    const user = req.user!;

    const prof = await getProfRecord(user.id);
    if (!prof) {
      return res.status(403).json({ error: "Profil professeur introuvable" });
    }

    const existingCahierTexte = await prisma.cahierTexte.findUnique({
      where: { id },
    });
    if (!existingCahierTexte || existingCahierTexte.classeId !== classeId) {
      return res.status(404).json({ error: "Entrée introuvable" });
    }
    if (
      existingCahierTexte.professeurId !== prof.id &&
      user.role !== "SUDO_ADMIN"
    ) {
      return res.status(403).json({
        error: "Vous ne pouvez modifier que vos propres cahiers de texte",
      });
    }

    const data = createCahierTexteSchema.parse(req.body); // valide les données de la requête avec le schéma de validation

    if (data.matiereId) {
      const matiere = await prisma.matiere.findUnique({
        where: { id: data.matiereId },
        select: { schoolId: true },
      });
      if (!matiere) return res.status(400).json({ error: "Matière introuvable." });
      if (user.role !== "SUDO_ADMIN" && matiere.schoolId !== user.schoolId) {
        return res.status(403).json({ error: "Matière non autorisée." });
      }
    }

    // Remplacer les devoirs en totalité (delete + recreate) pour simplifier la logique
    const updatedCahierTexte = await prisma.$transaction(async (tx) => {
      await tx.devoir.deleteMany({ where: { cahierTexteId: id } }); // supprime les devoirs existants liés à ce cahier de texte
      return tx.cahierTexte.update({
        where: { id },
        data: {
          titre: data.titre,
          detail: data.detail ?? null, // si le détail n'est pas fourni, on le met à null
          date: data.date,
          matiereId: data.matiereId ?? null, // si l'id de la matière n'est pas fourni, on le met à null
          ...(data.devoirs && data.devoirs.length > 0
            ? { devoir: { create: data.devoirs.map((d) => ({ ...d, description: d.description ?? null })) } }
            : {}), // si des devoirs sont fournis, on les crée
        },
        include: INCLUDE, // inclut les informations liées à la matière, la classe et les devoirs associés à ce cahier de texte
      });
    });
    res.status(200).json(updatedCahierTexte); // retourne le cahier de texte mis à jour
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues }); // si les données de la requête ne sont pas valides, retourne une erreur 400 avec les détails des erreurs de validation
    }
    console.error("Erreur updateCahierTexte:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // pour toute autre erreur, retourne une erreur 500
  }
};

// DELETE /api/classes/:classeId/cahier-de-texte/:id
export const deleteCahierTexte = async (req: Request, res: Response) => {
  try {
    const { classeId, id } = req.params as { classeId: string; id: string }; // récupère l'id de la classe et du cahier de texte depuis les paramètres de l'URL
    const user = req.user!; // récupère les informations de l'utilisateur connecté

    const prof = await getProfRecord(user.id); // récupère les informations du professeur lié à l'utilisateur connecté
    const existingCahierTexte = await prisma.cahierTexte.findUnique({
      where: { id },
    }); // vérifie que le cahier de texte existe
    if (!existingCahierTexte || existingCahierTexte.classeId !== classeId) {
      return res.status(404).json({ error: "Cahier de texte introuvable." }); // si le cahier de texte n'existe pas ou ne correspond pas à la classe, retourne une erreur 404
    }

    const isOwner = prof && existingCahierTexte.professeurId === prof.id; // vérifie si le professeur lié à l'utilisateur connecté est le propriétaire du cahier de texte
    if (!isOwner && user.role !== "SUDO_ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Vous ne pouvez supprimer que vos propres cahiers de texte.",
      }); // si l'utilisateur n'est pas le propriétaire du cahier de texte et n'est pas un super admin ou admin, retourne une erreur 403
    }
    // Vérification de tenant pour ADMIN (SUDO_ADMIN peut agir cross-school)
    if (user.role === "ADMIN" && existingCahierTexte.schoolId !== user.schoolId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    await prisma.cahierTexte.delete({ where: { id } }); // supprime le cahier de texte
    res.status(204).send(); // retourne une réponse sans contenu pour indiquer que la suppression a réussi
  } catch (err) {
    console.error("Erreur deleteCahierTexte:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // pour toute autre erreur, retourne une erreur 500
  }
};
