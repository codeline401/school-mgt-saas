import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import type {
  Appel,
  CreneauHoraire,
  JourSemaine,
  StatutPresence,
} from "@school-mgt/types";
import { ClipboardList, PlayCircle, UserCheck } from "lucide-react";

const JOURS: { key: JourSemaine; label: string; short: string }[] = [
  { key: "LUNDI", label: "Lundi", short: "Lun" },
  { key: "MARDI", label: "Mardi", short: "Mar" },
  { key: "MERCREDI", label: "Mercredi", short: "Mer" },
  { key: "JEUDI", label: "Jeudi", short: "Jeu" },
  { key: "VENDREDI", label: "Vendredi", short: "Ven" },
  { key: "SAMEDI", label: "Samedi", short: "Sam" },
  { key: "DIMANCHE", label: "Dimanche", short: "Dim" },
];

const JS_DAY_TO_JOUR: Record<number, JourSemaine> = {
  1: "LUNDI",
  2: "MARDI",
  3: "MERCREDI",
  4: "JEUDI",
  5: "VENDREDI",
  6: "SAMEDI",
  0: "DIMANCHE",
};

// ── Helpers date (local, sans décalage UTC) ────────────────────────────────

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d); // local, pas UTC
}

function todayISO(): string {
  return formatLocalDate(new Date());
}

function todayJour(): JourSemaine {
  return JS_DAY_TO_JOUR[new Date().getDay()] ?? "LUNDI";
}

/** Date (YYYY-MM-DD) du jour `jour` dans la même semaine ISO que `referenceDate` */
function getDateForJourInWeek(
  referenceDate: string,
  jour: JourSemaine,
): string {
  const JOUR_TO_ISO_DAY: Record<JourSemaine, number> = {
    LUNDI: 1,
    MARDI: 2,
    MERCREDI: 3,
    JEUDI: 4,
    VENDREDI: 5,
    SAMEDI: 6,
    DIMANCHE: 0,
  };
  const ref = parseLocalDate(referenceDate);
  const refDay = ref.getDay(); // 0=dim, 1=lun …
  // Convertit en base lundi=0
  const refMon = refDay === 0 ? 6 : refDay - 1;
  const tgtMon = JOUR_TO_ISO_DAY[jour] === 0 ? 6 : JOUR_TO_ISO_DAY[jour] - 1;
  const result = new Date(ref);
  result.setDate(ref.getDate() + (tgtMon - refMon));
  return formatLocalDate(result);
}

/** Retourne true si le créneau a déjà commencé (date + heureDebut ≤ maintenant) */
function creneauStarted(date: string, heureDebut: string): boolean {
  const [h, m] = heureDebut.split(":").map(Number);
  const start = parseLocalDate(date); // ← plus de décalage UTC
  start.setHours(h, m, 0, 0);
  return new Date() >= start;
}

const STATUT_CONFIG: Record<
  StatutPresence,
  { label: string; className: string }
> = {
  PRESENT: { label: "P", className: "btn-success" },
  ABSENT: { label: "A", className: "btn-error" },
  RETARD: { label: "R", className: "btn-warning" },
};

interface Props {
  classeId: string;
  canManage: boolean;
}

export default function AbsenceTab({ classeId, canManage }: Props) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [selectedJour, setSelectedJour] = useState<JourSemaine>(todayJour);
  const [openAppelId, setOpenAppelId] = useState<string | null>(null);

  // ── Matières du prof connecté (uniquement si rôle PROF) ───────────────
  const { data: profMatiereIds } = useQuery<string[]>({
    queryKey: ["my-prof-matieres"],
    queryFn: async () => {
      const { data } = await api.get("/api/profils/me");
      return (data.matieres as { id: string }[]).map((m) => m.id);
    },
    enabled: user?.role === "PROF",
    staleTime: 5 * 60 * 1000, // 5 min — les matières changent rarement
  });

  /** Un PROF ne peut gérer que les créneaux dont la matière lui appartient */
  function canManageCreneau(creneau: CreneauHoraire): boolean {
    if (!canManage) return false;
    if (user?.role !== "PROF") return true; // ADMIN / SUDO_ADMIN : accès total
    if (!profMatiereIds || !creneau.matiereId) return false;
    return profMatiereIds.includes(creneau.matiereId);
  }

  // ── Creneaux de la classe (emploi du temps) ────────────────────────────
  const { data: creneaux = [] } = useQuery<CreneauHoraire[]>({
    queryKey: ["classe-emploi-du-temps", classeId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/emploi-du-temps`,
      );
      return data;
    },
    enabled: !!classeId,
  });

  // ── Appels pour la date sélectionnée ───────────────────────────────────
  const { data: appels = [], isLoading: loadingAppels } = useQuery<Appel[]>({
    queryKey: ["classe-appels", classeId, selectedDate],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/classes/${classeId}/appels?date=${selectedDate}`,
      );
      return data;
    },
    enabled: !!classeId,
  });

  // ── Creneaux du jour sélectionné ────────────────────────────────────────
  const creneauxDuJour = useMemo(
    () => creneaux.filter((c) => c.jour === selectedJour),
    [creneaux, selectedJour],
  );

  // Map creneauId → appel pour accès O(1)
  const appelByCreneau = useMemo(() => {
    const m = new Map<string, Appel>();
    for (const a of appels) m.set(a.creneauId, a);
    return m;
  }, [appels]);

  // ── Mutation : démarrer un appel ───────────────────────────────────────
  const startAppel = useMutation({
    mutationFn: async (creneauId: string) => {
      const { data } = await api.post(`/api/classes/${classeId}/appels`, {
        creneauId,
        date: selectedDate,
      });
      return data as Appel;
    },
    onSuccess: (appel) => {
      queryClient.invalidateQueries({
        queryKey: ["classe-appels", classeId, selectedDate],
      });
      setOpenAppelId(appel.id);
      toast.success("Appel démarré.");
    },
    onError: (err) =>
      toast.error(getApiError(err, "Impossible de démarrer l'appel.")),
  });

  // ── Mutation : mettre à jour une présence ─────────────────────────────
  const updatePresence = useMutation({
    mutationFn: async ({
      appelId,
      eleveId,
      statut,
    }: {
      appelId: string;
      eleveId: string;
      statut: StatutPresence;
    }) => {
      const { data } = await api.patch(
        `/api/classes/${classeId}/appels/${appelId}/presences/${eleveId}`,
        { statut },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classe-appels", classeId, selectedDate],
      });
    },
    onError: (err) =>
      toast.error(getApiError(err, "Impossible de mettre à jour la présence.")),
  });

  // Quand on change la date, on recalcule le jour et on ferme l'appel ouvert
  function handleDateChange(date: string) {
    setSelectedDate(date);
    const d = parseLocalDate(date); // ← local, pas UTC
    setSelectedJour(JS_DAY_TO_JOUR[d.getDay()] ?? "LUNDI");
    setOpenAppelId(null);
  }

  // Quand on clique sur un onglet jour, on recalcule la date dans la même semaine
  function handleJourChange(jour: JourSemaine) {
    const newDate = getDateForJourInWeek(selectedDate, jour);
    setSelectedDate(newDate);
    setSelectedJour(jour);
    setOpenAppelId(null);
  }

  // Résumé des présences pour un appel
  function presenceSummary(appel: Appel) {
    const presences = appel.presences ?? [];
    const presents = presences.filter((p) => p.statut === "PRESENT").length;
    const retards = presences.filter((p) => p.statut === "RETARD").length;
    const total = presences.length;
    return `${presents + retards}/${total} présents`;
  }

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList size={20} />
          Appels / Absences
        </h2>
        <input
          type="date"
          className="input input-bordered input-sm"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      {/* ── Sélecteur de jour (tabs) ── */}
      <div className="tabs tabs-bordered">
        {JOURS.map((j) => (
          <button
            key={j.key}
            className={`tab${selectedJour === j.key ? " tab-active font-semibold" : ""}`}
            onClick={() => handleJourChange(j.key)}
          >
            {j.short}
          </button>
        ))}
      </div>

      {/* ── Liste des creneaux du jour ── */}
      {loadingAppels ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : creneauxDuJour.length === 0 ? (
        <div className="text-center text-base-content/50 py-12">
          Aucun cours ce jour dans l'emploi du temps.
        </div>
      ) : (
        <div className="space-y-3">
          {creneauxDuJour.map((creneau) => {
            const appel = appelByCreneau.get(creneau.id);
            const isOpen = openAppelId === appel?.id;

            return (
              <div
                key={creneau.id}
                className="card card-bordered bg-base-100 shadow-sm"
                style={
                  creneau.couleur
                    ? { borderLeftColor: creneau.couleur, borderLeftWidth: 4 }
                    : undefined
                }
              >
                <div className="card-body p-4">
                  {/* ── Créneau header ── */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-sm">
                        {creneau.heureDebut} – {creneau.heureFin}
                      </span>
                      <span className="ml-2 text-base-content/70 text-sm">
                        {creneau.matiere?.nom ?? creneau.intitule ?? "Cours"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {appel ? (
                        <>
                          <span className="badge badge-success badge-sm gap-1">
                            <UserCheck size={11} />
                            {presenceSummary(appel)}
                          </span>
                          <button
                            className={`btn btn-sm btn-outline${isOpen ? " btn-active" : ""}`}
                            onClick={() =>
                              setOpenAppelId(isOpen ? null : appel.id)
                            }
                          >
                            {isOpen ? "Fermer" : "Voir / Modifier"}
                          </button>
                        </>
                      ) : canManageCreneau(creneau) ? (
                        <button
                          className="btn btn-sm btn-primary gap-1"
                          disabled={
                            startAppel.isPending ||
                            !creneauStarted(selectedDate, creneau.heureDebut)
                          }
                          title={
                            !creneauStarted(selectedDate, creneau.heureDebut)
                              ? `L'appel ne peut démarrer qu'à partir de ${creneau.heureDebut}`
                              : undefined
                          }
                          onClick={() => startAppel.mutate(creneau.id)}
                        >
                          <PlayCircle size={14} />
                          Démarrer l'appel
                        </button>
                      ) : (
                        <span className="badge badge-ghost badge-sm">
                          Appel non fait
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Liste des élèves (visible si appel ouvert) ── */}
                  {isOpen && appel?.presences && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Élève</th>
                            <th className="text-center">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appel.presences.map((presence) => (
                            <tr key={presence.id} className="hover">
                              <td className="font-medium">
                                {presence.eleve?.nom}{" "}
                                <span className="text-base-content/60">
                                  {presence.eleve?.prenom}
                                </span>
                              </td>
                              <td>
                                <div className="flex justify-center gap-1">
                                  {(
                                    [
                                      "PRESENT",
                                      "ABSENT",
                                      "RETARD",
                                    ] as StatutPresence[]
                                  ).map((s) => (
                                    <button
                                      key={s}
                                      aria-label={s}
                                      disabled={
                                        updatePresence.isPending || !canManageCreneau(creneau)
                                      }
                                      className={`btn btn-xs ${
                                        presence.statut === s
                                          ? STATUT_CONFIG[s].className
                                          : "btn-ghost opacity-40"
                                      }`}
                                      onClick={() =>
                                        updatePresence.mutate({
                                          appelId: appel.id,
                                          eleveId: presence.eleveId,
                                          statut: s,
                                        })
                                      }
                                    >
                                      {STATUT_CONFIG[s].label}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
