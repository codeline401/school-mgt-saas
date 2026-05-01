import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { api } from "../lib/api";
import type { Professeur, Classe } from "@school-mgt/types";

type ProfWithClasses = Omit<Professeur, "classeIds"> & {
  classes: Classe[];
  specialites?: string;
};

function ProfesseursPage() {
  const {
    data: professeurs = [],
    isLoading,
    isError,
  } = useQuery<ProfWithClasses[]>({
    queryKey: ["professeurs"],
    queryFn: async () => {
      const { data } = await api.get("/api/professeurs");
      return data;
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestion des professeurs</h1>
          <p className="text-base-content/60">Liste du corps enseignant</p>
        </div>
      </div>

      {isError && (
        <div role="alert" className="alert alert-error alert-soft mb-4">
          <span>
            Impossible de charger les professeurs. Veuillez réessayer plus tard.
          </span>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Nom &amp; Prénoms</th>
                <th>Classes</th>
                <th>Spécialités</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : professeurs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <Users
                      size={36}
                      className="mx-auto mb-3 text-base-content/30"
                    />
                    <p className="text-base-content/50 font-medium">
                      Aucun professeur enregistré
                    </p>
                  </td>
                </tr>
              ) : (
                professeurs.map((prof) => (
                  <tr key={prof.id} className="hover">
                    <td className="font-medium">
                      <Link
                        to={`/professeurs/${prof.id}`}
                        className="cursor-pointer hover:underline"
                        aria-label={`Voir le profil de ${prof.nom} ${prof.prenom}`}
                      >
                        {prof.nom} {prof.prenom}
                      </Link>
                    </td>
                    <td>
                      {prof.classes.length > 0 ? (
                        prof.classes.map((c) => c.nom).join(", ")
                      ) : (
                        <span className="text-base-content/40">Aucune</span>
                      )}
                    </td>
                    <td>
                      {prof.specialites ?? (
                        <span className="text-base-content/40">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProfesseursPage;
