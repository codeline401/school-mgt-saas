import type { Note } from "@school-mgt/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { api, getApiError } from "../../lib/api";
import { Plus, Trash2, Pencil, BookOpen, GraduationCap } from "lucide-react";

interface Props {
  classeId: string;
  matieres: { id: string; nom: string }[];
  canWrite: boolean;
}

const EMPTY_FORM = {
  titre: "",
  noteMax: 20,
  coefficient: 1,
  commentaire: "",
};

export default function NotesTab({ classeId, matieres, canWrite }: Props) {
  const queryClient = useQueryClient();
  // preferredMatiereId tracks the user's explicit selection.
  // selectedMatiereId is derived: falls back to matieres[0] if the preferred
  // id is no longer in the current list (e.g. after a class switch).
  const [preferredMatiereId, setSelectedMatiereId] = useState<string>(
    matieres[0]?.id ?? "",
  );
  const selectedMatiereId =
    matieres.find((m) => m.id === preferredMatiereId)?.id ??
    matieres[0]?.id ??
    "";
  const [showNewEval, setShowNewEval] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editNote, setEditNote] = useState<{
    id: string;
    note: number;
    commentaire: string;
  } | null>(null);

  // Fetch all notes for the class
  const { data: notes = [], isLoading: loadingNotes } = useQuery<Note[]>({
    queryKey: ["notes", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/notes`);
      return data;
    },
    enabled: !!classeId,
  });

  // Fetch all élèves of the class (independent of notes — needed for first eval)
  const { data: classeEleves = [], isLoading: loadingEleves } = useQuery<
    { id: string; nom: string; prenom: string }[]
  >({
    queryKey: ["classe-eleves", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/eleves`);
      return data;
    },
    enabled: !!classeId,
  });

  const isLoading = loadingNotes || loadingEleves;

  // Notes filtered by selected matière
  const filteredNotes = notes.filter((n) => n.matiereId === selectedMatiereId);

  // Build unique evaluation titles for the selected matière
  const evalTitles = [...new Set(filteredNotes.map((n) => n.titre))].sort();

  // Group notes by eleveId
  const byEleve = filteredNotes.reduce<Record<string, Note[]>>((acc, n) => {
    if (!acc[n.eleveId]) acc[n.eleveId] = [];
    acc[n.eleveId].push(n);
    return acc;
  }, {});

  // For the grid: élèves who have at least one note (sorted by nom)
  const elevesWithNotes = Object.values(byEleve)
    .map((ns) => ns[0].eleve!)
    .sort((a, b) => a.nom.localeCompare(b.nom));

  // Add a whole evaluation column (one note per élève)
  const addEvalMutation = useMutation({
    mutationFn: async ({
      eleveId,
      note,
    }: {
      eleveId: string;
      note: number;
    }) => {
      const { data } = await api.post(`/api/classes/${classeId}/notes`, {
        titre: form.titre.trim(),
        note,
        noteMax: form.noteMax,
        coefficient: form.coefficient,
        matiereId: selectedMatiereId,
        eleveId,
      });
      return data;
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la saisie"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      noteId,
      note,
      commentaire,
    }: {
      noteId: string;
      note: number;
      commentaire: string;
    }) => {
      const { data } = await api.put(
        `/api/classes/${classeId}/notes/${noteId}`,
        {
          note,
          ...(commentaire ? { commentaire } : {}),
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", classeId] });
      setEditNote(null);
      toast.success("Note mise à jour");
    },
    onError: (err) => toast.error(getApiError(err, "Erreur mise à jour")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await api.delete(`/api/classes/${classeId}/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", classeId] });
      toast.success("Note supprimée");
    },
    onError: (err) => toast.error(getApiError(err, "Erreur suppression")),
  });

  // State for the bulk entry: eleveId -> note value (during new eval creation)
  const [bulkValues, setBulkValues] = useState<Record<string, string>>({});

  const handleBulkSubmit = async () => {
    if (!selectedMatiereId) {
      toast.error("Sélectionnez une matière");
      return;
    }
    if (!form.titre.trim()) {
      toast.error("Le titre de l'évaluation est requis");
      return;
    }
    const entries = Object.entries(bulkValues).filter(([, v]) => v !== "");
    if (entries.length === 0) {
      toast.error("Saisissez au moins une note");
      return;
    }
    for (const [eleveId, val] of entries) {
      const note = parseFloat(val);
      if (isNaN(note) || note < 0 || note > form.noteMax) {
        toast.error(
          `Note invalide pour un élève (doit être entre 0 et ${form.noteMax})`,
        );
        return;
      }
      await addEvalMutation.mutateAsync({ eleveId, note });
    }
    // Single invalidation after the whole batch
    queryClient.invalidateQueries({ queryKey: ["notes", classeId] });
    toast.success("Évaluation enregistrée");
    setShowNewEval(false);
    setForm(EMPTY_FORM);
    setBulkValues({});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: matière selector + new eval button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen size={30} className="text-base-content/50" />
          <span className="text-sm font-medium">Matière :</span>
          <select
            className="select select-sm select-bordered"
            value={selectedMatiereId}
            onChange={(e) => {
              setSelectedMatiereId(e.target.value);
              setShowNewEval(false);
            }}
          >
            {matieres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>

        {canWrite && !showNewEval && (
          <button
            className="btn btn-sm btn-primary gap-1"
            onClick={() => setShowNewEval(true)}
          >
            <Plus size={14} /> Nouvelle évaluation
          </button>
        )}
      </div>

      {/* New evaluation form */}
      {showNewEval && (
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body gap-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <GraduationCap size={15} /> Nouvelle évaluation
            </h3>

            <div className="flex flex-wrap gap-3">
              <fieldset className="fieldset flex-1 min-w-40">
                <legend className="fieldset-legend">Titre *</legend>
                <input
                  className="input input-sm w-full"
                  placeholder="ex: DS1, Examen final..."
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                />
              </fieldset>
              <fieldset className="fieldset w-24">
                <legend className="fieldset-legend">Note max</legend>
                <input
                  type="number"
                  className="input input-sm w-full"
                  min={1}
                  value={form.noteMax}
                  onChange={(e) =>
                    setForm({ ...form, noteMax: +e.target.value })
                  }
                />
              </fieldset>
              <fieldset className="fieldset w-24">
                <legend className="fieldset-legend">Coefficient</legend>
                <input
                  type="number"
                  className="input input-sm w-full"
                  min={1}
                  value={form.coefficient}
                  onChange={(e) =>
                    setForm({ ...form, coefficient: +e.target.value })
                  }
                />
              </fieldset>
            </div>

            {/* Bulk entry table */}
            {classeEleves.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Élève</th>
                      <th className="w-32">Note / {form.noteMax}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classeEleves.map((eleve) => (
                      <tr key={eleve.id}>
                        <td>
                          {eleve.prenom} {eleve.nom}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="input input-sm w-24"
                            min={0}
                            max={form.noteMax}
                            step={0.5}
                            placeholder="—"
                            value={bulkValues[eleve.id] ?? ""}
                            onChange={(e) =>
                              setBulkValues({
                                ...bulkValues,
                                [eleve.id]: e.target.value,
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-base-content/40">
                Aucun élève dans cette classe.
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setShowNewEval(false);
                  setForm(EMPTY_FORM);
                  setBulkValues({});
                }}
              >
                Annuler
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleBulkSubmit}
                disabled={addEvalMutation.isPending || !selectedMatiereId}
              >
                {addEvalMutation.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes grid */}
      {evalTitles.length === 0 ? (
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body items-center py-10 text-base-content/40">
            <GraduationCap size={36} />
            <p className="text-sm mt-2">
              Aucune note pour cette matière.
              {canWrite && " Créez une évaluation pour commencer."}
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-base-100 z-10">Élève</th>
                {evalTitles.map((titre) => {
                  const sample = filteredNotes.find((n) => n.titre === titre);
                  return (
                    <th key={titre} className="text-center whitespace-nowrap">
                      <div>{titre}</div>
                      <div className="font-normal text-xs text-base-content/40">
                        /{sample?.noteMax} · coef {sample?.coefficient}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {elevesWithNotes.map((eleve) => {
                const eleveNotes = byEleve[eleve.id] ?? [];
                return (
                  <tr key={eleve.id}>
                    <td className="sticky left-0 bg-base-100 z-10 font-medium whitespace-nowrap">
                      {eleve.prenom} {eleve.nom}
                    </td>
                    {evalTitles.map((titre) => {
                      const n = eleveNotes.find((note) => note.titre === titre);
                      return (
                        <td key={titre} className="text-center">
                          {n ? (
                            editNote?.id === n.id ? (
                              <div className="flex items-center gap-1 justify-center">
                                <input
                                  type="number"
                                  className="input input-xs w-16"
                                  min={0}
                                  max={n.noteMax}
                                  step={0.5}
                                  value={editNote.note}
                                  onChange={(e) =>
                                    setEditNote({
                                      ...editNote,
                                      note: +e.target.value,
                                    })
                                  }
                                />
                                <button
                                  className="btn btn-xs btn-success"
                                  onClick={() =>
                                    updateMutation.mutate({
                                      noteId: editNote!.id,
                                      note: editNote!.note,
                                      commentaire: editNote!.commentaire,
                                    })
                                  }
                                  disabled={updateMutation.isPending}
                                >
                                  ✓
                                </button>
                                <button
                                  className="btn btn-xs btn-ghost"
                                  onClick={() => setEditNote(null)}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 justify-center group">
                                <span
                                  className={`font-semibold ${
                                    n.note / n.noteMax >= 0.5
                                      ? "text-success"
                                      : "text-error"
                                  }`}
                                >
                                  {Number(n.note).toFixed(2)}
                                </span>
                                {canWrite && (
                                  <div className="hidden group-hover:flex gap-1">
                                    <button
                                      className="btn btn-ghost btn-xs"
                                      onClick={() =>
                                        setEditNote({
                                          id: n.id,
                                          note: Number(n.note),
                                          commentaire: n.commentaire ?? "",
                                        })
                                      }
                                    >
                                      <Pencil size={11} />
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-xs text-error"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Supprimer la note de ${eleve.prenom} ${eleve.nom} ?`,
                                          )
                                        )
                                          deleteMutation.mutate(n.id);
                                      }}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          ) : (
                            <span className="text-base-content/20">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
