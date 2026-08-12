import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import {
  useCreateChauffeur,
  useUpdateChauffeur,
  type Chauffeur,
  type CreateChauffeurInput,
} from "../hooks/useTransport";

interface ChauffeurModalProps {
  chauffeur: Chauffeur | null;
  onClose: () => void;
}

export default function ChauffeurModal({
  chauffeur,
  onClose,
}: ChauffeurModalProps) {
  const isEdit = !!chauffeur;
  const createMutation = useCreateChauffeur();
  const updateMutation = useUpdateChauffeur(chauffeur?.id || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateChauffeurInput>({
    defaultValues: chauffeur || {},
  });

  useEffect(() => {
    if (chauffeur) {
      reset(chauffeur);
    }
  }, [chauffeur, reset]);

  const onSubmit = async (data: CreateChauffeurInput) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(
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
            {isEdit ? "Modifier le chauffeur" : "Nouveau chauffeur"}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom et Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">Nom</legend>
              </label>
              <input
                type="text"
                className={`input input-bordered ${errors.nom ? "input-error" : ""}`}
                placeholder="Rakoto"
                {...register("nom", { required: "Le nom est requis" })}
              />
              {errors.nom && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.nom.message}
                  </span>
                </label>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">Prénom</legend>
              </label>
              <input
                type="text"
                className={`input input-bordered ${errors.prenom ? "input-error" : ""}`}
                placeholder="Jean"
                {...register("prenom", { required: "Le prénom est requis" })}
              />
              {errors.prenom && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.prenom.message}
                  </span>
                </label>
              )}
            </fieldset>
          </div>

          {/* Téléphone */}
          <fieldset className="fieldset">
            <label className="label">
              <legend className="fieldset-legend required">Téléphone</legend>
            </label>
            <input
              type="tel"
              className={`input input-bordered ${errors.telephone ? "input-error" : ""}`}
              placeholder="034 12 345 67"
              {...register("telephone", {
                required: "Le téléphone est requis",
              })}
            />
            {errors.telephone && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.telephone.message}
                </span>
              </label>
            )}
          </fieldset>

          {/* Permis */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">
                  Numéro de permis
                </legend>
              </label>
              <input
                type="text"
                className={`input input-bordered ${errors.numeroPermis ? "input-error" : ""}`}
                placeholder="PERM-123456"
                {...register("numeroPermis", {
                  required: "Le numéro de permis est requis",
                })}
              />
              {errors.numeroPermis && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.numeroPermis.message}
                  </span>
                </label>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">
                  Type de permis
                </legend>
              </label>
              <select
                className={`select select-bordered ${errors.typePermis ? "select-error" : ""}`}
                {...register("typePermis", {
                  required: "Le type de permis est requis",
                })}
              >
                <option value="">Sélectionner</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
              {errors.typePermis && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.typePermis.message}
                  </span>
                </label>
              )}
            </fieldset>
          </div>

          {/* Expiration permis et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Expiration du permis</legend>
              <input
                type="date"
                className="input input-bordered"
                {...register("dateExpirationPermis")}
              />
            </fieldset>

            {isEdit && (
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Statut</legend>
                <select
                  className="select select-bordered"
                  {...register("statut" as keyof CreateChauffeurInput)}
                >
                  <option value="ACTIF">Actif</option>
                  <option value="CONGE">En congé</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="INACTIF">Inactif</option>
                </select>
              </fieldset>
            )}
          </div>

          {/* Adresse */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend required">Adresse</legend>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="123 Rue Example, Antananarivo"
              {...register("adresse")}
            />
          </fieldset>

          {/* Date de naissance et Date d'embauche */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">
                Date de Naissance
              </legend>
              <input
                type="date"
                className="input input-bordered"
                {...register("dateNaissance")}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend required">
                Date d'embauche
              </legend>
              <input
                type="date"
                className="input input-bordered"
                {...register("dateEmbauche")}
              />
            </fieldset>
          </div>

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
