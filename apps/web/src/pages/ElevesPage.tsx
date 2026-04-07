import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Plus } from "lucide-react";
import type { Eleve, Classe } from "@school-mgt/types";

// Extend shared Eleve type to inculde the populate classe object
type EleveWithClasse = Omit<Eleve, "classeId"> & { classe?: Classe };

function ElevesPage() {
  // Etat pour stocker la liste des élèves
  const [eleves, setEleves] = useState<EleveWithClasse[]>([]);

  // Etat pour gérer le chargement
  const [loading, setLoading] = useState(true);

  // Etat pour gérer les erreurs
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Appel API vers le backend pour récupérer les élèves
    api
      .get("/api/eleves")
      .then((res) => {
        setEleves(res.data); // Stocker les élèves dans l'état
        setLoading(false); // Fin du chargement
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des élèves:", err);
        setError(
          "Impossible de charger les élèves. Veuillez réessayer plus tard.",
        );
        setLoading(false); // Fin du chargement même en cas d'erreur
      });
  }, []);

  // Vue de la page
  return (
    <div>
      {/**En-tête avec un bouton action */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des élèves
          </h1>
          <p className="text-gray-500 ">
            Liste exhaustive des élèves par classe
          </p>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Ajouter un élève
        </button>
      </div>

      {/**Tableau de données */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Nom & Prénoms
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">Classe</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {error ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-red-600">
                  {error}
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  <span className="loading loading-dots loading-xs"></span>
                </td>
              </tr>
            ) : (
              eleves.map((eleve) => (
                <tr
                  key={eleve.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    {eleve.nom} {eleve.prenom}
                  </td>
                  <td className="px-6 py-4">{eleve.classe?.nom || "N/A"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
  );
}

export default ElevesPage;
