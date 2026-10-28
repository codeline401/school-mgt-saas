import { useState, useMemo } from "react";
import { Calendar, Search } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { StudentSearchSelect } from "../../informations/emergencyContact/components/StudentSearchSelect";
import { STATUT_CONFIG } from "../suivi.constants";
import {
  useSuiviAbsences,
  type StatutPresence,
} from "../hooks/useSuiviAbsences";
import {
  PERIODE_PAR_DEFAUT,
  PERIODE_PERSONNALISEE,
  construirePeriodes,
  moisCourant,
} from "../utils/periode";
import { SuiviHistorique } from "./SuiviHistorique";
import { SuiviResume } from "./SuiviResume";
import { usePeriodesScolaires } from "../hooks/usePeriodeScolaires";

type Props = { initialEleveId?: string };

const LIMITE = 10;

// Onglet « Suivi » : absences et retards d'un élève, filtrables par période et statut.
export function SuiviAbsenceSection({ initialEleveId }: Props) {
  const [selectedEleve, setSelectedEleve] = useState<FicheEleveComplete | null>(
    null,
  );
  const { data: periodesScolaires = [] } = usePeriodesScolaires();
  const options = useMemo(
    () => construirePeriodes(periodesScolaires),
    [periodesScolaires],
  );

  const [periodeKey, setPeriodeKey] = useState(PERIODE_PAR_DEFAUT);
  const [custom, setCustom] = useState(() => moisCourant());

  // La période active est dérivée : elle suit le paramétrage dès qu'il est chargé.
  const periode =
    periodeKey === PERIODE_PERSONNALISEE
      ? custom
      : (options.find((o) => o.key === periodeKey) ?? options[0]);

  const [statut, setStatut] = useState<StatutPresence | "">("");
  const [page, setPage] = useState(1);

  const eleveId = selectedEleve?.id ?? initialEleveId;
  const plageValide = periode.from <= periode.to;

  const suivi = useSuiviAbsences(eleveId, {
    // REVIEW : For preset periods, periode is a PeriodeOption, so ...periode also copies key and label.
    // TypeScript does not report this, because the spread comes from a variable.
    // These two fields then go into the React Query key and the request query string (?key=...&label=...).
    // Changing a label invalidates the cache for no reason. The API ignores the extra fields today.
    // Pick the two fields explicitly.
    from: periode.from,
    to: periode.to,
    statut: statut || undefined,
    page,
    limit: LIMITE,
  });

  function changerPeriode(key: string) {
    if (key === PERIODE_PERSONNALISEE)
      setCustom({ from: periode.from, to: periode.to });
    setPeriodeKey(key);
    setPage(1);
  }

  function changerDate(champ: "from" | "to", value: string) {
    setCustom((p) => ({ ...p, [champ]: value }));
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar size={20} className="text-primary" />
        <div>
          <h2 className="text-lg font-bold">Suivi des absences et retards</h2>
          <p className="text-sm text-base-content/60">
            Historique de présence d'un élève sur la période choisie.
          </p>
        </div>
      </div>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={(student) => {
          setSelectedEleve(student);
          setPage(1);
        }}
      />

      {!eleveId && (
        <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
          <Search size={24} className="mx-auto text-base-content/40" />
          <p className="mt-2 font-medium">Aucun élève sélectionné</p>
        </div>
      )}

      {eleveId && (
        <>
          <div className="card border border-base-200 bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <fieldset className="fieldset">
                  <label className="label" htmlFor="suivi-periode">
                    Période
                  </label>
                  <select
                    id="suivi-periode"
                    className="select select-bordered"
                    value={periodeKey}
                    onChange={(e) => changerPeriode(e.target.value)}
                  >
                    {options.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                    <option value={PERIODE_PERSONNALISEE}>Personnalisée</option>
                  </select>
                </fieldset>

                <fieldset className="fieldset">
                  <label className="label" htmlFor="suivi-statut">
                    Statut
                  </label>
                  <select
                    id="suivi-statut"
                    className="select select-bordered"
                    value={statut}
                    onChange={(e) => {
                      setStatut(e.target.value as StatutPresence | "");
                      setPage(1);
                    }}
                  >
                    <option value="">Tous</option>
                    {Object.entries(STATUT_CONFIG).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </fieldset>

                {periodeKey === "personnalisee" && (
                  <>
                    <fieldset className="fieldset">
                      <label className="label" htmlFor="suivi-from">
                        Du
                      </label>
                      <input
                        id="suivi-from"
                        type="date"
                        className="input input-bordered"
                        value={periode.from}
                        max={periode.to}
                        onChange={(e) => changerDate("from", e.target.value)}
                      />
                    </fieldset>
                    <fieldset className="fieldset">
                      <label className="label" htmlFor="suivi-to">
                        Au
                      </label>
                      <input
                        id="suivi-to"
                        type="date"
                        className="input input-bordered"
                        value={periode.to}
                        min={periode.from}
                        onChange={(e) => changerDate("to", e.target.value)}
                      />
                    </fieldset>
                  </>
                )}
              </div>

              {!plageValide && (
                <p role="alert" className="text-sm text-warning">
                  La date de début doit précéder la date de fin.
                </p>
              )}
            </div>
          </div>

          {suivi.isLoading && (
            <div className="p-8 text-center">
              <span className="loading loading-spinner" />
            </div>
          )}
          {suivi.isError && (
            <p className="text-error">Impossible de charger le suivi.</p>
          )}

          {suivi.data && (
            <>
              <SuiviResume resume={suivi.data.resume} />
              <SuiviHistorique
                lignes={suivi.data.data}
                pagination={suivi.data.pagination}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
