/**
 * @file EleveAbsenceCard.tsx
 * @description Carte de suivi des absences et retards d'un élève.
 *
 * Appelle deux endpoints :
 *   1. GET /api/classes/:classeId/appels/stats/absences?from=...&to=...
 *      → statistiques agrégées (présences / absences / retards / taux)
 *        sur la période sélectionnée par l'utilisateur.
 *
 *   2. GET /api/classes/:classeId/appels
 *      → liste complète des appels de la classe (avec présences incluses)
 *        utilisée pour afficher l'historique des 10 derniers appels de l'élève.
 *        Ce fetch est indépendant de la plage de dates sélectionnée, de façon
 *        à toujours montrer les 10 entrées les plus récentes, quelle que soit
 *        la période choisie pour les stats agrégées.
 *
 * Fonctionnalités :
 *  - Sélecteur de plage de dates (mois courant par défaut).
 *  - Contraintes min/max sur les date pickers pour prévenir from > to.
 *  - Alerte visuelle + requête désactivée quand la plage est invalide.
 *  - Compteurs agrégés : présences, absences, retards + barre de taux.
 *  - Tableau des 10 derniers appels de l'élève (toutes dates confondues).
 *
 * Note sur le champ "enregistreur / professeur" :
 *   Le modèle `Appel` ne stocke pas de champ createdBy ou recorder.
 *   Cette colonne ne peut donc pas être affichée ; seuls la date, le créneau
 *   et le statut sont disponibles.
 */

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Clock,
  BarChart2,
  CalendarDays,
} from "lucide-react";
import { api, getApiError } from "../lib/api";
import type { AbsenceStatsResponse, Appel } from "@school-mgt/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retourne le premier jour du mois courant au format YYYY-MM-DD. */
function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Retourne le dernier jour du mois courant au format YYYY-MM-DD. */
function lastDayOfMonth(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

/**
 * Vérifie que la plage [from, to] est valide (from <= to, les deux renseignés).
 * Utilisé pour conditionner les requêtes et afficher un message d'erreur.
 */
function isValidRange(from: string, to: string): boolean {
  if (!from || !to) return false;
  return new Date(from) <= new Date(to);
}

/**
 * Détermine la classe CSS DaisyUI de la barre de progression selon le taux.
 * @param taux - taux de présence de 0 à 100
 */
function progressColor(taux: number): string {
  if (taux >= 80) return "progress-success";
  if (taux >= 60) return "progress-warning";
  return "progress-error";
}

/** Formate une date YYYY-MM-DD en date locale française. */
function fmtDate(val: string): string {
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString("fr-FR");
}

// ─── Configuration des badges de statut ──────────────────────────────────────

/**
 * Libellé et classe DaisyUI pour chaque valeur de `StatutPresence`.
 * La clé `UNKNOWN` sert de fallback si une valeur inconnue arrive de l'API.
 */
const STATUT_BADGE: Record<string, { label: string; cls: string }> = {
  PRESENT: { label: "Présent", cls: "badge-success" },
  ABSENT: { label: "Absent", cls: "badge-error" },
  RETARD: { label: "Retard", cls: "badge-warning" },
  UNKNOWN: { label: "—", cls: "badge-ghost" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface EleveAbsenceCardProps {
  /** Identifiant de l'élève (pour filtrer les stats et l'historique). */
  eleveId: string;
  /** Identifiant de la classe (requis par les deux endpoints). */
  classeId: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Carte affichant les statistiques de présence d'un élève sur une période
 * configurable, ainsi que l'historique de ses 10 derniers appels.
 *
 * Si `classeId` est vide, un message informatif est affiché à la place.
 */
export default function EleveAbsenceCard({
  eleveId,
  classeId,
}: EleveAbsenceCardProps) {
  // ── État : plage de dates (stats agrégées) ────────────────────────────────
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(lastDayOfMonth());

  /**
   * Indique si la plage [from, to] est cohérente.
   * Quand elle ne l'est pas :
   *   - la requête stats est suspendue (enabled: false)
   *   - un message d'alerte s'affiche sous les pickers
   */
  const rangeValid = isValidRange(from, to);

  // ── 1. Requête : statistiques agrégées sur la période ─────────────────────
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
  } = useQuery<AbsenceStatsResponse>({
    queryKey: ["absenceStats", classeId, from, to],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/appels/stats/absences`,
        { params: { from, to } },
      );
      return data;
    },
    // Désactivé si : pas de classe assignée OU plage de dates invalide.
    enabled: !!classeId && rangeValid,
  });

  // Statistiques de cet élève dans la réponse globale de la classe
  const stat = statsData?.stats.find((s) => s.eleveId === eleveId);

  // ── 2. Requête : liste des appels de la classe (toutes dates) ─────────────
  /**
   * On récupère l'intégralité des appels de la classe afin d'extraire
   * les 10 plus récents concernant cet élève.
   * Le tri descending est appliqué côté API (orderBy: { date: "desc" }).
   */
  const {
    data: appels,
    isLoading: appelsLoading,
    isError: appelsError,
    error: appelsErr,
  } = useQuery<Appel[]>({
    queryKey: ["appels", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/appels`);
      return data;
    },
    // Désactivé si l'élève n'a pas de classe — la plage n'est pas nécessaire ici
    enabled: !!classeId,
  });

  /**
   * Extrait les 10 derniers appels où une présence existe pour cet élève.
   * L'API retourne déjà les appels triés par date décroissante,
   * donc un simple filter + slice suffit.
   */
  const derniersDixAppels = (appels ?? [])
    .filter((a) => a.presences?.some((p) => p.eleveId === eleveId))
    .slice(0, 10);

  // ── Gestionnaire de changement de date ────────────────────────────────────
  /**
   * Met à jour `from` ou `to`. Le constraint min/max sur les inputs
   * empêche la plupart des saisies invalides, mais `rangeValid` garantit
   * que la requête n'est jamais envoyée avec from > to.
   */
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "from") setFrom(value);
    else setTo(value);
  };

  // ── Rendu : pas de classe assignée ────────────────────────────────────────
  if (!classeId) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-base mb-2">
            <BarChart2 size={16} /> Suivi absences &amp; retards
          </h2>
          <p className="text-base-content/40 text-sm">
            Aucune classe assignée — le suivi ne peut pas être calculé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body space-y-4">
        {/* ── Titre ────────────────────────────────────────────────────── */}
        <h2 className="card-title text-base">
          <BarChart2 size={16} /> Suivi absences &amp; retards
        </h2>

        {/* ── Section 1 : Statistiques agrégées ────────────────────────── */}
        <section aria-label="Statistiques de présence sur la période">
          <h3 className="text-sm font-semibold text-base-content/70 mb-3">
            Statistiques de la période
          </h3>

          {/* Sélecteur de période */}
          <div className="flex flex-wrap items-end gap-3 mb-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Du</legend>
              <input
                type="date"
                className="input input-sm"
                name="from"
                /*
                 * max=to empêche de sélectionner une date de début après
                 * la date de fin directement depuis le picker natif.
                 */
                max={to}
                onChange={handleDateChange}
                aria-label="Date de début de la période"
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Au</legend>
              <input
                type="date"
                className="input input-sm"
                name="to"
                /*
                 * min=from empêche de sélectionner une date de fin avant
                 * la date de début.
                 */
                min={from}
                onChange={handleDateChange}
                aria-label="Date de fin de la période"
              />
            </fieldset>
          </div>

          {/* Alerte plage invalide (fallback si le picker natif est contourné) */}
          {!rangeValid && (
            <div role="alert" className="alert alert-warning alert-soft mb-3">
              <span className="text-sm">
                La date de début doit être antérieure ou égale à la date de fin.
              </span>
            </div>
          )}

          {/* Chargement stats */}
          {statsLoading && rangeValid && (
            <div className="flex justify-center py-4" aria-busy="true">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}

          {/* Erreur stats */}
          {statsError && (
            <div role="alert" className="alert alert-error alert-soft">
              <span>
                {getApiError(statsErr, "Impossible de charger les stats.")}
              </span>
            </div>
          )}

          {/* Résultats stats */}
          {statsData && rangeValid && (
            <>
              {!stat || stat.appelsEleve === 0 ? (
                <p className="text-base-content/40 text-sm">
                  Aucun appel enregistré pour cet élève sur la période
                  sélectionnée.
                </p>
              ) : (
                <>
                  {/* Compteurs */}
                  <div
                    className="stats stats-horizontal shadow w-full mb-4"
                    aria-label="Compteurs de présence"
                  >
                    <div className="stat place-items-center">
                      <div className="stat-figure text-success">
                        <CheckCircle size={24} />
                      </div>
                      <div className="stat-title text-xs">Présences</div>
                      <div className="stat-value text-success text-2xl">
                        {stat.present}
                      </div>
                      <div className="stat-desc">
                        sur {stat.appelsEleve} appels
                      </div>
                    </div>

                    <div className="stat place-items-center">
                      <div className="stat-figure text-error">
                        <XCircle size={24} />
                      </div>
                      <div className="stat-title text-xs">Absences</div>
                      <div className="stat-value text-error text-2xl">
                        {stat.absent}
                      </div>
                    </div>

                    <div className="stat place-items-center">
                      <div className="stat-figure text-warning">
                        <Clock size={24} />
                      </div>
                      <div className="stat-title text-xs">Retards</div>
                      <div className="stat-value text-warning text-2xl">
                        {stat.retard}
                      </div>
                    </div>
                  </div>

                  {/* Barre de taux de présence */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">
                        Taux de présence
                      </span>
                      <span className="font-semibold">
                        {stat.tauxPresence}&nbsp;%
                      </span>
                    </div>
                    <progress
                      className={`progress w-full ${progressColor(stat.tauxPresence)}`}
                      value={stat.tauxPresence}
                      max={100}
                      aria-label={`Taux de présence : ${stat.tauxPresence} %`}
                    />
                  </div>

                  {/* Légende */}
                  <p className="text-xs text-base-content/40 mt-1">
                    Période&nbsp;: {statsData.from} → {statsData.to} —{" "}
                    {statsData.totalAppels} appel(s) au total dans la classe
                  </p>
                </>
              )}
            </>
          )}
        </section>

        {/* ── Séparateur ───────────────────────────────────────────────── */}
        <div className="divider my-0" />

        {/* ── Section 2 : Historique des 10 derniers appels ────────────── */}
        <section aria-label="Historique des 10 derniers appels">
          <h3 className="text-sm font-semibold text-base-content/70 mb-3 flex items-center gap-1">
            <CalendarDays size={14} /> 10 derniers appels
          </h3>

          {/* Chargement historique */}
          {appelsLoading && (
            <div className="flex justify-center py-4" aria-busy="true">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}

          {/* Erreur historique */}
          {appelsError && (
            <div role="alert" className="alert alert-error alert-soft">
              <span>
                {getApiError(
                  appelsErr,
                  "Impossible de charger l'historique des appels.",
                )}
              </span>
            </div>
          )}

          {/* Liste des appels */}
          {appels && (
            <>
              {derniersDixAppels.length === 0 ? (
                /* État vide */
                <p className="text-base-content/40 text-sm">
                  Aucun appel enregistré pour cet élève.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="table table-sm table-zebra"
                    aria-label="Historique des derniers appels de l'élève"
                  >
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Créneau</th>
                        <th scope="col">Matière</th>
                        <th scope="col">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {derniersDixAppels.map((appel) => {
                        /*
                         * On récupère la présence de cet élève dans cet appel.
                         * Elle existe forcément (filtre précédent), mais on
                         * utilise l'opérateur ?. par sécurité.
                         */
                        const presence = appel.presences?.find(
                          (p) => p.eleveId === eleveId,
                        );
                        const statut = presence?.statut ?? "UNKNOWN";
                        const badge =
                          STATUT_BADGE[statut] ?? STATUT_BADGE.UNKNOWN;

                        const creneau = appel.creneau;
                        const horaire = creneau
                          ? `${creneau.heureDebut}–${creneau.heureFin}`
                          : "—";
                        const matiere =
                          creneau?.matiere?.nom ?? creneau?.intitule ?? "—";

                        return (
                          <tr key={appel.id}>
                            <td>{fmtDate(appel.date)}</td>
                            <td>{horaire}</td>
                            <td>{matiere}</td>
                            <td>
                              <span
                                className={`badge badge-sm ${badge.cls}`}
                                aria-label={`Statut : ${badge.label}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
