import { prisma } from "../lib/prisma";
import { Request, Response } from "express";
import {
  createQuizSchema,
  questionSchema,
  submitQuizSchema,
} from "../schemas/quizSchema";
import { ZodError } from "zod";

async function getProfRecord(userId: string) {
  // Fonction pour récupérer l'enregistrement du professeur à partir de l'ID utilisateur
  return prisma.professeur.findFirst({
    where: { userId },
    select: { id: true, schoolId: true },
  });
}

const QUIZ_INLCUDES = {
  matiere: { select: { id: true, nom: true } },
  _count: { select: { questions: true, soumissions: true } }, // inclut le nombre de questions et de soumissions pour chaque quiz
};

// GET /api/classes/:classeId/quiz
export const getQuizzes = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // Récupère l'ID de la classe à partir des paramètres de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // Vérifie que la classe existe
    if (!classe) {
      return res.status(404).json({ error: "Classe non trouvée." });
    }
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== classe.schoolId) {
      return res.status(403).json({ error: "Accès refusé." }); // Vérifie que l'utilisateur a les droits d'accès à la classe (SUDO_ADMIN ou appartenant à la même école)
    }

    // ELEVE ne voit que les quiz publiés, tandis que les autres rôles voient tous les quiz
    const statutFitler =
      user.role === "ELEVE" ? { statut: "PUBLIE" as const } : {}; // Si l'utilisateur est un élève, ajoute un filtre pour ne récupérer que les quiz publiés

    const quizzes = await prisma.quiz.findMany({
      where: { classeId, ...statutFitler }, // Récupère les quiz de la classe en appliquant le filtre de statut si nécessaire
      include: QUIZ_INLCUDES, // Inclut les informations supplémentaires définies dans QUIZ_INLCUDES
      orderBy: { createdAt: "desc" }, // Trie les quiz par date de création décroissante
    });

    res.status(200).json(quizzes); // Envoie la liste des quiz en réponse
  } catch (err) {
    console.error("Erreur getQuizzes:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};

// GET /api/classes/:classeId/quiz/:quizId
export const getQuizById = async (req: Request, res: Response) => {
  try {
    const { classeId, quizId } = req.params as {
      classeId: string;
      quizId: string;
    }; // Récupère les IDs de la classe et du quiz à partir des paramètres de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId }, // Vérifie que le quiz existe et appartient à la classe spécifiée
      include: {
        ...QUIZ_INLCUDES, // Inclut les informations supplémentaires définies dans QUIZ_INLCUDES
        questions: { orderBy: { createdAt: "asc" } }, // Trie les questions du quiz par date de création croissante
      },
    });

    if (!quiz || quiz.classeId !== classeId) {
      return res
        .status(404)
        .json({ error: "Quiz non trouvé dans cette classe." }); // Vérifie que le quiz existe et appartient à la classe spécifiée
    }
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== quiz.schoolId) {
      return res.status(403).json({ error: "Accès refusé." }); // Vérifie que l'utilisateur a les droits d'accès au quiz (SUDO_ADMIN ou appartenant à la même école)
    }
    if (user.role === "ELEVE" && quiz.statut !== "PUBLIE") {
      return res
        .status(403)
        .json({ error: "Ce quiz n'est pas encore disponible." }); // Si l'utilisateur est un élève, vérifie que le quiz est publié
    }

    // POUR ELEVE : masquer les bonnes réponses avant la soumission
    if (user.role === "ELEVE") {
      const questions = quiz.questions.map(({ bonneReponse: _, ...q }) => q); // Masque les bonnes réponses en les excluant de l'objet question
      return res.status(200).json({ ...quiz, questions }); // Envoie le quiz avec les questions sans les bonnes réponses
    }

    res.status(200).json(quiz); // Envoie le quiz complet en réponse pour les autres rôles
  } catch (err) {
    console.error("Erreur getQuizById:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};

// POST /api/classes/:classeId/quiz
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const { classeId } = req.params as { classeId: string }; // Récupère l'ID de la classe à partir des paramètres de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const prof = await getProfRecord(user.id); // Récupère l'enregistrement du professeur à partir de l'ID utilisateur
    if (!prof) {
      return res.status(403).json({ error: "Profil Professeur introuvable" }); // Si l'utilisateur n'est pas un professeur, refuse l'accès
    }

    const data = createQuizSchema.parse(req.body); // Valide les données de la requête à l'aide du schéma de validation

    const classe = await prisma.classe.findUnique({ where: { id: classeId } }); // Vérifie que la classe existe
    if (!classe) {
      return res.status(404).json({ error: "Classe non trouvée." });
    }

    const quiz = await prisma.quiz.create({
      data: {
        titre: data.titre, // Titre du quiz
        classeId, // ID de la classe à laquelle le quiz appartient
        matiereId: data.matiereId ?? null, // ID de la matière associée au quiz (optionnel)
        professeurId: prof.id, // ID du professeur qui crée le quiz
        schoolId: prof.schoolId, // ID de l'école à laquelle le quiz appartient
      },
      include: QUIZ_INLCUDES, // Inclut les informations supplémentaires définies dans QUIZ_INLCUDES
    });

    res.status(201).json(quiz); // Envoie le quiz créé en réponse avec un statut 201 (Created)
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues }); // Si les données de la requête ne sont pas valides, envoie une réponse d'erreur avec les détails de la validation
    }
    console.error("Erreur createQuiz:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};

// PATCH /api/classes/:classeId/quiz/:quizId/statut
export const updateQuizStatut = async (req: Request, res: Response) => {
  try {
    const { classeId, quizId } = req.params as {
      classeId: string;
      quizId: string;
    }; // Récupère les IDs de la classe et du quiz à partir des paramètres de la requête
    const { statut } = req.body as { statut?: string }; // Récupère le nouveau statut du quiz à partir du corps de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const allowedStatuts = ["BROUILLON", "PUBLIE", "FERME"]; // Statuts autorisés pour un quiz
    if (!statut || !allowedStatuts.includes(statut)) {
      return res.status(400).json({
        error:
          "Statut invalide. Les statuts autorisés sont : BROUILLON, PUBLIE, FERME.",
      }); // Vérifie que le statut fourni est valide
    }

    const prof = await getProfRecord(user.id); // Récupère l'enregistrement du professeur à partir de l'ID utilisateur
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } }); // Vérifie que le quiz existe
    if (!quiz || quiz.classeId !== classeId) {
      return res
        .status(404)
        .json({ error: "Quiz non trouvé dans cette classe." }); // Vérifie que le quiz existe et appartient à la classe spécifiée
    }
    if (prof?.id !== quiz.professeurId && user.role !== "SUDO_ADMIN") {
      return res.status(403).json({ error: "Accès refusé." }); // Vérifie que l'utilisateur a les droits d'accès pour modifier le quiz (SUDO_ADMIN ou professeur qui a créé le quiz)
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { statut: statut as "BROUILLON" | "PUBLIE" | "FERME" }, // Met à jour le statut du quiz
      include: QUIZ_INLCUDES, // Inclut les informations supplémentaires définies dans QUIZ_INLCUDES
    });

    res.status(200).json(updatedQuiz); // Envoie le quiz mis à jour en réponse
  } catch (err) {
    console.error("Erreur updateQuizStatut:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};

// DELETE /api/classes/:classeId/quiz/:quizId
export const deleteQuiz = async (req: Request, res: Response) => {
  try {
    const { classeId, quizId } = req.params as {
      classeId: string;
      quizId: string;
    }; // Récupère les IDs de la classe et du quiz à partir des paramètres de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const prof = await getProfRecord(user.id); // Récupère l'enregistrement du professeur à partir de l'ID utilisateur
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } }); // Vérifie que le quiz existe
    if (!quiz || quiz.classeId !== classeId) {
      return res
        .status(404)
        .json({ error: "Quiz non trouvé dans cette classe." }); // Vérifie que le quiz existe et appartient à la classe spécifiée
    }

    const isOwner = prof && quiz.professeurId === prof.id; // Vérifie si le professeur connecté est le créateur du quiz
    if (
      !isOwner &&
      user.role !== "SUDO_ADMIN" &&
      !(user.role === "ADMIN" && user.schoolId === quiz.schoolId)
    ) {
      return res.status(403).json({ error: "Accès refusé." }); // Vérifie que l'utilisateur a les droits d'accès pour supprimer le quiz
    }

    await prisma.quiz.delete({ where: { id: quizId } }); // Supprime le quiz de la base de données
    res.status(204).send(); // Envoie une réponse avec un statut 204 (No Content) pour indiquer que la suppression a réussi
  } catch (err) {
    console.error("Erreur deleteQuiz:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};

// POST /api/classes/:classeId/quiz/:quizId/questions
export const addQuestionToQuiz = async (req: Request, res: Response) => {
  try {
    const { classeId, quizId } = req.params as {
      classeId: string;
      quizId: string;
    }; // Récupère les IDs de la classe et du quiz à partir des paramètres de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const prof = await getProfRecord(user.id); // Récupère l'enregistrement du professeur à partir de l'ID utilisateur
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } }); // Vérifie que le quiz existe

    if (!quiz || quiz.classeId !== classeId) {
      return res
        .status(404)
        .json({ error: "Quiz non trouvé dans cette classe." }); // Vérifie que le quiz existe et appartient à la classe spécifiée
    }

    if (prof?.id !== quiz.professeurId && user.role !== "SUDO_ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé." }); // Vérifie que l'utilisateur a les droits d'accès pour modifier le quiz (SUDO_ADMIN ou professeur qui a créé le quiz)
    }

    if (quiz.statut === "PUBLIE" || quiz.statut === "FERME") {
      return res
        .status(400)
        .json({ error: "Impossible de modifier un quiz publié ou fermé." }); // Empêche la modification du quiz si son statut est PUBLIE ou FERME
    }

    const data = questionSchema.parse(req.body); // Valide les données de la requête à l'aide du schéma de validation

    const question = await prisma.question.create({
      data: { ...data, quizId }, // Crée une nouvelle question associée au quiz
    });

    res.status(201).json(question); // Envoie la question créée en réponse avec un statut 201 (Created)
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues }); // Si les données de la requête ne sont pas valides, envoie une réponse d'erreur avec les détails de la validation
    }
    console.error("Erreur addQuestionToQuiz:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};

// DELETE /api/classes/:classeId/quiz/:quizId/qiestions/:questionId
export const deleteQuestionFromQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId, questionId } = req.params as {
      quizId: string;
      questionId: string;
    }; // Récupère les IDs du quiz et de la question à partir des paramètres de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const prof = await getProfRecord(user.id); // Récupère l'enregistrement du professeur à partir de l'ID utilisateur
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    }); // Vérifie que la question existe

    if (!question || question.quizId !== quizId) {
      return res
        .status(404)
        .json({ error: "Question non trouvée dans ce quiz." }); // Vérifie que la question existe et appartient au quiz spécifié
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        professeurId: true,
        statut: true,
      },
    });

    if (prof?.id !== quiz?.professeurId && user.role !== "SUDO_ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé." }); // Vérifie que l'utilisateur a les droits d'accès pour modifier le quiz (SUDO_ADMIN ou professeur qui a créé le quiz)
    }
    if (quiz?.statut !== "BROUILLON") {
      return res.status(400).json({
        error: "Impossible de modifier un quiz qui n'est pas en brouillon.",
      }); // Empêche la modification du quiz si son statut n'est pas BROUILLON
    }

    await prisma.question.delete({ where: { id: questionId } }); // Supprime la question de la base de données
    res.status(204).send(); // Envoie une réponse avec un statut 204 (No Content) pour indiquer que la suppression a réuss
  } catch (err) {
    console.error("Erreur deleteQuestionFromQuiz:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};

// POST /api/classes/:classeId/quiz/:quizId/submit (ELEVE)
export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { classeId, quizId } = req.params as {
      classeId: string;
      quizId: string;
    }; // Récupère les IDs de la classe et du quiz à partir des paramètres de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const eleve = await prisma.eleve.findFirst({
      where: { userId: user.id, classeId: classeId }, // Vérifie que l'élève appartient à la classe spécifiée
      select: { id: true },
    });
    if (!eleve) {
      return res
        .status(403)
        .json({ error: "Profil Élève introuvable dans cette classe." }); // Si l'utilisateur n'est pas un élève de la classe, refuse l'accès
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }, // Inclut les questions du quiz pour vérifier les réponses
    });
    if (!quiz || quiz.classeId !== classeId || quiz.statut !== "PUBLIE") {
      return res
        .status(404)
        .json({ error: "Quiz non trouvé ou non disponible." }); // Vérifie que le quiz existe, appartient à la classe spécifiée et est publié
    }

    const existingSoumission = await prisma.soumission.findUnique({
      where: { quizId_eleveId: { quizId, eleveId: eleve.id } }, // Vérifie si l'élève a déjà soumis des réponses pour ce quiz
    });
    if (existingSoumission) {
      return res.status(400).json({ error: "Vous avez déjà soumis ce quiz." }); // Si l'élève a déjà soumis le quiz, refuse la soumission
    }

    const { reponses } = submitQuizSchema.parse(req.body); // Valide les données de la requête à l'aide du schéma de validation

    // Valider que chaque questionId appartient à ce quiz et détecter les doublons
    const validQuestionIds = new Set(quiz.questions.map((q) => q.id));
    const seenIds = new Set<string>();
    for (const r of reponses) {
      if (!validQuestionIds.has(r.questionId)) {
        return res.status(400).json({ error: `Question ${r.questionId} n'appartient pas à ce quiz.` });
      }
      if (seenIds.has(r.questionId)) {
        return res.status(400).json({ error: `Réponse dupliquée pour la question ${r.questionId}.` });
      }
      seenIds.add(r.questionId);
    }

    // AUTO-CORRECTION : QCM et VRAI_FAUX
    let score = 0;
    const responseData = reponses.map((r) => {
      const question = quiz.questions.find((q) => q.id === r.questionId);
      let correct: boolean | null = null; // null pour les questions à correction manuelle
      if (question && question.type !== "REPONSE_COURTE") {
        correct =
          r.valeur.trim().toLowerCase() ===
          question.bonneReponse.trim().toLowerCase(); // Compare la réponse de l'élève à la bonne réponse en ignorant les espaces et la casse
        if (correct) score += 1; // Incrémente le score si la réponse est correcte
      }

      return { questionId: r.questionId, valeur: r.valeur, correct }; // Prépare les données de la réponse à enregistrer
    }); // Trouve la question correspondante à la réponse soumise

    const soumission = await prisma.soumission.create({
      data: {
        quizId,
        eleveId: eleve.id,
        score,
        total: quiz.questions.length,
        reponses: { create: responseData }, // Enregistre les réponses de l'élève dans la base de données
      },
      include: { reponses: true }, // Inclut les réponses dans la soumission créée
    });

    res.status(201).json(soumission); // Envoie la soumission créée en réponse avec un statut 201 (Created)
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Données invalides.", issues: err.issues });
    }
    console.error("Erreur submitQuiz:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};

// GET /api/classes/:classeId/quiz/:quizId/results
export const getQuizResults = async (req: Request, res: Response) => {
  try {
    const { classeId, quizId } = req.params as {
      classeId: string;
      quizId: string;
    }; // Récupère les IDs de la classe et du quiz à partir des paramètres de la requête
    const user = req.user!; // Récupère les informations de l'utilisateur connecté à partir de l'objet de requête

    const allowedRoles = ["SUDO_ADMIN", "ADMIN", "PROF", "USER"]; // Rôles autorisés à accéder aux résultats du quiz
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Accès refusé." }); // Vérifie que l'utilisateur a les droits d'accès pour voir les résultats du quiz
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { classeId: true, schoolId: true },
    });

    if (!quiz || quiz.classeId !== classeId) {
      return res
        .status(404)
        .json({ error: "Quiz non trouvé dans cette classe." }); // Vérifie que le quiz existe et appartient à la classe spécifiée
    }
    if (user.role !== "SUDO_ADMIN" && user.schoolId !== quiz.schoolId) {
      return res.status(403).json({ error: "Accès refusé." }); // Vérifie que l'utilisateur a les droits d'accès pour voir les résultats du quiz (SUDO_ADMIN ou appartenant à la même école)
    }

    const soumissions = await prisma.soumission.findMany({
      where: { quizId },
      include: {
        eleve: { select: { id: true, nom: true, prenom: true } }, // Inclut les informations de l'élève pour chaque soumission
        reponses: true, // Inclut les réponses de chaque soumission
      },

      orderBy: { soumisAt: "asc" },
    });

    res.status(200).json(soumissions); // Envoie la liste des soumissions en réponse
  } catch (err) {
    console.error("Erreur getQuizResults:", err);
    res.status(500).json({ error: "Une erreur est survenue." }); // En cas d'erreur, envoie une réponse d'erreur générique
  }
};
