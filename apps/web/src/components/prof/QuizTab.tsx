import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../../lib/api";
import toast from "react-hot-toast";
import type { Quiz, Soumission, TypeQuestion } from "@school-mgt/types";
import {
  Trophy,
  Plus,
  Trash2,
  BookOpen,
  BarChart2,
  ChevronRight,
  Lock,
  Unlock,
  CheckCircle,
} from "lucide-react";

type SubTab = "mes-quiz" | "banque" | "resultats";

interface Props {
  classeId: string;
  matieres: { id: string; nom: string }[];
  canWrite: boolean;
}

const TYPE_LABELS: Record<TypeQuestion, string> = {
  QCM: "QCM",
  VRAI_FAUX: "Vrai / Faux",
  REPONSE_COURTE: "Réponse courte",
};

export default function QuizTab({ classeId, matieres, canWrite }: Props) {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<SubTab>("mes-quiz");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState({ titre: "", matiereId: "" });
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    enonce: "",
    type: "QCM" as TypeQuestion,
    options: ["", ""],
    bonneReponse: "",
    ordre: 0,
  });

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ["quizzes", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/quiz`);
      return data;
    },
    enabled: !!classeId,
  });

  const { data: quizDetail } = useQuery<Quiz>({
    queryKey: ["quiz", classeId, selectedQuizId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/quiz/${selectedQuizId}`,
      );
      return data;
    },
    enabled: !!selectedQuizId && subTab === "banque",
  });

  const { data: results = [] } = useQuery<Soumission[]>({
    queryKey: ["quiz-results", classeId, selectedQuizId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/quiz/${selectedQuizId}/results`,
      );
      return data;
    },
    enabled: !!selectedQuizId && subTab === "resultats",
  });

  const createQuiz = useMutation({
    mutationFn: () =>
      api.post(`/api/classes/${classeId}/quiz`, {
        titre: quizForm.titre,
        matiereId: quizForm.matiereId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", classeId] });
      toast.success("Quiz créé.");
      setShowCreateQuiz(false);
      setQuizForm({ titre: "", matiereId: "" });
    },
    onError: (err) => toast.error(getApiError(err, "Une erreur est survenue.")),
  });

  const changeStatut = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: string }) =>
      api.patch(`/api/classes/${classeId}/quiz/${id}/statut`, { statut }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["quizzes", classeId] }),
    onError: (err) => toast.error(getApiError(err, "Une erreur est survenue.")),
  });

  const deleteQuiz = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/classes/${classeId}/quiz/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", classeId] });
      if (selectedQuizId) setSelectedQuizId(null);
      toast.success("Quiz supprimé.");
    },
    onError: (err) => toast.error(getApiError(err, "Une erreur est survenue.")),
  });

  const addQuestion = useMutation({
    mutationFn: () =>
      api.post(`/api/classes/${classeId}/quiz/${selectedQuizId}/questions`, {
        ...questionForm,
        options:
          questionForm.type === "VRAI_FAUX"
            ? ["Vrai", "Faux"]
            : questionForm.options.filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", classeId, selectedQuizId] });
      toast.success("Question ajoutée.");
      setShowAddQuestion(false);
      setQuestionForm({
        enonce: "",
        type: "QCM",
        options: ["", ""],
        bonneReponse: "",
        ordre: 0,
      });
    },
    onError: (err) => toast.error(getApiError(err, "Une erreur est survenue.")),
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: string) =>
      api.delete(
        `/api/classes/${classeId}/quiz/${selectedQuizId}/questions/${questionId}`,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["quiz", classeId, selectedQuizId] }),
    onError: (err) => toast.error(getApiError(err, "Une erreur est survenue.")),
  });

  const STATUT_BADGE: Record<string, string> = {
    BROUILLON: "badge-ghost",
    PUBLIE: "badge-success",
    FERME: "badge-error",
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="tabs tabs-bordered">
        {(
          [
            {
              key: "mes-quiz",
              label: "Mes quiz",
              icon: <BookOpen size={14} />,
            },
            {
              key: "banque",
              label: "Questions",
              icon: <CheckCircle size={14} />,
            },
            {
              key: "resultats",
              label: "Résultats",
              icon: <BarChart2 size={14} />,
            },
          ] as { key: SubTab; label: string; icon: React.ReactNode }[]
        ).map((t) => (
          <button
            key={t.key}
            className={`tab gap-1 ${subTab === t.key ? "tab-active" : ""}`}
            onClick={() => setSubTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── MES QUIZ ─────────────────────────────────────────────────── */}
      {subTab === "mes-quiz" && (
        <div className="space-y-3">
          {canWrite && (
            <div className="flex justify-end">
              <button
                className="btn btn-primary btn-sm gap-1"
                onClick={() => setShowCreateQuiz((v) => !v)}
              >
                <Plus size={14} /> Nouveau quiz
              </button>
            </div>
          )}

          {showCreateQuiz && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body py-3 space-y-2">
                <input
                  className="input input-bordered input-sm w-full"
                  placeholder="Titre du quiz *"
                  value={quizForm.titre}
                  onChange={(e) =>
                    setQuizForm((f) => ({ ...f, titre: e.target.value }))
                  }
                />
                <select
                  className="select select-bordered select-sm w-full"
                  value={quizForm.matiereId}
                  onChange={(e) =>
                    setQuizForm((f) => ({ ...f, matiereId: e.target.value }))
                  }
                >
                  <option value="">Matière (optionnel)</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowCreateQuiz(false)}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!quizForm.titre || createQuiz.isPending}
                    onClick={() => createQuiz.mutate()}
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner" />
            </div>
          )}

          {quizzes.length === 0 && !isLoading && (
            <div className="flex flex-col items-center py-12 text-base-content/40 gap-2">
              <Trophy size={36} />
              <p className="text-sm">Aucun quiz créé.</p>
            </div>
          )}

          {quizzes.map((q) => (
            <div key={q.id} className="card bg-base-100 border border-base-200">
              <div className="card-body py-3 px-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{q.titre}</span>
                      <span
                        className={`badge badge-xs ${STATUT_BADGE[q.statut]}`}
                      >
                        {q.statut}
                      </span>
                      {q.matiere && (
                        <span className="badge badge-outline badge-xs">
                          {q.matiere.nom}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      {q._count?.questions ?? 0} question(s) ·{" "}
                      {q._count?.soumissions ?? 0} soumission(s)
                    </p>
                  </div>
                  {canWrite && (
                    <div className="flex gap-1 shrink-0">
                      {q.statut === "BROUILLON" && (
                        <button
                          className="btn btn-xs btn-success gap-1"
                          onClick={() =>
                            changeStatut.mutate({ id: q.id, statut: "PUBLIE" })
                          }
                        >
                          <Unlock size={11} /> Publier
                        </button>
                      )}
                      {q.statut === "PUBLIE" && (
                        <button
                          className="btn btn-xs btn-warning gap-1"
                          onClick={() =>
                            changeStatut.mutate({ id: q.id, statut: "FERME" })
                          }
                        >
                          <Lock size={11} /> Fermer
                        </button>
                      )}
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => {
                          setSelectedQuizId(q.id);
                          setSubTab("banque");
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        className="btn btn-xs btn-ghost text-error"
                        onClick={() => deleteQuiz.mutate(q.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BANQUE DE QUESTIONS ──────────────────────────────────────── */}
      {subTab === "banque" && (
        <div className="space-y-3">
          <select
            className="select select-bordered select-sm w-full"
            value={selectedQuizId ?? ""}
            onChange={(e) => setSelectedQuizId(e.target.value || null)}
          >
            <option value="">Choisir un quiz…</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.titre}
              </option>
            ))}
          </select>

          {selectedQuizId && quizDetail && (
            <>
              {canWrite && quizDetail.statut === "BROUILLON" && (
                <button
                  className="btn btn-sm btn-outline gap-1"
                  onClick={() => setShowAddQuestion((v) => !v)}
                >
                  <Plus size={14} /> Ajouter une question
                </button>
              )}

              {showAddQuestion && (
                <div className="card bg-base-200 border border-base-300">
                  <div className="card-body py-3 space-y-2">
                    <textarea
                      className="textarea textarea-bordered w-full text-sm"
                      rows={2}
                      placeholder="Énoncé de la question *"
                      value={questionForm.enonce}
                      onChange={(e) =>
                        setQuestionForm((f) => ({
                          ...f,
                          enonce: e.target.value,
                        }))
                      }
                    />
                    <select
                      className="select select-bordered select-sm"
                      value={questionForm.type}
                      onChange={(e) =>
                        setQuestionForm((f) => ({
                          ...f,
                          type: e.target.value as TypeQuestion,
                        }))
                      }
                    >
                      {(
                        ["QCM", "VRAI_FAUX", "REPONSE_COURTE"] as TypeQuestion[]
                      ).map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                    {questionForm.type === "QCM" && (
                      <div className="space-y-1">
                        <p className="text-xs text-base-content/50">
                          Options :
                        </p>
                        {questionForm.options.map((opt, i) => (
                          <input
                            key={i}
                            className="input input-bordered input-xs w-full"
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) =>
                              setQuestionForm((f) => {
                                const options = [...f.options];
                                options[i] = e.target.value;
                                return { ...f, options };
                              })
                            }
                          />
                        ))}
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() =>
                            setQuestionForm((f) => ({
                              ...f,
                              options: [...f.options, ""],
                            }))
                          }
                        >
                          <Plus size={11} /> Option
                        </button>
                      </div>
                    )}
                    <input
                      className="input input-bordered input-sm w-full"
                      placeholder="Bonne réponse *"
                      value={questionForm.bonneReponse}
                      onChange={(e) =>
                        setQuestionForm((f) => ({
                          ...f,
                          bonneReponse: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowAddQuestion(false)}
                      >
                        Annuler
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={
                          !questionForm.enonce ||
                          !questionForm.bonneReponse ||
                          addQuestion.isPending
                        }
                        onClick={() => addQuestion.mutate()}
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {(quizDetail.questions ?? []).length === 0 && (
                  <p className="text-sm text-base-content/40 py-4 text-center">
                    Aucune question.
                  </p>
                )}
                {(quizDetail.questions ?? []).map((q, i) => (
                  <div
                    key={q.id}
                    className="card bg-base-100 border border-base-200"
                  >
                    <div className="card-body py-2 px-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                            <span>Q{i + 1}</span>
                            <span className="badge badge-xs badge-ghost">
                              {TYPE_LABELS[q.type]}
                            </span>
                          </div>
                          <p className="text-sm">{q.enonce}</p>
                          {q.options.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {q.options.map((opt, oi) => (
                                <li
                                  key={oi}
                                  className={`text-xs px-1 rounded ${opt === q.bonneReponse ? "text-success font-semibold" : "text-base-content/60"}`}
                                >
                                  {opt === q.bonneReponse ? "✓ " : "• "}
                                  {opt}
                                </li>
                              ))}
                            </ul>
                          )}
                          {q.type === "REPONSE_COURTE" && (
                            <p className="text-xs text-success mt-1">
                              Réponse : {q.bonneReponse}
                            </p>
                          )}
                        </div>
                        {canWrite && quizDetail.statut === "BROUILLON" && (
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => deleteQuestion.mutate(q.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── RÉSULTATS ────────────────────────────────────────────────── */}
      {subTab === "resultats" && (
        <div className="space-y-3">
          <select
            className="select select-bordered select-sm w-full"
            value={selectedQuizId ?? ""}
            onChange={(e) => setSelectedQuizId(e.target.value || null)}
          >
            <option value="">Choisir un quiz…</option>
            {quizzes
              .filter((q) => q.statut !== "BROUILLON")
              .map((q) => (
                <option key={q.id} value={q.id}>
                  {q.titre}
                </option>
              ))}
          </select>

          {selectedQuizId && (
            <div className="overflow-x-auto rounded-xl border border-base-200">
              <table className="table table-sm">
                <thead className="bg-base-200">
                  <tr>
                    <th>Élève</th>
                    <th className="text-center">Score</th>
                    <th className="text-right">Soumis le</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center text-base-content/40 py-6"
                      >
                        Aucune soumission.
                      </td>
                    </tr>
                  )}
                  {results.map((s) => {
                    const pct =
                      s.total > 0
                        ? Math.round(((s.score ?? 0) / s.total) * 100)
                        : 0;
                    return (
                      <tr key={s.id} className="hover">
                        <td className="font-medium">
                          {s.eleve?.nom} {s.eleve?.prenom}
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge badge-sm ${pct >= 70 ? "badge-success" : pct >= 50 ? "badge-warning" : "badge-error"}`}
                          >
                            {s.score ?? "?"} / {s.total} ({pct} %)
                          </span>
                        </td>
                        <td className="text-right text-xs text-base-content/50">
                          {new Date(s.soumisAt).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
