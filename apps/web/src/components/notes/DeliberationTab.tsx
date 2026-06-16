import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { Classe, Eleve } from "@school-mgt/types";

type DecisionPassage = "PASSE" | "REDOUBLE" | "ORIENTE" | "EXCLU";
type MentionDeliberation =
  | "AUCUNE"
  | "ENCOURAGEMENT"
  | "TABLEAU_HONNEUR"
  | "FELICITATIONS";
type AvertissementDeliberation =
  | "AUCUN"
  | "TRAVAIL"
  | "CONDUITE"
  | "RETARDS"
  | "DISCIPLINE"
  | "GENERAL";

interface DeliberationDecision {
  id: string;
  sessionId: string;
  eleveId: string;
  eleve: { id: string; nom: string; prenom: string };
  decision: DecisionPassage;
  mention: MentionDeliberation;
  avertissement: AvertissementDeliberation;
  commentaire?: string | null;
}

interface DeliberationSession {
  id: string;
  classeId: string;
  periodeLabel: string;
  anneeScolaire: string;
  statut: "BROUILLON" | "VALIDEE";
  compteRendu?: string | null;
  validatedAt?: string | null;
  createdAt: string;
  decisions: DeliberationDecision[];
  tauxReussite: number | null;
}

interface LocalDecisionRow {
  eleveId: string;
  decision: DecisionPassage;
  mention: MentionDeliberation;
  avertissement: AvertissementDeliberation;
  commentaire: string;
}

const DECISIONS: Array<{ value: DecisionPassage; label: string }> = [
  { value: "PASSE", label: "Passage" },
  { value: "REDOUBLE", label: "Redoublement" },
  { value: "ORIENTE", label: "Orientation" },
  { value: "EXCLU", label: "Exclusion" },
];

const MENTIONS: Array<{ value: MentionDeliberation; label: string }> = [
  { value: "AUCUNE", label: "Aucune" },
  { value: "ENCOURAGEMENT", label: "Encouragement" },
  { value: "TABLEAU_HONNEUR", label: "Tableau d'honneur" },
  { value: "FELICITATIONS", label: "Félicitations" },
];

const AVERTISSEMENTS: Array<{
  value: AvertissementDeliberation;
  label: string;
}> = [
  { value: "AUCUN", label: "Aucun" },
  { value: "TRAVAIL", label: "Travail" },
  { value: "CONDUITE", label: "Conduite" },
  { value: "RETARDS", label: "Retards" },
  { value: "DISCIPLINE", label: "Discipline" },
  { value: "GENERAL", label: "Général" },
];

function todaySchoolYear(): string {
  const d = new Date();
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

export default function DeliberationTab() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const canView =
    user?.role === "SUDO_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "USER" ||
    user?.role === "PROF";

  const canEdit =
    user?.role === "SUDO_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "USER";

  const [classeId, setClasseId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const [periodeLabel, setPeriodeLabel] = useState("Trimestre 1");
  const [anneeScolaire, setAnneeScolaire] = useState(todaySchoolYear());
  const [compteRendu, setCompteRendu] = useState("");

  const [rows, setRows] = useState<Record<string, LocalDecisionRow>>({});

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: canView,
  });

  const { data: eleves = [] } = useQuery<Eleve[]>({
    queryKey: ["classe-eleves-delib", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/eleves`);
      return data;
    },
    enabled: canView && !!classeId,
  });

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
  } = useQuery<DeliberationSession[]>({
    queryKey: ["deliberations", classeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/notes/deliberations`,
      );
      return data;
    },
    enabled: canView && !!classeId,
  });

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  function buildRows(session: DeliberationSession | null): Record<string, LocalDecisionRow> {
    if (!session) return {};
    const map: Record<string, LocalDecisionRow> = {};
    for (const e of eleves) {
      const existing = session.decisions.find((d) => d.eleveId === e.id);
      map[e.id] = {
        eleveId: e.id,
        decision: existing?.decision ?? "PASSE",
        mention: existing?.mention ?? "AUCUNE",
        avertissement: existing?.avertissement ?? "AUCUN",
        commentaire: existing?.commentaire ?? "",
      };
    }
    return map;
  }

  function selectSession(session: DeliberationSession | null) {
    setSelectedSessionId(session?.id ?? null);
    setCompteRendu(session?.compteRendu ?? "");
    setRows(buildRows(session));
  }

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        periodeLabel,
        anneeScolaire,
        compteRendu: compteRendu || undefined,
      };
      const { data } = await api.post(
        `/api/classes/${classeId}/notes/deliberations`,
        payload,
      );
      return data as DeliberationSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deliberations", classeId] });
      setSelectedSessionId(data.id);
      setCompteRendu(data.compteRendu ?? "");
      setRows(buildRows(data));
    },
  });

  const saveCompteRenduMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSessionId) return null;
      const { data } = await api.put(
        `/api/classes/${classeId}/notes/deliberations/${selectedSessionId}`,
        { compteRendu },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliberations", classeId] });
    },
  });

  const saveDecisionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSessionId) return null;
      const decisions = eleves.map((e) => {
        const row = rows[e.id];
        return {
          eleveId: e.id,
          decision: row?.decision ?? "PASSE",
          mention: row?.mention ?? "AUCUNE",
          avertissement: row?.avertissement ?? "AUCUN",
          commentaire: row?.commentaire || undefined,
        };
      });
      const { data } = await api.put(
        `/api/classes/${classeId}/notes/deliberations/${selectedSessionId}/decisions`,
        { decisions },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliberations", classeId] });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSessionId) return null;
      const { data } = await api.post(
        `/api/classes/${classeId}/notes/deliberations/${selectedSessionId}/validate`,
      );
      return data as { tauxReussiteClasse: number | null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliberations", classeId] });
    },
  });

  function updateRow(eleveId: string, patch: Partial<LocalDecisionRow>) {
    setRows((prev) => ({
      ...prev,
      [eleveId]: {
        ...prev[eleveId],
        ...patch,
      },
    }));
  }

  if (!canView) {
    return (
      <div className="text-center py-16 text-base-content/40 text-sm">
        Accès non autorisé.
      </div>
    );
  }

  const selectedIsValidated = selectedSession?.statut === "VALIDEE";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-primary" />
        <h2 className="font-semibold text-base">
          Sessions de délibération du conseil de classe
        </h2>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <fieldset className="fieldset min-w-56">
          <legend className="fieldset-legend">Classe</legend>
          <select
            className="select select-sm w-full"
            value={classeId}
            onChange={(e) => {
              setClasseId(e.target.value);
              selectSession(null);
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

        <fieldset className="fieldset min-w-48">
          <legend className="fieldset-legend">Période</legend>
          <input
            className="input input-sm w-full"
            value={periodeLabel}
            onChange={(e) => setPeriodeLabel(e.target.value)}
            disabled={!canEdit || !classeId}
          />
        </fieldset>

        <fieldset className="fieldset min-w-40">
          <legend className="fieldset-legend">Année scolaire</legend>
          <input
            className="input input-sm w-full"
            value={anneeScolaire}
            onChange={(e) => setAnneeScolaire(e.target.value)}
            disabled={!canEdit || !classeId}
          />
        </fieldset>

        <button
          className="btn btn-sm btn-primary"
          disabled={!canEdit || !classeId || createSessionMutation.isPending}
          onClick={() => createSessionMutation.mutate()}
        >
          Nouvelle session
        </button>
      </div>

      {classeId && (
        <div className="grid md:grid-cols-[300px_1fr] gap-4">
          <div className="border border-base-300 rounded-box p-3">
            <h3 className="font-semibold text-sm mb-2">Sessions</h3>
            {isLoading && (
              <span className="loading loading-spinner loading-sm" />
            )}
            {isError && (
              <div className="alert alert-error text-xs">
                {getApiError(error, "Erreur de chargement des sessions.")}
              </div>
            )}
            {!isLoading && sessions.length === 0 && (
              <p className="text-xs text-base-content/50">
                Aucune session créée.
              </p>
            )}
            <div className="space-y-2">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  className={`btn btn-sm w-full justify-between ${
                    s.id === selectedSessionId ? "btn-primary" : "btn-ghost"
                  }`}
                  onClick={() => selectSession(s)}
                >
                  <span className="truncate">
                    {s.periodeLabel} · {s.anneeScolaire}
                  </span>
                  <span
                    className={`badge badge-xs ${s.statut === "VALIDEE" ? "badge-success" : "badge-ghost"}`}
                  >
                    {s.statut}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-base-300 rounded-box p-3 space-y-3">
            {!selectedSession && (
              <p className="text-sm text-base-content/50">
                Sélectionnez une session de délibération.
              </p>
            )}

            {selectedSession && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-outline">
                    {selectedSession.periodeLabel} ·{" "}
                    {selectedSession.anneeScolaire}
                  </span>
                  <span
                    className={`badge ${selectedIsValidated ? "badge-success" : "badge-warning"}`}
                  >
                    {selectedSession.statut}
                  </span>
                  {selectedIsValidated && (
                    <span className="badge badge-info">
                      Taux de réussite: {selectedSession.tauxReussite ?? 0}%
                    </span>
                  )}
                </div>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Compte-rendu</legend>
                  <textarea
                    className="textarea textarea-bordered min-h-24"
                    value={compteRendu}
                    onChange={(e) => setCompteRendu(e.target.value)}
                    disabled={!canEdit || selectedIsValidated}
                  />
                </fieldset>

                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Élève</th>
                        <th>Décision</th>
                        <th>Mention</th>
                        <th>Avertissement</th>
                        <th>Commentaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eleves.map((e) => {
                        const row = rows[e.id];
                        if (!row) return null;
                        return (
                          <tr key={e.id}>
                            <td className="font-medium">
                              {e.prenom} {e.nom}
                            </td>
                            <td>
                              <select
                                className="select select-xs w-full"
                                value={row.decision}
                                onChange={(ev) =>
                                  updateRow(e.id, {
                                    decision: ev.target
                                      .value as DecisionPassage,
                                  })
                                }
                                disabled={!canEdit || selectedIsValidated}
                              >
                                {DECISIONS.map((d) => (
                                  <option key={d.value} value={d.value}>
                                    {d.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className="select select-xs w-full"
                                value={row.mention}
                                onChange={(ev) =>
                                  updateRow(e.id, {
                                    mention: ev.target
                                      .value as MentionDeliberation,
                                  })
                                }
                                disabled={!canEdit || selectedIsValidated}
                              >
                                {MENTIONS.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                className="select select-xs w-full"
                                value={row.avertissement}
                                onChange={(ev) =>
                                  updateRow(e.id, {
                                    avertissement: ev.target
                                      .value as AvertissementDeliberation,
                                  })
                                }
                                disabled={!canEdit || selectedIsValidated}
                              >
                                {AVERTISSEMENTS.map((a) => (
                                  <option key={a.value} value={a.value}>
                                    {a.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className="input input-xs w-full"
                                value={row.commentaire}
                                onChange={(ev) =>
                                  updateRow(e.id, {
                                    commentaire: ev.target.value,
                                  })
                                }
                                disabled={!canEdit || selectedIsValidated}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => saveCompteRenduMutation.mutate()}
                    disabled={
                      !canEdit ||
                      selectedIsValidated ||
                      saveCompteRenduMutation.isPending
                    }
                  >
                    Enregistrer compte-rendu
                  </button>

                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => saveDecisionsMutation.mutate()}
                    disabled={
                      !canEdit ||
                      selectedIsValidated ||
                      saveDecisionsMutation.isPending
                    }
                  >
                    Enregistrer décisions
                  </button>

                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => validateMutation.mutate()}
                    disabled={
                      !canEdit ||
                      selectedIsValidated ||
                      validateMutation.isPending
                    }
                  >
                    <CheckCircle2 size={14} />
                    Valider la délibération
                  </button>
                </div>

                {!canEdit && (
                  <div className="alert alert-info text-xs">
                    <ShieldAlert size={14} />
                    Vous avez un accès en consultation uniquement.
                  </div>
                )}

                {selectedIsValidated && (
                  <div className="alert alert-success text-sm">
                    Délibération validée. Taux de réussite de la classe:{" "}
                    <strong>{selectedSession.tauxReussite ?? 0}%</strong>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
