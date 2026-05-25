import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../../lib/api";
import toast from "react-hot-toast";
import type { CahierTexte, Devoir } from "@school-mgt/types";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  ClipboardList,
} from "lucide-react";

type SubTab = "agenda" | "par-matiere" | "devoirs";

interface Props {
  classeId: string;
  matieres: { id: string; nom: string }[];
  canWrite: boolean;
}

const EMPTY_FORM = {
  titre: "",
  detail: "",
  date: new Date().toLocaleDateString("en-CA"),
  matiereId: "",
  devoirs: [] as { titre: string; description: string; dateRendu: string }[],
};

export default function CahierTexteTab({
  classeId,
  matieres,
  canWrite,
}: Props) {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<SubTab>("agenda");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: entries = [], isLoading } = useQuery<CahierTexte[]>({
    queryKey: ["cahier-texte", classeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/cahier-de-texte`,
      );
      return data;
    },
    enabled: !!classeId,
  });

  const { data: devoirs = [] } = useQuery<
    (Devoir & {
      cahierTexte: Pick<CahierTexte, "id" | "titre" | "date"> & {
        matiere?: { id: string; nom: string } | null;
      };
    })[]
  >({
    queryKey: ["devoirs", classeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/cahier-de-texte/devoirs`,
      );
      return data;
    },
    enabled: subTab === "devoirs" && !!classeId,
  });

  const save = useMutation({
    mutationFn: (payload: typeof form) => {
      const body = {
        ...payload,
        matiereId: payload.matiereId || undefined,
        devoirs: payload.devoirs.filter((d) => d.titre),
      };
      return editingId
        ? api.put(`/api/classes/${classeId}/cahier-de-texte/${editingId}`, body)
        : api.post(`/api/classes/${classeId}/cahier-de-texte`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cahier-texte", classeId] });
      queryClient.invalidateQueries({ queryKey: ["devoirs", classeId] });
      toast.success(editingId ? "Entrée mise à jour." : "Entrée ajoutée.");
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(getApiError(err, "Une erreur est survenue.")),
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/classes/${classeId}/cahier-de-texte/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cahier-texte", classeId] });
      queryClient.invalidateQueries({ queryKey: ["devoirs", classeId] });
      toast.success("Entrée supprimée.");
    },
    onError: (err) => toast.error(getApiError(err, "Une erreur est survenue.")),
  });

  function openEdit(entry: CahierTexte) {
    setEditingId(entry.id);
    setForm({
      titre: entry.titre,
      detail: entry.detail ?? "",
      date: entry.date,
      matiereId: entry.matiereId ?? "",
      devoirs:
        entry.devoir?.map((d) => ({
          titre: d.titre,
          description: d.description ?? "",
          dateRendu: d.dateRendu,
        })) ?? [],
    });
    setShowForm(true);
  }

  // ── Vues ──────────────────────────────────────────────────────────────────

  const byMatiere = matieres.map((m) => ({
    ...m,
    entries: entries.filter((e) => e.matiereId === m.id),
  }));

  const entriesSansMatiere = entries.filter((e) => !e.matiereId);

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="tabs tabs-bordered">
          {(
            [
              {
                key: "agenda",
                label: "Agenda",
                icon: <CalendarDays size={14} />,
              },
              {
                key: "par-matiere",
                label: "Par matière",
                icon: <BookOpen size={14} />,
              },
              {
                key: "devoirs",
                label: "Devoirs",
                icon: <ClipboardList size={14} />,
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
        {canWrite && (
          <button
            className="btn btn-primary btn-sm gap-1"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
          >
            <Plus size={14} /> Nouvelle entrée
          </button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body space-y-3">
            <h3 className="font-semibold">
              {editingId ? "Modifier" : "Nouvelle entrée"}
            </h3>
            <input
              className="input input-bordered input-sm w-full"
              placeholder="Titre *"
              value={form.titre}
              onChange={(e) =>
                setForm((f) => ({ ...f, titre: e.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="input input-bordered input-sm"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
              <select
                className="select select-bordered select-sm"
                value={form.matiereId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, matiereId: e.target.value }))
                }
              >
                <option value="">Matière (optionnel)</option>
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              rows={4}
              placeholder="Détail du cours…"
              value={form.detail}
              onChange={(e) =>
                setForm((f) => ({ ...f, detail: e.target.value }))
              }
            />

            {/* Devoirs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Devoirs</span>
                <button
                  className="btn btn-xs btn-ghost"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      devoirs: [
                        ...f.devoirs,
                        { titre: "", description: "", dateRendu: "" },
                      ],
                    }))
                  }
                >
                  <Plus size={12} /> Ajouter
                </button>
              </div>
              {form.devoirs.map((d, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 border border-base-300 rounded p-2"
                >
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <input
                      className="input input-bordered input-xs"
                      placeholder="Titre devoir"
                      value={d.titre}
                      onChange={(e) =>
                        setForm((f) => {
                          const devoirs = [...f.devoirs];
                          devoirs[i] = {
                            ...devoirs[i]!,
                            titre: e.target.value,
                          };
                          return { ...f, devoirs };
                        })
                      }
                    />
                    <input
                      type="date"
                      className="input input-bordered input-xs"
                      value={d.dateRendu}
                      onChange={(e) =>
                        setForm((f) => {
                          const devoirs = [...f.devoirs];
                          devoirs[i] = {
                            ...devoirs[i]!,
                            dateRendu: e.target.value,
                          };
                          return { ...f, devoirs };
                        })
                      }
                    />
                    <button
                      className="btn btn-xs btn-ghost text-error"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          devoirs: f.devoirs.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <textarea
                    className="textarea textarea-bordered textarea-xs w-full"
                    placeholder="Énoncé / description du devoir (optionnel)"
                    rows={2}
                    value={d.description}
                    onChange={(e) =>
                      setForm((f) => {
                        const devoirs = [...f.devoirs];
                        devoirs[i] = {
                          ...devoirs[i]!,
                          description: e.target.value,
                        };
                        return { ...f, devoirs };
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={save.isPending || !form.titre}
                onClick={() => save.mutate(form)}
              >
                {save.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Enregistrer"
                )}
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

      {/* Agenda */}
      {subTab === "agenda" && !isLoading && (
        <div className="space-y-3">
          {entries.length === 0 && (
            <div className="flex flex-col items-center py-12 text-base-content/40 gap-2">
              <BookOpen size={36} />
              <p className="text-sm">Aucune entrée.</p>
            </div>
          )}
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              canWrite={canWrite}
              onEdit={() => openEdit(e)}
              onDelete={() => del.mutate(e.id)}
            />
          ))}
        </div>
      )}

      {/* Par matière */}
      {subTab === "par-matiere" && !isLoading && (
        <div className="space-y-4">
          {byMatiere
            .filter((m) => m.entries.length > 0)
            .map((m) => (
              <div key={m.id}>
                <h3 className="font-semibold text-sm mb-2 text-base-content/60 uppercase tracking-wide">
                  {m.nom}
                </h3>
                <div className="space-y-2">
                  {m.entries.map((e) => (
                    <EntryCard
                      key={e.id}
                      entry={e}
                      canWrite={canWrite}
                      onEdit={() => openEdit(e)}
                      onDelete={() => del.mutate(e.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          {entriesSansMatiere.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 text-base-content/60 uppercase tracking-wide">
                Sans matière
              </h3>
              {entriesSansMatiere.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  canWrite={canWrite}
                  onEdit={() => openEdit(e)}
                  onDelete={() => del.mutate(e.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Devoirs */}
      {subTab === "devoirs" && (
        <div className="overflow-x-auto rounded-xl border border-base-200">
          <table className="table table-sm">
            <thead className="bg-base-200">
              <tr>
                <th>Devoir</th>
                <th>Matière</th>
                <th>À rendre</th>
                <th>Cours</th>
              </tr>
            </thead>
            <tbody>
              {devoirs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center text-base-content/40 py-6"
                  >
                    Aucun devoir.
                  </td>
                </tr>
              )}
              {devoirs.map((d) => (
                <tr key={d.id} className="hover">
                  <td className="font-medium">{d.titre}</td>
                  <td>{d.cahierTexte.matiere?.nom ?? "—"}</td>
                  <td className="font-mono text-sm">{d.dateRendu}</td>
                  <td className="text-base-content/60 text-sm">
                    {d.cahierTexte.titre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  canWrite,
  onEdit,
  onDelete,
}: {
  entry: CahierTexte;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body py-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <button
            className="text-left flex-1"
            onClick={() => setOpen((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-base-content/50">
                {entry.date}
              </span>
              {entry.matiere && (
                <span className="badge badge-outline badge-xs">
                  {entry.matiere.nom}
                </span>
              )}
            </div>
            <p className="font-medium text-sm mt-0.5">{entry.titre}</p>
          </button>
          {canWrite && (
            <div className="flex gap-1 shrink-0">
              <button className="btn btn-ghost btn-xs" onClick={onEdit}>
                <Pencil size={12} />
              </button>
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={onDelete}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
        {open && (
          <div className="mt-2 space-y-2">
            {entry.detail && (
              <p className="text-sm text-base-content/70 whitespace-pre-wrap">
                {entry.detail}
              </p>
            )}
            {entry.devoir && entry.devoir.length > 0 && (
              <div className="bg-warning/10 rounded-lg p-2 space-y-1">
                <p className="text-xs font-semibold text-warning-content">
                  Devoirs
                </p>
                {entry.devoir.map((d) => (
                  <div key={d.id} className="text-sm space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-medium">{d.titre}</span>
                      <span className="text-xs text-base-content/50">
                        pour le {d.dateRendu}
                      </span>
                    </div>
                    {d.description && (
                      <p className="text-xs text-base-content/60 whitespace-pre-wrap">
                        {d.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
