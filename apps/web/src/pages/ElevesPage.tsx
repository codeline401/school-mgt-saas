import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FileSpreadsheet, PlusIcon, Users, RefreshCw } from "lucide-react";
import type { Eleve, Classe } from "@school-mgt/types";
import { Link } from "react-router-dom";
import { useState } from "react";

import CreateEleveModal from "../components/CreateEleveModal";
import ImportElevesModal from "../components/ImportElevesModal";
import ReinscribeEleveModal from "../components/ReinscribeEleveModal";

type EleveWithClasse = Omit<Eleve, "classeId"> & { classe?: Classe };

function ElevesPage() {
  const {
    data: eleves = [],
    isLoading,
    isError,
  } = useQuery<EleveWithClasse[]>({
    queryKey: ["eleves"],
    queryFn: async () => {
      const { data } = await api.get("/api/eleves");
      return data;
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showReinscribe, setShowReinscribe] = useState(false); // État pour le nouveau modal

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestion des élèves</h1>
          <p className="text-base-content/60">
            Liste exhaustive des élèves par classe
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm gap-2"
            onClick={() => setShowImport(true)}
          >
            <FileSpreadsheet size={16} />
            Importer Excel
          </button>

          {/* Nouveau bouton Réinscription avec style DaisyUI */}
          <button
            className="btn btn-neutral btn-sm gap-2"
            onClick={() => setShowReinscribe(true)}
          >
            <RefreshCw size={16} />
            Réinscrire un ancien
          </button>

          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setShowCreate(true)}
          >
            <PlusIcon size={16} />
            Ajouter un élève
          </button>
        </div>
      </div>

      {isError && (
        <div role="alert" className="alert alert-error alert-soft mb-4">
          <span>
            Impossible de charger les élèves. Veuillez réessayer plus tard.
          </span>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Nom &amp; Prénoms</th>
                <th>Classe</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : eleves.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <Users
                      size={36}
                      className="mx-auto mb-3 text-base-content/30"
                    />
                    <p className="text-base-content/50 font-medium">
                      Aucun élève enregistré
                    </p>
                    <p className="text-base-content/30 text-sm mt-1">
                      Commencez par ajouter un élève.
                    </p>
                  </td>
                </tr>
              ) : (
                eleves.map((eleve) => (
                  <tr key={eleve.id} className="hover">
                    <td className="font-medium">
                      <Link
                        to={`/eleves/${eleve.id}`}
                        className="cursor-pointer hover:underline"
                        aria-label={`Voir le profil de ${eleve.nom} ${eleve.prenom}`}
                      >
                        {eleve.nom} {eleve.prenom}
                      </Link>
                    </td>
                    <td>
                      {eleve.classe?.nom ?? (
                        <span className="text-base-content/40">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-success badge-soft">
                        Actif
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateEleveModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />
      <ImportElevesModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
      />
      {/* Intégration du nouveau Modal de Réinscription */}
      <ReinscribeEleveModal
        isOpen={showReinscribe}
        handleClose={() => setShowReinscribe(false)}
      />
    </div>
  );
}

export default ElevesPage;
