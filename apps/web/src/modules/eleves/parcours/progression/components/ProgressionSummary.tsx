import { Award, TrendingDown, TrendingUp, Minus, Scale } from "lucide-react";
import type { ProgressionResponse } from "../hooks/useProgression";

type Resume = ProgressionResponse["resume"];

function formaterMoyenne(moyenne: number | null): string {
  return moyenne === null ? "—" : `${moyenne.toFixed(2)} / 20`;
}

function tendanceLabel(tendance: Resume["tendance"]): string {
  switch (tendance) {
    case "HAUSSE":
      return "En hausse";
    case "BAISSE":
      return "En baisse";
    case "STABLE":
      return "Stable";
    default:
      return "Données insuffisantes";
  }
}

function tendanceStyle(tendance: Resume["tendance"]): string {
  if (tendance === "HAUSSE") return "text-success";
  if (tendance === "BAISSE") return "text-error";
  return "text-base-content";
}

export function ProgressionSummary({ resume }: { resume: Resume }) {
  const IconeTendance =
    resume.tendance === "HAUSSE"
      ? TrendingUp
      : resume.tendance === "BAISSE"
        ? TrendingDown
        : Minus;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded border border-base-200 p-4">
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <Scale size={16} />
          Moyenne générale
        </div>
        <p className="mt-2 text-2xl font-semibold">
          {formaterMoyenne(resume.moyenneGenerale)}
        </p>
      </article>

      <article className="rounded border border-base-200 p-4">
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <Award size={16} />
          Meilleure matière
        </div>
        <p className="mt-2 font-semibold">
          {resume.meilleureMatiere?.nom ?? "—"}
        </p>
        <p className="text-sm text-base-content/60">
          {formaterMoyenne(resume.meilleureMatiere?.moyenne ?? null)}
        </p>
      </article>

      <article className="rounded border border-base-200 p-4">
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <Award size={16} />
          Matière à renforcer
        </div>
        <p className="mt-2 font-semibold">
          {resume.moinsBonneMatiere?.nom ?? "—"}
        </p>
        <p className="text-sm text-base-content/60">
          {formaterMoyenne(resume.moinsBonneMatiere?.moyenne ?? null)}
        </p>
      </article>

      <article className="rounded border border-base-200 p-4">
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <IconeTendance size={16} />
          Tendance
        </div>
        <p className={`mt-2 font-semibold ${tendanceStyle(resume.tendance)}`}>
          {tendanceLabel(resume.tendance)}
        </p>
      </article>
    </div>
  );
}
