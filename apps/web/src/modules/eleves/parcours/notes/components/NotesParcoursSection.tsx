import { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { useAuthStore } from "../../../../../store/authStore";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import { useNotesParcours, type TypeNote } from "../hooks/useNotesParcours";
import {
  useMatieresOptions,
  usePeriodesOptions,
} from "../hooks/useOptionsFiltresNotes";
import { LIBELLES_TYPE_NOTE, couleurNote } from "../note.constants.js";
import { NotesTable } from "./NotesTable";
import { useFicheEleve } from "../../../informations/fiche/hooks/useFicheEleve.js";

type Props = { initialEleveId?: string };

type FiltresUI = {
  classeId: string;
  matiereId: string;
  periodeId: string;
  typeNote: TypeNote | "";
  from: string;
  to: string;
};

const FILTRES_VIDES: FiltresUI = {
  classeId: "",
  matiereId: "",
  periodeId: "",
  typeNote: "",
  from: "",
  to: "",
};

const LIMITE = 10;

export function NotesParcoursSection({ initialEleveId }: Props) {
  const user = useAuthStore((state) => state.user);
  const admin = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [eleveId, setEleveId] = useState(initialEleveId);
  const [filtres, setFiltres] = useState<FiltresUI>(FILTRES_VIDES);
  const [page, setPage] = useState(1);

  const ficheEleves = useFicheEleve(eleveId, { enabled: !!eleveId });
  const classeId = ficheEleves.data?.classeId ?? "";
  const matieres = useMatieresOptions(classeId);
  const periodes = usePeriodesOptions(classeId);

  const notes = useNotesParcours({
    eleveId,
    classeId: classeId || undefined,
    matiereId: filtres.matiereId || undefined,
    periodeId: filtres.periodeId || undefined,
    typeNote: filtres.typeNote || undefined,
    from: filtres.from || undefined,
    to: filtres.to || undefined,
    page,
    limit: LIMITE,
  });

  function changer<K extends keyof FiltresUI>(champ: K, valeur: FiltresUI[K]) {
    setFiltres((courant) => ({
      ...courant,
      [champ]: valeur,
      // matières et périodes dépendent de la classe
      ...(champ === "classeId" ? { matiereId: "", periodeId: "" } : {}),
    }));
    setPage(1);
  }

  function selectionnerEleve(student: FicheEleveComplete) {
    setEleveId(student.id);
    setPage(1);
  }

  if (!admin) {
    return (
      <p role="alert" className="alert alert-warning">
        Cette section est réservée aux administrateurs.
      </p>
    );
  }

  const dateInvalide =
    !!filtres.from && !!filtres.to && filtres.from > filtres.to;
  const moyenne = notes.data?.resume.moyenne ?? null;

  return (
    <section className="space-y-5">
      <header className="flex items-center gap-3">
        <BookOpen className="text-primary" size={22} />
        <div>
          <h2 className="text-lg font-bold">Notes</h2>
          <p className="text-sm text-base-content/60">
            Consultation des notes par élève, classe, matière ou période.
          </p>
        </div>
      </header>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={selectionnerEleve}
      />
      {!eleveId && (
        <div className="rounded border border-dashed border-base-300 p-8 text-center">
          <p className="font-medium">Aucun élève sélectionné</p>
          <p className="mt-1 text-sm text-base-content/60">
            Recherchez un élève pour consulter ses notes.
          </p>
        </div>
      )}

      {eleveId && ficheEleves.isLoading && (
        <span className="loading loading-spinner" />
      )}

      {eleveId && ficheEleves.isError && (
        <p role="alert" className="text-error">
          Impossible de charger la fiche de l’élève.
        </p>
      )}

      {eleveId && ficheEleves.data && !classeId && (
        <p className="alert alert-info">
          Cet élève n’a pas de classe actuelle.
        </p>
      )}

      {eleveId && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="fieldset">
              <span className="label">Classe actuelle</span>
              <input
                className="input input-bordered"
                readOnly
                value={ficheEleves.data?.classe?.nom ?? ""}
                placeholder="Aucune classe actuelle"
              />
            </label>

            <label className="fieldset">
              <span className="label">Matière</span>
              <select
                className="select select-bordered"
                value={filtres.matiereId}
                disabled={!classeId}
                onChange={(event) => changer("matiereId", event.target.value)}
              >
                <option value="">Toutes les matières</option>
                {matieres.data?.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom}
                  </option>
                ))}
              </select>
            </label>

            <label className="fieldset">
              <span className="label">Période</span>
              <select
                className="select select-bordered"
                value={filtres.periodeId}
                disabled={!classeId}
                onChange={(event) => changer("periodeId", event.target.value)}
              >
                <option value="">Toutes les périodes</option>
                {periodes.data?.map((periode) => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom}
                  </option>
                ))}
              </select>
            </label>

            <label className="fieldset">
              <span className="label">Type d'évaluation</span>
              <select
                className="select select-bordered"
                value={filtres.typeNote}
                onChange={(event) =>
                  changer("typeNote", event.target.value as TypeNote | "")
                }
              >
                <option value="">Tous les types</option>
                {Object.entries(LIBELLES_TYPE_NOTE).map(([valeur, libelle]) => (
                  <option key={valeur} value={valeur}>
                    {libelle}
                  </option>
                ))}
              </select>
            </label>

            <label className="fieldset">
              <span className="label">Du</span>
              <input
                type="date"
                className="input input-bordered"
                value={filtres.from}
                max={filtres.to || undefined}
                onChange={(event) => changer("from", event.target.value)}
              />
            </label>

            <label className="fieldset">
              <span className="label">Au</span>
              <input
                type="date"
                className="input input-bordered"
                value={filtres.to}
                min={filtres.from || undefined}
                onChange={(event) => changer("to", event.target.value)}
              />
            </label>
          </div>
        </>
      )}

      {dateInvalide && (
        <p role="alert" className="text-sm text-warning">
          La date de début doit précéder la date de fin.
        </p>
      )}

      {notes.isLoading && (
        <div className="p-8 text-center">
          <span className="loading loading-spinner" />
        </div>
      )}
      {notes.isError && (
        <p role="alert" className="text-error">
          Impossible de charger les notes.
        </p>
      )}

      {notes.data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="stat rounded border border-base-200">
              <div className="stat-title">Notes</div>
              <div className="stat-value text-primary">
                {notes.data.resume.nbNotes}
              </div>
            </div>
            <div className="stat rounded border border-base-200">
              <div className="stat-title">Moyenne pondérée</div>
              <div className={`stat-value ${couleurNote(moyenne)}`}>
                {moyenne === null ? "—" : `${moyenne.toFixed(2)} / 20`}
              </div>
            </div>
          </div>

          <NotesTable notes={notes.data.data} />

          {notes.data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Page précédente"
                disabled={page <= 1}
                onClick={() => setPage((courante) => courante - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm">
                {page} / {notes.data.pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Page suivante"
                disabled={page >= notes.data.pagination.totalPages}
                onClick={() => setPage((courante) => courante + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
