import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { useFichesEleves } from "../../fiche/hooks/useFicheEleve";

type StudentSearchSelectProps = {
  selectedStudentId?: string;
  onSelect: (student: FicheEleveComplete) => void;
};

/**
 * Recherche un élève par nom, prénom ou matricule.
 */
export function StudentSearchSelect({
  selectedStudentId,
  onSelect,
}: StudentSearchSelectProps) {
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading, isError } = useFichesEleves();

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return students.filter((student) => {
      const fullName = `${student.nom} ${student.prenom}`.toLowerCase();
      const matricule = String(student.matricule ?? "").toLowerCase();

      return fullName.includes(query) || matricule.includes(query);
    });
  }, [search, students]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body">
        <label className="label" htmlFor="student-search">
          <span className="label-text font-medium">Rechercher un élève</span>
        </label>

        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
          />

          <input
            id="student-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, prénom ou matricule"
            className="input input-bordered w-full pl-10"
          />
        </div>

        {selectedStudent && !search && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <UserRound size={18} className="text-primary" />
            <div>
              <p className="font-medium">
                {selectedStudent.nom} {selectedStudent.prenom}
              </p>
              <p className="text-sm text-base-content/60">
                Matricule : {selectedStudent.matricule}
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <p className="mt-3 text-sm text-base-content/60">
            Chargement des élèves...
          </p>
        )}

        {isError && (
          <div role="alert" className="alert alert-error mt-3">
            <span>Impossible de charger la liste des élèves.</span>
          </div>
        )}

        {!isLoading && search.trim() && filteredStudents.length === 0 && (
          <div role="alert" className="alert alert-warning mt-3">
            <span>Aucun élève trouvé pour cette recherche.</span>
          </div>
        )}

        {filteredStudents.length > 0 && (
          <div className="mt-3 space-y-2">
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                className="btn btn-outline w-full justify-between"
                onClick={() => {
                  onSelect(student);
                  setSearch("");
                }}
              >
                <span>
                  {student.nom} {student.prenom}
                </span>

                <span className="badge badge-ghost">
                  {student.matricule ?? "—"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
