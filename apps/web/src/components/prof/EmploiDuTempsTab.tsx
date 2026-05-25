import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CreneauHoraireProf, JourSemaine } from "@school-mgt/types";

interface Props {
  profId: string;
}

const JOURS: JourSemaine[] = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
];

const JOURS_LABELS: Record<JourSemaine, string> = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

const SLOT_HEIGHT = 56; // px par heure
const DAY_START = 7; // 07h00
const DAY_END = 19; // 19h00

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToPx(minutes: number): number {
  return ((minutes - DAY_START * 60) / 60) * SLOT_HEIGHT;
}

export default function EmploiDuTempsTab({ profId }: Props) {
  const { data: creneaux = [], isLoading } = useQuery<CreneauHoraireProf[]>({
    queryKey: ["prof-emploi-du-temps", profId],
    queryFn: async () => {
      const { data } = await api.get(`/api/profils/profs/${profId}/emploi-du-temps`);
      return data;
    },
    enabled: !!profId,
  });

  // Détermine si le prof enseigne plus d'une matière (pour afficher la matière dans le label)
  const matiereIds = new Set(creneaux.map((c) => c.matiereId).filter(Boolean));
  const multiMatiere = matiereIds.size > 1;

  // Filtrer les jours qui ont au moins un créneau
  const joursActifs = JOURS.filter((j) => creneaux.some((c) => c.jour === j));

  // Index par jour
  const byJour = creneaux.reduce<Record<string, CreneauHoraireProf[]>>(
    (acc, c) => {
      acc[c.jour] = [...(acc[c.jour] ?? []), c];
      return acc;
    },
    {},
  );

  const totalHeight = (DAY_END - DAY_START) * SLOT_HEIGHT;

  const heures = Array.from(
    { length: DAY_END - DAY_START + 1 },
    (_, i) => DAY_START + i,
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (creneaux.length === 0) {
    return (
      <div className="text-center text-base-content/50 py-12">
        Aucun créneau horaire assigné à ce professeur.
        <p className="text-sm mt-1">
          Les créneaux apparaissent ici une fois qu'une matière enseignée par ce
          professeur est liée à un créneau dans l'emploi du temps.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-150"
        style={{
          gridTemplateColumns: `48px repeat(${joursActifs.length}, 1fr)`,
        }}
      >
        {/* En-tête des jours */}
        <div /> {/* cellule vide coin haut-gauche */}
        {joursActifs.map((jour) => (
          <div
            key={jour}
            className="text-center text-sm font-semibold py-2 border-b border-base-200"
          >
            {JOURS_LABELS[jour]}
          </div>
        ))}

        {/* Colonne des heures + colonnes des jours */}
        <div className="relative" style={{ height: totalHeight }}>
          {heures.map((h) => (
            <div
              key={h}
              className="absolute w-full text-right pr-2 text-xs text-base-content/40 select-none"
              style={{ top: (h - DAY_START) * SLOT_HEIGHT - 8 }}
            >
              {String(h).padStart(2, "0")}h
            </div>
          ))}
        </div>

        {joursActifs.map((jour) => (
          <div
            key={jour}
            className="relative border-l border-base-200"
            style={{ height: totalHeight }}
          >
            {/* Lignes horizontales horaires */}
            {heures.map((h) => (
              <div
                key={h}
                className="absolute w-full border-t border-base-200/60"
                style={{ top: (h - DAY_START) * SLOT_HEIGHT }}
              />
            ))}

            {/* Créneaux */}
            {(byJour[jour] ?? []).map((c) => {
              const top = minutesToPx(timeToMinutes(c.heureDebut));
              const height = Math.max(
                minutesToPx(timeToMinutes(c.heureFin)) - top,
                28,
              );
              const label = multiMatiere && c.matiere
                ? `${c.classe.nom} — ${c.matiere.nom}`
                : c.classe.nom;
              const bgColor = c.couleur ?? null;

              return (
                <div
                  key={c.id}
                  className="absolute left-1 right-1 rounded px-1.5 py-0.5 overflow-hidden text-xs font-medium shadow-sm"
                  style={{
                    top,
                    height,
                    backgroundColor: bgColor ?? undefined,
                    ...(bgColor
                      ? { color: "#fff" }
                      : {}),
                  }}
                  title={`${c.heureDebut}–${c.heureFin}${c.intitule ? ` · ${c.intitule}` : ""}`}
                  // classe DaisyUI de fallback si pas de couleur custom
                  data-no-color={bgColor ? undefined : "true"}
                >
                  <style>{`
                    [data-no-color="true"] {
                      background-color: oklch(var(--p) / 0.15);
                      color: oklch(var(--p));
                    }
                  `}</style>
                  <div className="truncate leading-tight">{label}</div>
                  <div className="opacity-75 leading-tight">
                    {c.heureDebut}–{c.heureFin}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
