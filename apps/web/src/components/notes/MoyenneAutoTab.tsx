/**
 * @file MoyenneAutoTab.tsx
 * @description Onglet "Moyenne automatique" du module Notes & Examens.
 *
 * Fonctionnalités :
 *  - Filtre par classe + période (date début / date fin).
 *  - Pour chaque élève, affiche par matière :
 *      · Moy. CC  = moyenne pondérée des interrogations + DS
 *      · Moy. Examen = moyenne pondérée des notes de type EXAMEN
 *      · Moy. Finale = (Moy. CC + Moy. Examen) / 2  (ou l'une si l'autre est absente)
 *  - Moyenne générale = moyenne des Moy. Finales de chaque matière.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { Classe, Note } from "@school-mgt/types";

type TypeNote = Note["typeNote"];

// ─── Types réponse API ─────────────────────────────────────────────────────────

interface MoyenneAutoMatiere {
  matiere: { id: string; nom: string };
  notesCC: Note[];
  notesExamen: Note[];
  moyenneCC: number | null;
  moyenneExamen: number | null;
  moyenneFinale: number | null;
}

interface MoyenneAutoEleve {
  eleve: { id: string; nom: string; prenom: string };
  matieres: MoyenneAutoMatiere[];
  moyenneGenerale: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_NOTE_LABELS: Record<TypeNote, string> = {
  INTERROGATION: "Interro",
  DS: "DS",
  EXAMEN: "Examen",
  AUTRE: "Autre",
};

const TYPE_NOTE_BADGE: Record<TypeNote, string> = {
  INTERROGATION: "badge-info",
  DS: "badge-warning",
  EXAMEN: "badge-error",
  AUTRE: "badge-ghost",
};

function colorMoy(
  n: number | null,
  seuilBien = 14,
  seuilAB = 12,
  seuilP = 10,
): string {
  if (n === null) return "text-base-content/40";
  if (n >= seuilBien) return "text-success font-bold";
  if (n >= seuilAB) return "text-warning font-semibold";
  if (n >= seuilP) return "text-base-content font-semibold";
  return "text-error font-bold";
}

function fmtNote(n: number | null): string {
  if (n === null) return "—";
  return n.toFixed(2);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function MoyenneAutoTab() {
  const user = useAuthStore((s) => s.user);

  // ── Valeurs par défaut : année scolaire en cours (sept → juin) ────────────
  const now = new Date();
  const anneeScolaire = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const defaultDebut = `${anneeScolaire}-09-01`;
  const defaultFin = `${anneeScolaire + 1}-06-30`;

  const [classeId, setClasseId] = useState<string>("");
  const [debut, setDebut] = useState<string>(defaultDebut);
  const [fin, setFin] = useState<string>(defaultFin);
  // Contrôle quels élèves ont leurs détails dépliés
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleEleve(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Chargement de toutes les classes ──────────────────────────────────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });

  // ── Chargement des moyennes auto ──────────────────────────────────────────
  const {
    data: resultats = [],
    isLoading,
    isError,
    error,
  } = useQuery<MoyenneAutoEleve[]>({
    queryKey: ["moyenne-auto", classeId, debut, fin],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debut) params.set("debut", debut);
      if (fin) params.set("fin", fin);
      const { data } = await api.get(
        `/api/classes/${classeId}/notes/moyenne-auto?${params}`,
      );
      return data;
    },
    enabled: !!classeId,
  });

  const canView =
    user?.role === "ADMIN" ||
    user?.role === "SUDO_ADMIN" ||
    user?.role === "PROF";

  if (!canView) {
    return (
      <div className="text-center py-16 text-base-content/40 text-sm">
        Accès non autorisé.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Classe */}
        <fieldset className="fieldset min-w-52">
          <legend className="fieldset-legend">Classe</legend>
          <select
            className="select select-sm w-full"
            value={classeId}
            onChange={(e) => {
              setClasseId(e.target.value);
              setExpanded(new Set());
            }}
            aria-label="Sélectionner une classe"
          >
            <option value="">— Sélectionner une classe —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Période début */}
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Période — du</legend>
          <input
            type="date"
            className="input input-sm"
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
            aria-label="Date de début de la période"
          />
        </fieldset>

        {/* Période fin */}
        <fieldset className="fieldset">
          <legend className="fieldset-legend">au</legend>
          <input
            type="date"
            className="input input-sm"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            aria-label="Date de fin de la période"
          />
        </fieldset>

        {/* Légende types */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {(["INTERROGATION", "DS", "EXAMEN"] as TypeNote[]).map((t) => (
            <span key={t} className={`badge badge-sm ${TYPE_NOTE_BADGE[t]}`}>
              {TYPE_NOTE_LABELS[t]}
            </span>
          ))}
          <span className="text-xs text-base-content/40 flex items-center gap-1">
            <CalendarDays size={12} />
            CC = Interro + DS
          </span>
        </div>
      </div>

      {/* ── État vide (aucune classe) ─────────────────────────────────────── */}
      {!classeId && (
        <div className="text-center py-16 text-base-content/40 text-sm">
          Sélectionnez une classe pour calculer les moyennes.
        </div>
      )}

      {/* ── Chargement ───────────────────────────────────────────────────── */}
      {classeId && isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {/* ── Erreur API ────────────────────────────────────────────────────── */}
      {classeId && isError && (
        <div role="alert" className="alert alert-error">
          {getApiError(error, "Erreur lors du calcul des moyennes.")}
        </div>
      )}

      {/* ── Aucun résultat ────────────────────────────────────────────────── */}
      {classeId && !isLoading && !isError && resultats.length === 0 && (
        <div className="text-center py-12 text-base-content/40 text-sm">
          Aucune note de type Interrogation, DS ou Examen sur cette période.
        </div>
      )}

      {/* ── Résultats ─────────────────────────────────────────────────────── */}
      {!isLoading &&
        !isError &&
        resultats.map(({ eleve, matieres, moyenneGenerale }) => {
          const isOpen = expanded.has(eleve.id);
          return (
            <div
              key={eleve.id}
              className="border border-base-300 rounded-box overflow-hidden"
            >
              {/* En-tête élève */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-base-200 hover:bg-base-300 transition-colors"
                onClick={() => toggleEleve(eleve.id)}
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown size={16} className="text-base-content/60" />
                  ) : (
                    <ChevronRight size={16} className="text-base-content/60" />
                  )}
                  <span className="font-semibold">
                    {eleve.nom} {eleve.prenom}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-base-content/50">Moy. générale</span>
                  <span
                    className={`text-lg tabular-nums ${colorMoy(moyenneGenerale)}`}
                  >
                    {fmtNote(moyenneGenerale)}
                  </span>
                  <span className="text-xs text-base-content/40">/20</span>
                </div>
              </button>

              {/* Détail par matière (déplié) */}
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr>
                        <th>Matière</th>
                        <th className="text-center">
                          Moy. CC
                          <div className="text-xs font-normal text-base-content/50">
                            Interros + DS
                          </div>
                        </th>
                        <th className="text-center">
                          Moy. Examen
                        </th>
                        <th className="text-center">
                          Moy. Finale
                        </th>
                        <th>Détail notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matieres.map(
                        ({
                          matiere,
                          notesCC,
                          notesExamen,
                          moyenneCC,
                          moyenneExamen,
                          moyenneFinale,
                        }) => (
                          <tr key={matiere.id}>
                            <td className="font-medium">{matiere.nom}</td>

                            {/* Moy. CC */}
                            <td className="text-center">
                              <span
                                className={`tabular-nums ${colorMoy(moyenneCC)}`}
                              >
                                {fmtNote(moyenneCC)}
                              </span>
                              {notesCC.length > 0 && (
                                <div className="text-xs text-base-content/40">
                                  {notesCC.length} note
                                  {notesCC.length > 1 ? "s" : ""}
                                </div>
                              )}
                            </td>

                            {/* Moy. Examen */}
                            <td className="text-center">
                              <span
                                className={`tabular-nums ${colorMoy(moyenneExamen)}`}
                              >
                                {fmtNote(moyenneExamen)}
                              </span>
                              {notesExamen.length > 0 && (
                                <div className="text-xs text-base-content/40">
                                  {notesExamen.length} note
                                  {notesExamen.length > 1 ? "s" : ""}
                                </div>
                              )}
                            </td>

                            {/* Moy. Finale */}
                            <td className="text-center">
                              <span
                                className={`text-base tabular-nums ${colorMoy(moyenneFinale)}`}
                              >
                                {fmtNote(moyenneFinale)}
                              </span>
                              {moyenneCC !== null &&
                                moyenneExamen !== null && (
                                  <div className="text-xs text-base-content/40">
                                    (CC + Exam) / 2
                                  </div>
                                )}
                            </td>

                            {/* Détail des notes individuelles */}
                            <td>
                              <div className="flex flex-wrap gap-1">
                                {[...notesCC, ...notesExamen].map((note) => (
                                  <span
                                    key={note.id}
                                    className="tooltip"
                                    data-tip={`${note.titre} — ${fmtDate(note.dateEval)}`}
                                  >
                                    <span
                                      className={`badge badge-sm ${TYPE_NOTE_BADGE[note.typeNote]} cursor-default`}
                                    >
                                      {TYPE_NOTE_LABELS[note.typeNote]}{" "}
                                      {Number(note.note)}/{Number(note.noteMax)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>

                    {/* Pied : moyenne générale */}
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="text-right text-sm font-semibold">
                          Moyenne générale :
                        </td>
                        <td className="text-center">
                          <span
                            className={`text-base font-bold tabular-nums ${colorMoy(moyenneGenerale)}`}
                          >
                            {fmtNote(moyenneGenerale)}
                          </span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

