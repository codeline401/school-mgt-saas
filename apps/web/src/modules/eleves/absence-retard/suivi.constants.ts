import type { StatutPresence } from "./hooks/useSuiviAbsences";

export const STATUT_CONFIG: Record<
  StatutPresence,
  { label: string; badge: string }
> = {
  PRESENT: { label: "Présent", badge: "badge-success" },
  ABSENT: { label: "Absent", badge: "badge-error" },
  RETARD: { label: "Retard", badge: "badge-warning" },
};
