import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import type { FicheEleveComplete, Matiere } from "@school-mgt/types";
import { useAuthStore } from "../../../../../store/authStore";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import { useMatieresOptions } from "../../notes/hooks/useOptionsFiltresNotes";
import { useClasses } from "../../../../logistique/hooks/useLocaux";
import {
  useProgression,
  useProgressionPeriodes,
  type ProgressionFiltres,
} from "../hooks/useProgression";
import { ProgressionChart } from "./ProgressionChart";
import { ProgressionFilters } from "./ProgressionFilters";
import { ProgressionSummary } from "./ProgressionSummary";

type Props = {
  initialEleveId?: string;
};

const FILTRES_VIDES: ProgressionFiltres = {};

export function ProgressionSection({ initialEleveId }: Props) {
  const user = useAuthStore((state) => state.user);
  const autorise = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [eleveId, setEleveId] = useState(initialEleveId);
  const [filtres, setFiltres] = useState<ProgressionFiltres>(FILTRES_VIDES);

  const classesQuery = useClasses();
  const matieresQuery = useMatieresOptions(filtres.classeId ?? "");
  const periodesQuery = useProgressionPeriodes(filtres.classeId ?? "");
  const progression = useProgression(eleveId, filtres);

  function selectionnerEleve(eleve: FicheEleveComplete) {
    setEleveId(eleve.id);
    setFiltres(FILTRES_VIDES);
  }

  function changerClasse(classeId: string) {
    setFiltres((courant) => ({
      ...courant,
      classeId: classeId || undefined,
      periodeId: undefined,
      matiereId: undefined,
    }));
  }

  if (!autorise) {
    return (
      <p role="alert" className="alert alert-warning">
        Cette section est réservée aux administrateurs.
      </p>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex items-center gap-3">
        <BookOpen className="text-primary" size={22} />
        <div>
          <h2 className="text-lg font-bold">Progression scolaire</h2>
          <p className="text-sm text-base-content/60">
            Évolution des moyennes par période ou par matière.
          </p>
        </div>
      </header>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={selectionnerEleve}
      />

      {classesQuery.isError && (
        <p role="alert" className="text-error">
          Impossible de charger les classes.
        </p>
      )}

      {eleveId && (
        <ProgressionFilters
          classes={classesQuery.data ?? []}
          periodes={periodesQuery.data ?? []}
          matieres={(matieresQuery.data ?? []) as Matiere[]}
          classeId={filtres.classeId ?? ""}
          periodeId={filtres.periodeId ?? ""}
          matiereId={filtres.matiereId ?? ""}
          onClasseChange={changerClasse}
          onPeriodeChange={(periodeId) =>
            setFiltres((courant) => ({
              ...courant,
              periodeId: periodeId || undefined,
            }))
          }
          onMatiereChange={(matiereId) =>
            setFiltres((courant) => ({
              ...courant,
              matiereId: matiereId || undefined,
            }))
          }
        />
      )}

      {!eleveId && (
        <div className="rounded border border-dashed border-base-300 p-8 text-center">
          <Search className="mx-auto text-base-content/40" size={24} />
          <p className="mt-2 font-medium">Aucun élève sélectionné</p>
          <p className="text-sm text-base-content/60">
            Recherchez un élève pour consulter sa progression.
          </p>
        </div>
      )}

      {eleveId && progression.isLoading && (
        <div className="flex justify-center py-10" aria-busy="true">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {eleveId && progression.isError && (
        <p role="alert" className="alert alert-error">
          Impossible de charger la progression de l’élève.
        </p>
      )}

      {eleveId && progression.data && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold">
              {progression.data.eleve.prenom} {progression.data.eleve.nom}
            </h3>
            <span className="text-sm text-base-content/60">
              {progression.data.eleve.classe?.nom ?? "Sans classe"}
            </span>
          </div>

          {progression.data.points.length === 0 ? (
            <div className="rounded border border-dashed border-base-300 p-8 text-center">
              <p className="font-medium">Aucune donnée de progression</p>
              <p className="text-sm text-base-content/60">
                Aucune note ne correspond aux filtres sélectionnés.
              </p>
            </div>
          ) : (
            <>
              <ProgressionSummary resume={progression.data.resume} />
              <ProgressionChart points={progression.data.points} />
            </>
          )}
        </>
      )}

      {eleveId && (matieresQuery.isError || periodesQuery.isError) && (
        <p role="alert" className="text-sm text-error">
          Impossible de charger les filtres de la classe.
        </p>
      )}
    </section>
  );
}
