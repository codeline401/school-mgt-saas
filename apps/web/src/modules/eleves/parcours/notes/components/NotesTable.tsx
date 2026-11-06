import type { NoteParcours } from "../hooks/useNotesParcours";
import {
  BADGES_TYPE_NOTE,
  LIBELLES_TYPE_NOTE,
  couleurNote,
  formaterDate,
} from "../note.constants.js";

type Props = { notes: NoteParcours[] };

export function NotesTable({ notes }: Props) {
  return (
    <div className="overflow-x-auto rounded border border-base-200">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Élève</th>
            <th>Matière</th>
            <th>Évaluation</th>
            <th>Note</th>
            <th>Coef.</th>
            <th>Période</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <tr key={note.id}>
              <td>{formaterDate(note.dateEval)}</td>
              <td>
                <div className="font-medium">
                  {note.eleve.prenom} {note.eleve.nom}
                </div>
                <div className="text-xs text-base-content/60">
                  {note.classe.nom}
                </div>
              </td>
              <td>{note.matiere.nom}</td>
              <td>
                <div>{note.titre}</div>
                <span
                  className={`badge badge-sm ${BADGES_TYPE_NOTE[note.typeNote]}`}
                >
                  {LIBELLES_TYPE_NOTE[note.typeNote]}
                </span>
                {note.commentaire && (
                  <p className="mt-1 text-xs text-base-content/60">
                    {note.commentaire}
                  </p>
                )}
              </td>
              <td className={couleurNote((note.note / note.noteMax) * 20)}>
                {note.note} / {note.noteMax}
              </td>
              <td>{note.coefficient}</td>
              <td>{note.periode?.nom ?? "—"}</td>
            </tr>
          ))}
          {notes.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center">
                Aucune note pour ces filtres.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
