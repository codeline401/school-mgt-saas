import type { TypeNote } from "./hooks/useNotesParcours";

export const LIBELLES_TYPE_NOTE: Record<TypeNote, string> = {
  INTERROGATION: "Interrogation",
  DS: "Devoir surveillé",
  EXAMEN: "Examen",
  AUTRE: "Autre",
};

export const BADGES_TYPE_NOTE: Record<TypeNote, string> = {
  INTERROGATION: "badge-info",
  DS: "badge-warning",
  EXAMEN: "badge-error",
  AUTRE: "badge-ghost",
};

export const formaterDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR");

/** Couleur selon la note ramenée sur 20 */
export function couleurNote(valeurSur20: number | null): string {
  if (valeurSur20 === null) return "text-base-content/40"; //
  if (valeurSur20 >= 14) return "text-success font-semibold";
  if (valeurSur20 >= 10) return "text-base-content font-semibold";
  return "text-error font-semibold";
}
