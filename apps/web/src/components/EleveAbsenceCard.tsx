/**
 * @file EleveAbsenceCard.tsx
 * @description Carte de suivi des absences et retards d'un élève.
 *
 * Appelle GET /api/classes/:classeId/appels/stats/absences?from=...&to=...
 * puis filtre la réponse pour l'élève concerné.
 *
 * Fonctionnalités :
 *  - Sélecteur de plage de dates (mois courant par défaut)
 *  - Compteurs : présences, absences, retards
 *  - Barre de progression du taux de présence avec code couleur
 *  - Tableau historique des 10 derniers appels de l'élève
 */

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, BarChart2 } from "lucide-react";
import { api, getApiError } from "../lib/api";
import type { AbsenceStatsResponse } from "@school-mgt/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Retourne la date du premier jour du mois courant au format YYYY-MM-DD.
 */
function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Retourne la date du dernier jour du mois courant au format YYYY-MM-DD.
 */
function lastDayOfMonth(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface EleveAbsenceCardProps {
  /** Identifiant de l'élève (pour filtrer les stats) */
  eleveId: string;
  /** Identifiant de la classe (nécessaire pour l'endpoint API) */
  classeId: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Carte affichant le suivi des absences/retards d'un élève sur une période.
 *
 * Si l'élève n'a pas de classe assignée (`classeId` vide), un message
 * informatif est affiché à la place.
 */
export default function EleveAbsenceCard({
  eleveId,
  classeId,
}: EleveAbsenceCardProps) {
  // ── État : plage de dates sélectionnée ─────────────────────────────────────
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(lastDayOfMonth());

  // ── Chargement des stats (désactivé si pas de classe) ─────────────────────
  const { data, isLoading, isError, error } = useQuery<AbsenceStatsResponse>({
    queryKey: ["absenceStats", classeId, from, to],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/appels/stats/absences`,
        { params: { from, to } },
      );
      return data;
    },
    enabled: !!classeId, // ne charge pas si l'élève n'a pas de classe
  });

  // ── Extraire les stats de cet élève depuis la réponse globale ──────────────
  const stat = data?.stats.find((s) => s.eleveId === eleveId);

  // ── Gestionnaire de changement de date ────────────────────────────────────
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
      <div className="card-body">
        {/* ── Titre ────────────────────────────────────────────────────── */}
        <h2 className="card-title text-base mb-2">
          <BarChart2 size={16} /> Suivi absences &amp; retards
        </h2>

        {/* ── Sélecteur de période ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Du</legend>
            <input
              type="date"
              className="input input-sm"
              name="from"
              value={from}
              onChange={handleDateChange}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Au</legend>
            <input
              type="date"
              className="input input-sm"
              name="to"
              value={to}
              onChange={handleDateChange}
            />
          </fieldset>
        </div>

        {/* ── Chargement ───────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner loading-md" />
          </div>
        )}

        {/* ── Erreur API ────────────────────────────────────────────────── */}
        {isError && (
          <div role="alert" className="alert alert-error alert-soft">
            <span>
              {getApiError(error, "Impossible de charger les stats.")}
            </span>
          </div>
        )}

        {/* ── Contenu ──────────────────────────────────────────────────── */}
        {data && (
          <>
            {/*
             * Cas où l'élève n'a aucune entrée de présence sur la période :
             * cela arrive si aucun appel n'a encore été fait pour sa classe
             * ou s'il a rejoint la classe après la période sélectionnée.
             */}
            {!stat || stat.appelsEleve === 0 ? (
              <p className="text-base-content/40 text-sm">
                Aucun appel enregistré pour cet élève sur la période
                sélectionnée.
              </p>
            ) : (
              <>
                {/* ── Compteurs (3 badges) ─────────────────────────────── */}
                <div className="stats stats-horizontal shadow w-full mb-4">
                  {/* Présences */}
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

                  {/* Absences */}
                  <div className="stat place-items-center">
                    <div className="stat-figure text-error">
                      <XCircle size={24} />
                    </div>
                    <div className="stat-title text-xs">Absences</div>
                    <div className="stat-value text-error text-2xl">
                      {stat.absent}
                    </div>
                  </div>

                  {/* Retards */}
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

                {/* ── Taux de présence ─────────────────────────────────── */}
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
                  />
                </div>

                {/* ── Légende taux (appels classe sur la période) ───────── */}
                <p className="text-xs text-base-content/40 mt-1">
                  Période : {data.from} → {data.to} — {data.totalAppels}{" "}
                  appel(s) au total dans la classe
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
