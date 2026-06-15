import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, AlertTriangle } from "lucide-react";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type {
  Classe,
  CreateExamenPlanningInput,
  ExamenSalle,
  ExamenSession,
  Matiere,
} from "@school-mgt/types";

type SurveillantOption = {
  id: string;
  nom: string;
  prenom: string;
  role: string;
};

type PlanningDay = {
  dateExamen: string;
  matiereId: string;
  salleId: string;
  heureDebut: string;
  heureFin: string;
  surveillantUserIds: string[];
};

const STATUTS: ExamenSession["statut"][] = [
  "PLANIFIE",
  "EN_COURS",
  "TERMINE",
  "REPORTE",
  "ANNULE",
];

function toIsoDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildDateRange(dateDebut: string, dateFin: string): string[] {
  if (!dateDebut || !dateFin) return [];
  const start = new Date(`${dateDebut}T00:00:00`);
  const end = new Date(`${dateFin}T00:00:00`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return [];
  }

  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export default function GestionExamensTab() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const canView =
    user?.role === "SUDO_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "PROF" ||
    user?.role === "USER";

  const canEdit =
    user?.role === "SUDO_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "PROF";

  const [classeId, setClasseId] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [planningDays, setPlanningDays] = useState<PlanningDay[]>([]);

  const [newSalleNom, setNewSalleNom] = useState("");
  const [newIncidentType, setNewIncidentType] = useState("INFO");
  const [newIncidentMessage, setNewIncidentMessage] = useState("");

  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => (await api.get("/api/classes")).data,
    enabled: canView,
  });

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
  } = useQuery<ExamenSession[]>({
    queryKey: ["examens", classeId],
    queryFn: async () =>
      (await api.get(`/api/classes/${classeId}/notes/examens`)).data,
    enabled: canView && !!classeId,
  });

  const { data: salles = [] } = useQuery<ExamenSalle[]>({
    queryKey: ["examens-salles", classeId],
    queryFn: async () =>
      (await api.get(`/api/classes/${classeId}/notes/examens/salles`)).data,
    enabled: canView && !!classeId,
  });

  const { data: matieres = [] } = useQuery<Matiere[]>({
    queryKey: ["matieres", classeId],
    queryFn: async () =>
      (await api.get(`/api/classes/${classeId}/matieres`)).data,
    enabled: canView && !!classeId,
  });

  const { data: surveillants = [] } = useQuery<SurveillantOption[]>({
    queryKey: ["examens-surveillants", classeId],
    queryFn: async () =>
      (await api.get(`/api/classes/${classeId}/notes/examens/surveillants`))
        .data,
    enabled: canView && !!classeId,
  });

  const groups = useMemo(() => {
    const grouped = new Map<string, ExamenSession[]>();
    for (const s of sessions) {
      const existing = grouped.get(s.titre) ?? [];
      existing.push(s);
      grouped.set(s.titre, existing);
    }

    return Array.from(grouped.entries())
      .map(([title, items]) => ({
        title,
        items: [...items].sort((a, b) => {
          if (a.dateExamen !== b.dateExamen) {
            return a.dateExamen.localeCompare(b.dateExamen);
          }
          return a.heureDebut.localeCompare(b.heureDebut);
        }),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [sessions]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.title === selectedTitle) ?? null,
    [groups, selectedTitle],
  );

  const selectedSession = useMemo(
    () => selectedGroup?.items.find((s) => s.id === selectedSessionId) ?? null,
    [selectedGroup, selectedSessionId],
  );

  const createPlanning = useMutation({
    mutationFn: async (payload: CreateExamenPlanningInput) =>
      (
        await api.post(
          `/api/classes/${classeId}/notes/examens/planning`,
          payload,
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examens", classeId] });
      setTitre("");
      setDescription("");
      setDateDebut("");
      setDateFin("");
      setPlanningDays([]);
    },
  });

  const createSalle = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/api/classes/${classeId}/notes/examens/salles`, {
          nom: newSalleNom,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examens-salles", classeId] });
      setNewSalleNom("");
    },
  });

  const updateStatut = useMutation({
    mutationFn: async (args: {
      sessionId: string;
      statut: ExamenSession["statut"];
    }) =>
      (
        await api.put(
          `/api/classes/${classeId}/notes/examens/${args.sessionId}/statut`,
          { statut: args.statut },
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["examens", classeId] }),
  });

  const createIncident = useMutation({
    mutationFn: async () => {
      if (!selectedSessionId) return null;
      return (
        await api.post(
          `/api/classes/${classeId}/notes/examens/${selectedSessionId}/incidents`,
          { type: newIncidentType, message: newIncidentMessage },
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examens", classeId] });
      setNewIncidentMessage("");
    },
  });

  const canSubmitPlanning =
    titre.trim().length > 0 &&
    !!dateDebut &&
    !!dateFin &&
    planningDays.length > 0 &&
    planningDays.every(
      (d) =>
        !!d.matiereId &&
        !!d.salleId &&
        !!d.heureDebut &&
        !!d.heureFin &&
        d.surveillantUserIds.length > 0,
    );

  const regenerateDays = () => {
    const days = buildDateRange(dateDebut, dateFin);
    setPlanningDays((prev) => {
      const prevByDate = new Map(prev.map((d) => [d.dateExamen, d]));
      return days.map((dateExamen) => {
        const existing = prevByDate.get(dateExamen);
        return (
          existing ?? {
            dateExamen,
            matiereId: "",
            salleId: "",
            heureDebut: "08:00",
            heureFin: "10:00",
            surveillantUserIds: [],
          }
        );
      });
    });
  };

  if (!canView) {
    return (
      <div className="text-center py-16 text-sm text-base-content/40">
        Accès non autorisé.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarClock size={18} className="text-primary" />
        <h2 className="font-semibold">Gestion des examens</h2>
      </div>

      <fieldset className="fieldset max-w-xs">
        <legend className="fieldset-legend">Classe</legend>
        <select
          className="select select-sm w-full"
          value={classeId}
          onChange={(e) => {
            setClasseId(e.target.value);
            setSelectedTitle(null);
            setSelectedSessionId(null);
          }}
        >
          <option value="">- Choisir -</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </fieldset>

      {classeId && canEdit && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card border border-base-300">
            <div className="card-body gap-3">
              <h3 className="font-semibold">
                Planification par plage de dates
              </h3>
              <input
                className="input input-sm"
                placeholder="Titre de la session"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
              />
              <input
                className="input input-sm"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="input input-sm"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
                <input
                  type="date"
                  className="input input-sm"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>

              <button className="btn btn-sm" onClick={regenerateDays}>
                Générer les jours de la plage
              </button>

              {planningDays.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-auto pr-1">
                  {planningDays.map((day, idx) => (
                    <div
                      key={day.dateExamen}
                      className="rounded-box border border-base-300 p-2 space-y-2"
                    >
                      <div className="text-sm font-medium">
                        {day.dateExamen}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          className="input input-xs"
                          value={day.heureDebut}
                          onChange={(e) =>
                            setPlanningDays((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? { ...p, heureDebut: e.target.value }
                                  : p,
                              ),
                            )
                          }
                        />
                        <input
                          type="time"
                          className="input input-xs"
                          value={day.heureFin}
                          onChange={(e) =>
                            setPlanningDays((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? { ...p, heureFin: e.target.value }
                                  : p,
                              ),
                            )
                          }
                        />
                      </div>

                      <select
                        className="select select-xs w-full"
                        value={day.matiereId}
                        onChange={(e) =>
                          setPlanningDays((prev) =>
                            prev.map((p, i) =>
                              i === idx
                                ? { ...p, matiereId: e.target.value }
                                : p,
                            ),
                          )
                        }
                      >
                        <option value="">Matière</option>
                        {matieres.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nom}
                          </option>
                        ))}
                      </select>

                      <select
                        className="select select-xs w-full"
                        value={day.salleId}
                        onChange={(e) =>
                          setPlanningDays((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, salleId: e.target.value } : p,
                            ),
                          )
                        }
                      >
                        <option value="">Salle</option>
                        {salles.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nom}
                          </option>
                        ))}
                      </select>

                      <select
                        multiple
                        className="select select-xs w-full h-24"
                        value={day.surveillantUserIds}
                        onChange={(e) => {
                          const values = Array.from(
                            e.currentTarget.selectedOptions,
                          ).map((o) => o.value);
                          setPlanningDays((prev) =>
                            prev.map((p, i) =>
                              i === idx
                                ? { ...p, surveillantUserIds: values }
                                : p,
                            ),
                          );
                        }}
                      >
                        {surveillants.map((sv) => (
                          <option key={sv.id} value={sv.id}>
                            {sv.prenom} {sv.nom} ({sv.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-sm btn-primary"
                disabled={!canSubmitPlanning || createPlanning.isPending}
                onClick={() =>
                  createPlanning.mutate({
                    titre,
                    description: description || undefined,
                    dateDebut,
                    dateFin,
                    epreuves: planningDays,
                  })
                }
              >
                Créer la session détaillée
              </button>
            </div>
          </div>

          <div className="card border border-base-300">
            <div className="card-body">
              <h3 className="font-semibold">Gérer les salles</h3>
              <div className="flex gap-2">
                <input
                  className="input input-sm flex-1"
                  placeholder="Nom de la salle"
                  value={newSalleNom}
                  onChange={(e) => setNewSalleNom(e.target.value)}
                />
                <button
                  className="btn btn-sm"
                  disabled={!newSalleNom || createSalle.isPending}
                  onClick={() => createSalle.mutate()}
                >
                  Ajouter
                </button>
              </div>
              <div className="text-sm text-base-content/60">
                {salles.length} salle(s) disponible(s)
              </div>
            </div>
          </div>
        </div>
      )}

      {isError && (
        <div className="alert alert-error text-sm">
          {getApiError(error, "Erreur lors du chargement des examens.")}
        </div>
      )}

      {isLoading && (
        <span className="loading loading-spinner loading-md text-primary" />
      )}

      {!isLoading && !isError && classeId && (
        <div className="grid md:grid-cols-[320px_1fr] gap-4">
          <div className="card border border-base-300">
            <div className="card-body">
              <h3 className="font-semibold">Sessions planifiées</h3>
              <div className="space-y-2">
                {groups.map((g) => (
                  <button
                    key={g.title}
                    className={`btn btn-sm w-full justify-between ${
                      selectedTitle === g.title ? "btn-primary" : "btn-ghost"
                    }`}
                    onClick={() => {
                      setSelectedTitle(g.title);
                      setSelectedSessionId(g.items[0]?.id ?? null);
                    }}
                  >
                    <span className="truncate">{g.title}</span>
                    <span className="badge badge-xs">
                      {g.items.length} jour(s)
                    </span>
                  </button>
                ))}
                {groups.length === 0 && (
                  <p className="text-sm text-base-content/50">
                    Aucune session.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card border border-base-300">
            <div className="card-body">
              {!selectedGroup ? (
                <p className="text-sm text-base-content/50">
                  Clique sur une session pour afficher l'emploi du temps
                  détaillé.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{selectedGroup.title}</h3>
                    <p className="text-sm text-base-content/70">
                      Du {selectedGroup.items[0]?.dateExamen} au{" "}
                      {selectedGroup.items.at(-1)?.dateExamen}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Horaire</th>
                          <th>Matière</th>
                          <th>Salle</th>
                          <th>Surveillants</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGroup.items.map((item) => (
                          <tr
                            key={item.id}
                            className={
                              selectedSessionId === item.id ? "bg-base-200" : ""
                            }
                            onClick={() => setSelectedSessionId(item.id)}
                          >
                            <td>{item.dateExamen}</td>
                            <td>
                              {item.heureDebut} - {item.heureFin}
                            </td>
                            <td>{item.matiere?.nom ?? "Non assignée"}</td>
                            <td>{item.salle?.nom ?? "Non assignée"}</td>
                            <td>
                              {(item.surveillants ?? []).length > 0
                                ? (item.surveillants ?? [])
                                    .map((sv) =>
                                      sv.user
                                        ? `${sv.user.prenom} ${sv.user.nom}`
                                        : "(Surveillant inconnu)",
                                    )
                                    .join(", ")
                                : "Aucun"}
                            </td>
                            <td>
                              {canEdit ? (
                                <select
                                  className="select select-xs"
                                  value={item.statut}
                                  onChange={(e) =>
                                    updateStatut.mutate({
                                      sessionId: item.id,
                                      statut: e.target
                                        .value as ExamenSession["statut"],
                                    })
                                  }
                                >
                                  {STATUTS.map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="badge badge-outline">
                                  {item.statut}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedSession && (
                    <div>
                      <h4 className="font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Incidents / suivi du jour sélectionné
                      </h4>

                      {canEdit && (
                        <div className="flex gap-2 mb-2">
                          <input
                            className="input input-sm max-w-32"
                            value={newIncidentType}
                            onChange={(e) => setNewIncidentType(e.target.value)}
                            placeholder="Type"
                          />
                          <input
                            className="input input-sm flex-1"
                            value={newIncidentMessage}
                            onChange={(e) =>
                              setNewIncidentMessage(e.target.value)
                            }
                            placeholder="Message de suivi"
                          />
                          <button
                            className="btn btn-sm"
                            disabled={
                              !newIncidentMessage || createIncident.isPending
                            }
                            onClick={() => createIncident.mutate()}
                          >
                            Ajouter
                          </button>
                        </div>
                      )}

                      <div className="space-y-2">
                        {selectedSession.incidents?.map((inc) => (
                          <div
                            key={inc.id}
                            className="text-sm border border-base-300 rounded-box p-2"
                          >
                            <div className="font-medium">{inc.type}</div>
                            <div>{inc.message}</div>
                            <div className="text-xs text-base-content/50">
                              {new Date(inc.createdAt).toLocaleString("fr-FR")}
                            </div>
                          </div>
                        ))}
                        {(!selectedSession.incidents ||
                          selectedSession.incidents.length === 0) && (
                          <p className="text-sm text-base-content/50">
                            Aucun incident enregistré.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
