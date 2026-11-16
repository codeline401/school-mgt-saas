import { LineChart as LineChartIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProgressionPoint } from "../hooks/useProgression";

type Props = {
  points: ProgressionPoint[];
};

function libellePoint(point: ProgressionPoint): string {
  if (point.date) {
    const dateFormatee = new Date(`${point.date}T00:00:00`).toLocaleDateString(
      "fr-FR",
    );
    // Si on a une période et une date, on affiche les deux pour plus de clarté
    return point.periode
      ? `${dateFormatee} (${point.periode.nom})`
      : dateFormatee;
  }
  if (point.periode) {
    return `${point.periode.nom} (${point.periode.anneeScolaire})`;
  }
  return "Sans période";
}

export function ProgressionChart({ points }: Props) {
  const data = points.map((point, index) => ({
    id: `${point.periode?.id ?? point.date ?? "point"}-${index}`,
    libelle: libellePoint(point),
    moyenne: point.moyenne,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded border border-dashed border-base-300 p-8 text-center">
        <LineChartIcon className="mx-auto text-base-content/40" size={24} />
        <p className="mt-2 font-medium">Aucune progression à afficher</p>
        <p className="text-sm text-base-content/60">
          Aucune note ne correspond aux filtres sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Évolution des moyennes</h3>
      <div className="h-72 w-full rounded border border-base-200 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="libelle" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) =>
                typeof value === "number"
                  ? [`${value.toFixed(2)} / 20`, "Moyenne"]
                  : [value, "Moyenne"]
              }
            />
            <Line
              type="monotone"
              dataKey="moyenne"
              name="Moyenne"
              stroke="var(--color-primary)"
              strokeWidth={2}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
