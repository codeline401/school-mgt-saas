import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Search } from "lucide-react";
import {
  useCreateAffectation,
  useUpdateAffectation,
  useRoutes,
  type AffectationTransport,
  type CreateAffectationInput,
} from "../hooks/useTransport";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../../lib/api";

interface AffectationModalProps {
  affectation: AffectationTransport | null;
  onClose: () => void;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  classeId?: string;
  classe?: {
    nom: string;
  };
}

export default function AffectationModal({
  affectation,
  onClose,
}: AffectationModalProps) {
  const isEdit = !!affectation;
  const createMutation = useCreateAffectation();
  const updateMutation = useUpdateAffectation(affectation?.id || "");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(
    affectation?.eleve || null,
  );

  const { data: routes = [] } = useRoutes({ statut: "ACTIVE" });

  // Recherche d'élèves
  const { data: eleves = [] } = useQuery({
    queryKey: ["eleves-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data } = await api.get<Eleve[]>("/api/eleves", {
        params: { search: searchQuery },
      });
      return data;
    },
    enabled: searchQuery.length >= 2,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateAffectationInput>({
    defaultValues: affectation
      ? {
          eleveId: affectation.eleveId,
          routeId: affectation.routeId,
          arretMontee: affectation.arretMontee || "",
          arretDescente: affectation.arretDescente || "",
          dateDebut: affectation.dateDebut?.substring(0, 10) || "",
          dateFin: affectation.dateFin?.substring(0, 10) || "",
        }
      : {},
  });

  useEffect(() => {
    if (affectation) {
      reset({
        eleveId: affectation.eleveId,
        routeId: affectation.routeId,
        arretMontee: affectation.arretMontee || "",
        arretDescente: affectation.arretDescente || "",
        dateDebut: affectation.dateDebut?.substring(0, 10) || "",
        dateFin: affectation.dateFin?.substring(0, 10) || "",
      });
      setSelectedEleve(affectation.eleve);
    }
  }, [affectation, reset]);

  const handleSelectEleve = (eleve: Eleve) => {
    setSelectedEleve(eleve);
    setValue("eleveId", eleve.id);
    setSearchQuery("");
  };

  const onSubmit = async (data: CreateAffectationInput) => {
    if (!selectedEleve) {
      toast.error("Veuillez sélectionner un élève");
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ||
          `Erreur lors de ${isEdit ? "la modification" : "la création"}`,
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            {isEdit ? "Modifier l'affectation" : "Nouvelle affectation"}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Sélection élève */}
          {!isEdit && (
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Eleve</legend>

              {selectedEleve ? (
                <div className="toast.error toast.error-info">
                  <div>
                    <div className="font-medium">
                      {selectedEleve.nom} {selectedEleve.prenom}
                    </div>
                    {selectedEleve.classe && (
                      <div className="text-sm">{selectedEleve.classe.nom}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEleve(null);
                      setValue("eleveId", "");
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <span>
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Rechercher un élève..."
                      className="input input-bordered w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {searchQuery && eleves.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-base-300 rounded-lg">
                      {eleves.map((eleve) => (
                        <button
                          key={eleve.id}
                          type="button"
                          onClick={() => handleSelectEleve(eleve)}
                          className="w-full text-left p-3 hover:bg-base-200 transition-colors"
                        >
                          <div className="font-medium">
                            {eleve.nom} {eleve.prenom}
                          </div>
                          {eleve.classe && (
                            <div className="text-sm text-base-content/60">
                              {eleve.classe.nom}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <input type="hidden" {...register("eleveId")} />
            </fieldset>
          )}

          {/* Route */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend required">Route</legend>
            <select
              className={`select select-bordered ${errors.routeId ? "select-error" : ""}`}
              {...register("routeId", { required: "La route est requise" })}
            >
              <option value="">Sélectionner une route</option>
              {routes.map((route: (typeof routes)[0]) => (
                <option key={route.id} value={route.id}>
                  {route.nom} - {route.typeRoute} (
                  {route.vehicule.capacite - (route._count?.affectations || 0)}{" "}
                  places disponibles)
                </option>
              ))}
            </select>
            {errors.routeId && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.routeId.message}
                </span>
              </label>
            )}
          </fieldset>

          {/* Arrêts */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Arrêt monté</legend>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Ex: Place centrale"
                {...register("arretMontee")}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Arrêt de descente</legend>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Ex: École"
                {...register("arretDescente")}
              />
            </fieldset>
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Date début</legend>
              <input
                type="date"
                className="input input-bordered"
                {...register("dateDebut")}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Date fin</legend>
              <input
                type="date"
                className="input input-bordered"
                {...register("dateFin")}
              />
            </fieldset>
          </div>

          {/* Statut (uniquement en édition) */}
          {isEdit && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Statut</span>
              </label>
              <select
                className="select select-bordered"
                {...register("statut" as keyof CreateAffectationInput)}
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDUE">Suspendue</option>
                <option value="TERMINEE">Terminée</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : isEdit ? (
                "Modifier"
              ) : (
                "Créer"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
