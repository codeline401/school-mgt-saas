import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { api } from "../../lib/api";
import type { Eleve } from "@school-mgt/types";
import CreateEleveModal from "../CreateEleveModal";

interface Props {
  classeId: string;
  canEdit: boolean;
}

/**
 * Onglet Élèves — liste les élèves de la classe
 * et permet à l'ADMIN d'en ajouter via le modal CreateEleveModal.
 */
export default function ElevesTab({ classeId, canEdit }: Props) {
  const [showCreate, setShowCreate] = useState(false);

  const {
    data: eleves = [],
    isLoading,
    isError,
  } = useQuery<Eleve[]>({
    queryKey: ["classe-eleves", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}/eleves`);
      return data;
    },
  });

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <p className="text-base-content/60 text-sm">
          {eleves.length} élève{eleves.length > 1 ? "s" : ""} dans cette classe
        </p>
        {canEdit && (
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={14} /> Ajouter un élève
          </button>
        )}
      </div>

      {/* Erreur */}
      {isError && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>Impossible de charger les élèves.</span>
        </div>
      )}

      {/* Tableau */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Nom &amp; Prénoms</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="text-center py-8">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : eleves.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    <Users
                      size={32}
                      className="mx-auto mb-2 text-base-content/30"
                    />
                    <p className="text-base-content/50">
                      Aucun élève dans cette classe
                    </p>
                  </td>
                </tr>
              ) : (
                eleves.map((eleve) => (
                  <tr key={eleve.id} className="hover">
                    <td className="font-medium">
                      {eleve.nom} {eleve.prenom}
                    </td>
                    <td>
                      <span className="badge badge-success badge-soft">
                        Actif
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/eleves/${eleve.id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        Voir la fiche
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création élève — pré-sélectionne la classe courante */}
      <CreateEleveModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        defaultClasseId={classeId}
      />
    </div>
  );
}
