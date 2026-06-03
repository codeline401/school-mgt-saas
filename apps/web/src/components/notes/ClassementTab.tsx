/**
 * @file ClassementTab.tsx
 * @description Onglet "Classement" du module Notes & Examens.
 *
 * Fonctionnalités :
 *  - Filtre par classe + période (début / fin) + mode (Général | Par matière)
 *  - Mode général : classement par moyenne générale avec détail par matière
 *    au survol (tooltip)
 *  - Mode matière : sélection d'une matière, classement par sa moyenne finale
 *    (CC + Examen)
 *  - Gestion des ex-aequo : même rang partagé, badge "Ex-æquo"
 *  - Podium visuel pour les 3 premiers (médailles 🥇🥈🥉)
 *  - Code couleur de la moyenne (vert/jaune/orange/rouge)
 *  - Accès restreint : ADMIN, SUDO_ADMIN, PROF
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal } from "lucide-react";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { Classe, Matiere } from "@school-mgt/types";

// ─── Types réponse API ─────────────────────────────────────────────────────────

interface DetailMatiere {
  matiere: { id: string; nom: string };
  moyenne: number | null;
}

interface EntreeClassement {
  eleve: { id: string; nom: string; prenom: string };
  moyenne: number | null;
  rang: number;
  exAequo: boolean;
  detailMatieres?: DetailMatiere[]; // mode général uniquement
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNote(n: number | null): string {
  return n !== null ? n.toFixed(2) : "—";
}

function colorMoy(n: number | null): string {
  if (n === null) return "text-base-content/40";
  if (n >= 14) return "text-success font-bold";
  if (n >= 12) return "text-warning font-semibold";
  if (n >= 10) return "text-base-content font-semibold";
  return "text-error font-bold";
}

//function getTodayLocal(): string {
//  const d = new Date();
//  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// }

const MEDAILLES = ["🥇", "🥈", "🥉"];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function ClassementTab() {
  const user = useAuthStore((s) => s.user);

  const canView =
    user?.role === "ADMIN" ||
    user?.role === "SUDO_ADMIN" ||
    user?.role === "PROF" ||
    user?.role === "USER";

  // ── Année scolaire en cours comme valeurs par défaut ─────────────────────
  const now = new Date();
  const annee = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;

  const [classeId, setClasseId] = useState<string>("");
  const [debut, setDebut] = useState<string>(`${annee}-09-01`);
  const [fin, setFin] = useState<string>(`${annee + 1}-06-30`);
  const [mode, setMode] = useState<"general" | "matiere">("general");
  const [matiereId, setMatiereId] = useState<string>("");

  // ── Chargement des classes ────────────────────────────────────────────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: canView,
  });

  // ── Chargement des matières de la classe (pour le mode matière) ───────────
  const { data: matieres = [] } = useQuery<Matiere[]>({
    queryKey: ["classe-matieres-classement", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/matieres`);
      return data;
    },
    enabled: canView && !!classeId,
  });

  // ── Chargement du classement ──────────────────────────────────────────────
  const {
    data: classement = [],
    isLoading,
    isError,
    error,
  } = useQuery<EntreeClassement[]>({
    queryKey: ["classement", classeId, debut, fin, mode, matiereId],
    queryFn: async () => {
      const params = new URLSearchParams({ mode });
      if (debut) params.set("debut", debut);
      if (fin) params.set("fin", fin);
      if (mode === "matiere" && matiereId) params.set("matiereId", matiereId);
      const { data } = await api.get(
        `/api/classes/${classeId}/notes/classement?${params}`,
      );
      return data;
    },
    enabled: canView && !!classeId && (mode === "general" || !!matiereId),
  });

  if (!canView) {
    return (
      <div className="text-center py-16 text-base-content/40 text-sm">
        Accès non autorisé.
      </div>
    );
  }

  const nomClasse = classes.find((c) => c.id === classeId)?.nom ?? "";

  // Séparer les élèves avec et sans moyenne
  const avecMoyenne = classement.filter((e) => e.moyenne !== null);
  const sansMoyenne = classement.filter((e) => e.moyenne === null);
  const podium = avecMoyenne
    .filter((e) => e.rang <= 3)
    .sort((a, b) => a.rang - b.rang);

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
              setMatiereId("");
            }}
          >
            <option value="">— Choisir —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Mode */}
        <fieldset className="fieldset min-w-48">
          <legend className="fieldset-legend">Mode de classement</legend>
          <select
            className="select select-sm w-full"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "general" | "matiere");
              setMatiereId("");
            }}
          >
            <option value="general">Moyenne générale</option>
            <option value="matiere">Par matière</option>
          </select>
        </fieldset>

        {/* Matière (mode matière seulement) */}
        {mode === "matiere" && (
          <fieldset className="fieldset min-w-52">
            <legend className="fieldset-legend">Matière</legend>
            <select
              className="select select-sm w-full"
              value={matiereId}
              onChange={(e) => setMatiereId(e.target.value)}
              disabled={!classeId}
            >
              <option value="">— Choisir —</option>
              {matieres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </fieldset>
        )}

        {/* Période */}
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Début</legend>
          <input
            type="date"
            className="input input-sm"
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Fin</legend>
          <input
            type="date"
            className="input input-sm"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
          />
        </fieldset>
      </div>

      {/* ── Placeholder si pas de classe sélectionnée ────────────────────── */}
      {!classeId && (
        <div className="text-center py-16 text-base-content/40 text-sm">
          <Trophy size={40} className="mx-auto mb-3 opacity-20" />
          Sélectionnez une classe pour afficher le classement.
        </div>
      )}

      {/* ── Placeholder si mode matière sans matière ─────────────────────── */}
      {classeId && mode === "matiere" && !matiereId && (
        <div className="text-center py-12 text-base-content/40 text-sm">
          Sélectionnez une matière pour afficher le classement.
        </div>
      )}

      {/* ── Chargement ───────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      )}

      {/* ── Erreur ───────────────────────────────────────────────────────── */}
      {isError && (
        <div className="alert alert-error text-sm">
          {getApiError(error, "Erreur lors du chargement du classement.")}
        </div>
      )}

      {/* ── Résultats ────────────────────────────────────────────────────── */}
      {!isLoading && !isError && classement.length > 0 && (
        <div className="space-y-4">
          {/* En-tête avec titre */}
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-primary" />
            <h2 className="font-semibold text-base">
              Classement — {nomClasse}
              {mode === "matiere" && matiereId
                ? ` — ${matieres.find((m) => m.id === matiereId)?.nom ?? ""}`
                : " — Moyenne générale"}
            </h2>
            <span className="badge badge-ghost badge-sm">
              {avecMoyenne.length} élève{avecMoyenne.length > 1 ? "s" : ""}{" "}
              classé
              {avecMoyenne.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Podium (3 premiers) */}
          {podium.length > 0 && (
            <div className="flex justify-center gap-4 py-2">
              {podium.map((e) => (
                <div
                  key={e.eleve.id}
                  className={`flex flex-col items-center gap-1 p-3 rounded-box border ${
                    e.rang === 1
                      ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                      : e.rang === 2
                        ? "border-gray-400 bg-gray-50 dark:bg-gray-800/20"
                        : "border-amber-600 bg-amber-50 dark:bg-amber-900/20"
                  }`}
                >
                  <span className="text-2xl">{MEDAILLES[e.rang - 1]}</span>
                  <span className="font-semibold text-sm text-center leading-tight">
                    {e.eleve.prenom} {e.eleve.nom}
                  </span>
                  <span className={`text-lg ${colorMoy(e.moyenne)}`}>
                    {fmtNote(e.moyenne)}
                  </span>
                  {e.exAequo && (
                    <span className="badge badge-xs badge-warning">
                      Ex-æquo
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tableau complet */}
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table table-sm w-full">
              <thead className="bg-base-200">
                <tr>
                  <th className="w-14 text-center">Rang</th>
                  <th>Élève</th>
                  <th className="text-right">Moyenne /20</th>
                  {mode === "general" && (
                    <th className="text-center">Détail par matière</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {avecMoyenne.map((e) => (
                  <tr key={e.eleve.id} className="hover">
                    {/* Rang */}
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-bold text-base">
                          {e.rang <= 3 ? MEDAILLES[e.rang - 1] : e.rang}
                        </span>
                        {e.exAequo && (
                          <span className="badge badge-xs badge-warning">
                            Ex-æquo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Élève */}
                    <td className="font-medium">
                      {e.eleve.prenom} {e.eleve.nom}
                    </td>

                    {/* Moyenne */}
                    <td
                      className={`text-right text-base ${colorMoy(e.moyenne)}`}
                    >
                      {fmtNote(e.moyenne)}
                    </td>

                    {/* Détail matières (mode général) */}
                    {mode === "general" && e.detailMatieres && (
                      <td>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {e.detailMatieres
                            .filter((d) => d.moyenne !== null)
                            .map((d) => (
                              <span
                                key={d.matiere.id}
                                className="tooltip"
                                data-tip={`${d.matiere.nom} : ${fmtNote(d.moyenne)}/20`}
                              >
                                <span
                                  className={`badge badge-sm cursor-default ${
                                    d.moyenne !== null && d.moyenne >= 14
                                      ? "badge-success"
                                      : d.moyenne !== null && d.moyenne >= 12
                                        ? "badge-warning"
                                        : d.moyenne !== null && d.moyenne >= 10
                                          ? "badge-ghost"
                                          : "badge-error"
                                  }`}
                                >
                                  {d.matiere.nom.slice(0, 4)}.{" "}
                                  {fmtNote(d.moyenne)}
                                </span>
                              </span>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Élèves sans notes */}
                {sansMoyenne.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan={mode === "general" ? 4 : 3}
                        className="text-center text-xs text-base-content/40 py-2 bg-base-200/50"
                      >
                        Élèves sans notes sur la période
                      </td>
                    </tr>
                    {sansMoyenne.map((e) => (
                      <tr key={e.eleve.id} className="opacity-40">
                        <td className="text-center">—</td>
                        <td>
                          {e.eleve.prenom} {e.eleve.nom}
                        </td>
                        <td className="text-right">—</td>
                        {mode === "general" && <td />}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Légende ex-aequo */}
          {avecMoyenne.some((e) => e.exAequo) && (
            <p className="text-xs text-base-content/50 flex items-center gap-1">
              <Medal size={12} />
              Les élèves avec le même rang partagent une moyenne identique
              (ex-æquo).
            </p>
          )}
        </div>
      )}

      {/* ── Aucune donnée ────────────────────────────────────────────────── */}
      {!isLoading &&
        !isError &&
        classeId &&
        (mode === "general" || !!matiereId) &&
        classement.length === 0 && (
          <div className="text-center py-12 text-base-content/40 text-sm">
            Aucune note trouvée pour cette période.
          </div>
        )}
    </div>
  );
}
