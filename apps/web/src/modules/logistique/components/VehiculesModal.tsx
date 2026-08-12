import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import {
  useCreateVehicule,
  useUpdateVehicule,
  type Vehicule,
  type CreateVehiculeInput,
} from "../hooks/useTransport";

interface VehiculeModalProps {
  vehicule: Vehicule | null;
  onClose: () => void;
}

export default function VehiculeModal({
  vehicule,
  onClose,
}: VehiculeModalProps) {
  const isEdit = !!vehicule;
  const createMutation = useCreateVehicule();
  const updateMutation = useUpdateVehicule(vehicule?.id || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateVehiculeInput>({
    defaultValues: vehicule || {},
  });

  useEffect(() => {
    if (vehicule) {
      reset(vehicule);
    }
  }, [vehicule, reset]);

  const onSubmit = async (data: CreateVehiculeInput) => {
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
            {isEdit ? "Modifier le véhicule" : "Nouveau véhicule"}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom */}
          <fieldset className="fieldset">
            <label className="label">
              <legend className="fieldset-legend required">
                Nom du véhicule
              </legend>
            </label>
            <input
              type="text"
              className={`input input-bordered ${errors.nom ? "input-error" : ""}`}
              placeholder="Bus 1"
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

          {/* Type et Numéro de plaque */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">Type</legend>
              </label>
              <select
                className={`select select-bordered ${errors.typeVehicule ? "select-error" : ""}`}
                {...register("typeVehicule", {
                  required: "Le type est requis",
                })}
              >
                <option value="">Sélectionner</option>
                <option value="BUS">Bus</option>
                <option value="MINIBUS">Minibus</option>
                <option value="VOITURE">Voiture</option>
                <option value="VAN">Van</option>
              </select>
              {errors.typeVehicule && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.typeVehicule.message}
                  </span>
                </label>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">
                  Immatriculation
                </legend>
              </label>
              <input
                type="text"
                className={`input input-bordered ${errors.immatriculation ? "input-error" : ""}`}
                placeholder="AB-1234-CD"
                {...register("immatriculation", {
                  required: "Le numéro de plaque est requis",
                })}
              />
              {errors.immatriculation && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.immatriculation.message}
                  </span>
                </label>
              )}
            </fieldset>
          </div>

          {/* Capacité et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">
                  Capacité (places)
                </legend>
              </label>
              <input
                type="number"
                className={`input input-bordered ${errors.capacite ? "input-error" : ""}`}
                placeholder="50"
                {...register("capacite", {
                  required: "La capacité est requise",
                  valueAsNumber: true,
                  min: { value: 1, message: "Minimum 1 place" },
                })}
              />
              {errors.capacite && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.capacite.message}
                  </span>
                </label>
              )}
            </fieldset>

            {isEdit && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Statut</span>
                </label>
                <select
                  className="select select-bordered"
                  {...register("statut" as keyof CreateVehiculeInput)}
                >
                  <option value="ACTIF">Actif</option>
                  <option value="MAINTENANCE">En maintenance</option>
                  <option value="HORS_SERVICE">Hors service</option>
                  <option value="VENDU">Vendu</option>
                </select>
              </div>
            )}
          </div>

          {/* Marque, Modèle, Année */}
          <div className="grid grid-cols-3 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Marque</legend>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Toyota"
                {...register("marque")}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Modèle</legend>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Hiace"
                {...register("modele")}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Année</legend>
              <input
                type="number"
                className="input input-bordered"
                placeholder="2024"
                {...register("annee", { valueAsNumber: true })}
              />
            </fieldset>
          </div>

          {/* Kilométrage */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Kilométrage</legend>
            <input
              type="number"
              className="input input-bordered"
              placeholder="50000"
              {...register("kilometrage", { valueAsNumber: true })}
            />
          </fieldset>

          {/* Révisions */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Dernière révision</legend>
              <input
                type="date"
                className="input input-bordered"
                {...register("derniereRevision")}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Prochaine révision</legend>
              <input
                type="date"
                className="input input-bordered"
                {...register("prochaineRevision")}
              />
            </fieldset>
          </div>

          {/* Assurance */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Numéro d'assurance</legend>
              <input
                type="text"
                className="input input-bordered"
                placeholder="ASS-123456"
                {...register("numeroAssurance")}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Expiration assurance</legend>
              <input
                type="date"
                className="input input-bordered"
                {...register("dateExpirationAssurance")}
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
