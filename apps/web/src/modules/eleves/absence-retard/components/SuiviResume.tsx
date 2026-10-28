import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { SuiviResponse } from "../hooks/useSuiviAbsences";

function couleurTaux(taux: number): string {
  if (taux >= 90) return "progress-success";
  if (taux >= 70) return "progress-warning";
  return "progress-error";
}

type Props = { resume: SuiviResponse["resume"] };

// Compteurs de la période et taux de présence.
export function SuiviResume({ resume }: Props) {
  const cartes = [
    {
      label: "Présences",
      valeur: resume.present,
      icon: CheckCircle2,
      style: "border-success/20 bg-success/5 text-success",
    },
    {
      label: "Absences",
      valeur: resume.absent,
      icon: XCircle,
      style: "border-error/20 bg-error/5 text-error",
    },
    {
      label: "Retards",
      valeur: resume.retard,
      icon: Clock,
      style: "border-warning/20 bg-warning/5 text-warning",
    },
  ];

  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cartes.map(({ label, valeur, icon: Icon, style }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-lg border p-3 ${style}`}
            >
              <Icon size={20} />
              <div>
                <p className="text-sm text-base-content/60">{label}</p>
                <p className="font-semibold text-base-content">{valeur}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-base-content/60">
              Taux de présence ({resume.totalAppels} appel
              {resume.totalAppels > 1 ? "s" : ""})
            </span>
            <span className="font-semibold">{resume.tauxPresence} %</span>
          </div>
          <progress
            className={`progress w-full ${couleurTaux(resume.tauxPresence)}`}
            value={resume.tauxPresence}
            max={100}
          />
        </div>
      </div>
    </div>
  );
}
