import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { Professeur, Classe } from "@school-mgt/types";

type ProfWithClasses = Omit<Professeur, "classeIds"> & {
  classes: Classe[];
  specialites?: string;
};

type CreateProfForm = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  specialites: string;
  classeIds: string[];
};

const EMPTY_FORM: CreateProfForm = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  adresse: "",
  specialites: "",
  classeIds: [],
};

function ProfesseursPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const canCreate = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateProfForm>(EMPTY_FORM);

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

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: showCreateForm,
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateProfForm) => {
      const body: Record<string, unknown> = {
        nom: values.nom.trim(),
        prenom: values.prenom.trim(),
        email: values.email.trim(),
      };

      if (values.telephone.trim()) body.telephone = values.telephone.trim();
      if (values.adresse.trim()) body.adresse = values.adresse.trim();
      if (values.specialites.trim()) body.specialites = values.specialites.trim();
      if (values.classeIds.length) body.classeIds = values.classeIds;

      const { data } = await api.post("/api/profils/profs", body);
      return data;
    },
    onSuccess: () => {
      toast.success("Professeur créé avec succès.");
      setForm(EMPTY_FORM);
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["professeurs"] });
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la création du professeur."));
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClasseToggle = (classeId: string) => {
    setForm((prev) => {
      const exists = prev.classeIds.includes(classeId);
      return {
        ...prev,
        classeIds: exists
          ? prev.classeIds.filter((id) => id !== classeId)
          : [...prev.classeIds, classeId],
      };
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestion des professeurs</h1>
          <p className="text-base-content/60">Liste du corps enseignant</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            className="btn btn-primary"
            disabled={!canCreate}
            aria-disabled={!canCreate}
            title={
              canCreate
                ? "Créer un professeur"
                : "Seuls ADMIN et SUDO_ADMIN peuvent créer un professeur"
            }
            onClick={() => {
              if (canCreate) setShowCreateForm((v) => !v);
            }}
          >
            {showCreateForm ? "Fermer le formulaire" : "Ajouter un professeur"}
          </button>

          {!canCreate && (
            <span className="text-xs text-base-content/50">
              Accès création réservé à ADMIN et SUDO_ADMIN
            </span>
          )}
        </div>
      </div>

      {showCreateForm && canCreate && (
        <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg">Créer un professeur</h2>

            {createMutation.isError && (
              <div role="alert" className="alert alert-error alert-soft">
                <span>
                  {getApiError(
                    createMutation.error,
                    "Erreur lors de la création du professeur.",
                  )}
                </span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Nom</legend>
                  <input
                    className="input w-full"
                    name="nom"
                    value={form.nom}
                    onChange={handleInputChange}
                    required
                    minLength={2}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Prénom</legend>
                  <input
                    className="input w-full"
                    name="prenom"
                    value={form.prenom}
                    onChange={handleInputChange}
                    required
                    minLength={2}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Email</legend>
                  <input
                    type="email"
                    className="input w-full"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    required
                  />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Téléphone</legend>
                  <input
                    className="input w-full"
                    name="telephone"
                    value={form.telephone}
                    onChange={handleInputChange}
                  />
                </fieldset>

                <fieldset className="fieldset md:col-span-2">
                  <legend className="fieldset-legend">Spécialités</legend>
                  <input
                    className="input w-full"
                    name="specialites"
                    value={form.specialites}
                    onChange={handleInputChange}
                    placeholder="Mathématiques, Physique..."
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Adresse</legend>
                <input
                  className="input w-full"
                  name="adresse"
                  value={form.adresse}
                  onChange={handleInputChange}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Classes assignées</legend>

                {isLoadingClasses ? (
                  <div className="py-2">
                    <span className="loading loading-spinner loading-sm" />
                  </div>
                ) : classes.length === 0 ? (
                  <p className="text-sm text-base-content/50">
                    Aucune classe disponible.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {classes.map((c) => (
                      <label key={c.id} className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={form.classeIds.includes(c.id)}
                          onChange={() => handleClasseToggle(c.id)}
                        />
                        <span className="label-text">{c.nom}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setForm(EMPTY_FORM);
                  }}
                  disabled={createMutation.isPending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Créer le professeur"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <Users size={36} className="mx-auto mb-3 text-base-content/30" />
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
