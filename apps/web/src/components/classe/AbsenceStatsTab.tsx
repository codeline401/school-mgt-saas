import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { AbsenceStatsResponse } from "@school-mgt/types";
import { BarChart2, TrendingDown } from "lucide-react";

// ── Helpers période ────────────────────────────────────────────────────────

function padZ(n: number) {
  return String(n).padStart(2, "0");
}

function monthRange(year: number, month: number): { from: string; to: string } {
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${padZ(month)}-01`,
    to: `${year}-${padZ(month)}-${padZ(lastDay)}`,
  };
}

type PeriodKey =
  | "mois-courant"
  | "mois-precedent"
  | "trimestre-1"
  | "trimestre-2"
  | "trimestre-3"
  | "annee-scolaire";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "mois-courant", label: "Ce mois" },
  { key: "mois-precedent", label: "Mois précédent" },
  { key: "trimestre-1", label: "Trimestre 1 (sept – nov)" },
  { key: "trimestre-2", label: "Trimestre 2 (déc – fév)" },
  { key: "trimestre-3", label: "Trimestre 3 (mars – juin)" },
  { key: "annee-scolaire", label: "Année scolaire" },
];

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function resolvePeriod(key: PeriodKey): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-based

  // Année scolaire : sept Y-1 → juin Y si on est janv–août, sinon sept Y → juin Y+1
  const schoolYear = m >= 9 ? y : y - 1;

  switch (key) {
    case "mois-courant":
      return monthRange(y, m);
    case "mois-precedent": {
      const pm = m === 1 ? 12 : m - 1;
      const py = m === 1 ? y - 1 : y;
      return monthRange(py, pm);
    }
    case "trimestre-1":
      return { from: `${schoolYear}-09-01`, to: `${schoolYear}-11-30` };
    case "trimestre-2":
      return {
        from: `${schoolYear}-12-01`,
        to: `${schoolYear + 1}-02-${isLeapYear(schoolYear + 1) ? 29 : 28}`,
      };
    case "trimestre-3":
      return {
        from: `${schoolYear + 1}-03-01`,
        to: `${schoolYear + 1}-06-30`,
      };
    case "annee-scolaire":
      return {
        from: `${schoolYear}-09-01`,
        to: `${schoolYear + 1}-06-30`,
      };
  }
}

// ── Helpers affichage ──────────────────────────────────────────────────────

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function tauxColor(taux: number) {
  if (taux >= 90) return "text-success";
  if (taux >= 70) return "text-warning";
  return "text-error";
}

function tauxBadge(taux: number) {
  if (taux >= 90) return "badge-success";
  if (taux >= 70) return "badge-warning";
  return "badge-error";
}

// ── Composant ──────────────────────────────────────────────────────────────

interface Props {
  classeId: string;
}

export default function AbsenceStatsTab({ classeId }: Props) {
  const [period, setPeriod] = useState<PeriodKey>("mois-courant");
  const { from, to } = resolvePeriod(period);

  const { data, isLoading, isError } = useQuery<AbsenceStatsResponse>({
    queryKey: ["absence-stats", classeId, from, to],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/appels/stats/absences`,
        { params: { from, to } },
      );
      return data;
    },
    enabled: !!classeId,
  });

  return (
    <div className="space-y-4">
      {/* En-tête + filtre période */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-base-content/70">
          <BarChart2 size={18} />
          <span className="text-sm font-medium">
            {data
              ? `${data.totalAppels} appel${data.totalAppels > 1 ? "s" : ""} du ${formatDate(data.from)} au ${formatDate(data.to)}`
              : "Statistiques de présences"}
          </span>
        </div>
        <select
          className="select select-bordered select-sm w-full sm:w-auto"
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* États de chargement / erreur */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-md" />
        </div>
      )}

      {isError && (
        <div className="alert alert-error">
          <span>Impossible de charger les statistiques.</span>
        </div>
      )}

      {/* Aucun appel sur la période */}
      {data && data.totalAppels === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-base-content/40 gap-3">
          <BarChart2 size={40} />
          <p className="text-sm">Aucun appel enregistré sur cette période.</p>
        </div>
      )}

      {/* Tableau des stats */}
      {data && data.totalAppels > 0 && (
        <>
          {/* Alerte élèves très absents */}
          {data.stats.some((s) => s.tauxPresence < 70) && (
            <div className="alert alert-warning gap-2 text-sm">
              <TrendingDown size={16} />
              <span>
                {data.stats.filter((s) => s.tauxPresence < 70).length} élève(s)
                avec un taux de présence inférieur à 70 %.
              </span>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-base-200">
            <table className="table table-sm w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>Élève</th>
                  <th className="text-center text-success">P</th>
                  <th className="text-center text-error">A</th>
                  <th className="text-center text-warning">R</th>
                  <th className="text-center">Non notés</th>
                  <th className="text-right">Taux présence</th>
                </tr>
              </thead>
              <tbody>
                {data.stats.map((s) => {
                  const nonNotes = Math.max(
                    0,
                    data.totalAppels - s.appelsEleve,
                  );
                  return (
                    <tr key={s.eleveId} className="hover">
                      <td className="font-medium">
                        {s.nom} {s.prenom}
                      </td>
                      <td className="text-center text-success font-semibold">
                        {s.present}
                      </td>
                      <td className="text-center text-error font-semibold">
                        {s.absent}
                      </td>
                      <td className="text-center text-warning font-semibold">
                        {s.retard}
                      </td>
                      <td className="text-center text-base-content/40">
                        {nonNotes > 0 ? nonNotes : "—"}
                      </td>
                      <td className="text-right">
                        <span
                          className={`badge badge-sm ${tauxBadge(s.tauxPresence)}`}
                        >
                          <span className={tauxColor(s.tauxPresence)}>
                            {s.tauxPresence} %
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Résumé global */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Taux moyen",
                value:
                  data.stats.length > 0
                    ? `${Math.round((data.stats.reduce((acc, s) => acc + s.tauxPresence, 0) / data.stats.length) * 10) / 10} %`
                    : "—",
                color: "text-primary",
              },
              {
                label: "Élèves suivis",
                value: data.stats.length,
                color: "text-base-content",
              },
              {
                label: "Total absences",
                value: data.stats.reduce((acc, s) => acc + s.absent, 0),
                color: "text-error",
              },
              {
                label: "Total retards",
                value: data.stats.reduce((acc, s) => acc + s.retard, 0),
                color: "text-warning",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="stat bg-base-200 rounded-xl py-3 px-4"
              >
                <div className="stat-title text-xs">{card.label}</div>
                <div className={`stat-value text-2xl ${card.color}`}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
