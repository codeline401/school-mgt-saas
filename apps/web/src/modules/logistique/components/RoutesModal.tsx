import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Plus, Trash2 } from "lucide-react";
import {
  useCreateRoute,
  useUpdateRoute,
  useVehicules,
  useChauffeurs,
  type Route,
  type CreateRouteInput,
} from "../hooks/useTransport";
import toast from "react-hot-toast";

interface RouteModalProps {
  route: Route | null;
  onClose: () => void;
}

const JOURS_SEMAINE = [
  { value: "LUNDI", label: "Lundi" },
  { value: "MARDI", label: "Mardi" },
  { value: "MERCREDI", label: "Mercredi" },
  { value: "JEUDI", label: "Jeudi" },
  { value: "VENDREDI", label: "Vendredi" },
  { value: "SAMEDI", label: "Samedi" },
  { value: "DIMANCHE", label: "Dimanche" },
];

interface Arret {
  nom: string;
  heure: string;
  ordre: number;
}

export default function RouteModal({ route, onClose }: RouteModalProps) {
  const isEdit = !!route;
  const createMutation = useCreateRoute();
  const updateMutation = useUpdateRoute(route?.id || "");

  const { data: vehicules = [] } = useVehicules({ statut: "ACTIF" });
  const { data: chauffeurs = [] } = useChauffeurs({ statut: "ACTIF" });

  const [joursActifs, setJoursActifs] = useState<string[]>([]);
  const [arrets, setArrets] = useState<Arret[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateRouteInput>({
    defaultValues: route
      ? {
          ...route,
          heureDepart: route.heureDepart?.substring(11, 16) || "",
          heureArrivee: route.heureArrivee?.substring(11, 16) || "",
        }
      : {},
  });

  // Helper pour extraire HH:mm peu importe le format en entrée (ISO ou HH:mm)
  const formatTimeInput = (timeStr?: string) => {
    if (!timeStr) return "";
    if (timeStr.includes("T")) {
      return timeStr.substring(11, 16); // Format ISO
    }
    return timeStr.substring(0, 5); // Format HH:mm ou HH:mm:ss
  };

  useEffect(() => {
    if (route) {
      reset({
        ...route,
        heureDepart: formatTimeInput(route.heureDepart),
        heureArrivee: formatTimeInput(route.heureArrivee),
      });

      // Parse jours actifs
      try {
        const jours = JSON.parse(route.joursActifs);
        setJoursActifs(Array.isArray(jours) ? jours : []);
      } catch {
        setJoursActifs([]);
      }

      // Parse arrêts
      try {
        if (route.arrets) {
          const parsedArrets = JSON.parse(route.arrets);
          setArrets(Array.isArray(parsedArrets) ? parsedArrets : []);
        }
      } catch {
        setArrets([]);
      }
    }
  }, [route, reset]);

  const handleJourToggle = (jour: string) => {
    setJoursActifs((prev) =>
      prev.includes(jour) ? prev.filter((j) => j !== jour) : [...prev, jour],
    );
  };

  const handleAddArret = () => {
    setArrets((prev) => [
      ...prev,
      { nom: "", heure: "", ordre: prev.length + 1 },
    ]);
  };

  const handleRemoveArret = (index: number) => {
    setArrets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleArretChange = (
    index: number,
    field: keyof Arret,
    value: string,
  ) => {
    setArrets((prev) =>
      prev.map((arret, i) =>
        i === index ? { ...arret, [field]: value } : arret,
      ),
    );
  };

  const onSubmit = async (data: CreateRouteInput) => {
    if (joursActifs.length === 0) {
      toast.error("Veuillez sélectionner au moins un jour actif");
      return;
    }

    try {
      // 1. Nettoyage et formatage des heures en HH:mm
      const heureDepartFormatted = data.heureDepart
        ? data.heureDepart.slice(0, 5)
        : "";
      const heureArriveeFormatted =
        data.heureArrivee && data.heureArrivee.trim() !== ""
          ? data.heureArrivee.slice(0, 5)
          : undefined; // 💡 On met undefined si vide pour éviter d'envoyer "" à Zod

      const payload = {
        ...data,
        heureDepart: heureDepartFormatted,
        heureArrivee: heureArriveeFormatted,
        joursActifs: JSON.stringify(joursActifs),
        arrets: arrets.length > 0 ? JSON.stringify(arrets) : undefined,
      };

      if (isEdit) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
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
      <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            {isEdit ? "Modifier la route" : "Nouvelle route"}
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
                Nom de la route
              </legend>
            </label>
            <input
              type="text"
              className={`input input-bordered ${errors.nom ? "input-error" : ""}`}
              placeholder="Route Nord"
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

          {/* Type et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">Type</legend>
              </label>
              <select
                className={`select select-bordered ${errors.typeRoute ? "select-error" : ""}`}
                {...register("typeRoute", { required: "Le type est requis" })}
              >
                <option value="">Sélectionner</option>
                <option value="ALLER">Aller</option>
                <option value="RETOUR">Retour</option>
                <option value="ALLER_RETOUR">Aller-Retour</option>
                <option value="SORTIE">Sortie</option>
              </select>
              {errors.typeRoute && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.typeRoute.message}
                  </span>
                </label>
              )}
            </fieldset>

            {isEdit && (
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Statut</legend>
                <select
                  className="select select-bordered"
                  {...register("statut" as keyof CreateRouteInput)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDUE">Suspendue</option>
                  <option value="ANNULEE">Annulée</option>
                </select>
              </fieldset>
            )}
          </div>

          {/* Véhicule et Chauffeur */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">Véhicule</legend>
              </label>
              <select
                className={`select select-bordered ${errors.vehiculeId ? "select-error" : ""}`}
                {...register("vehiculeId", {
                  required: "Le véhicule est requis",
                })}
              >
                <option value="">Sélectionner</option>
                {vehicules.map((v: (typeof vehicules)[0]) => (
                  <option key={v.id} value={v.id}>
                    {v.nom} ({v.immatriculation}) - {v.capacite} places
                  </option>
                ))}
              </select>
              {errors.vehiculeId && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.vehiculeId.message}
                  </span>
                </label>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">Chauffeur</legend>
              </label>
              <select
                className={`select select-bordered ${errors.chauffeurId ? "select-error" : ""}`}
                {...register("chauffeurId", {
                  required: "Le chauffeur est requis",
                })}
              >
                <option value="">Sélectionner</option>
                {chauffeurs.map((c: (typeof chauffeurs)[0]) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom}
                  </option>
                ))}
              </select>
              {errors.chauffeurId && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.chauffeurId.message}
                  </span>
                </label>
              )}
            </fieldset>
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <label className="label">
                <legend className="fieldset-legend required">
                  Heure de départ
                </legend>
              </label>
              <input
                type="time"
                className={`input input-bordered ${errors.heureDepart ? "input-error" : ""}`}
                {...register("heureDepart", {
                  required: "L'heure de départ est requise",
                })}
              />
              {errors.heureDepart && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.heureDepart.message}
                  </span>
                </label>
              )}
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend required">
                Heure d'arrivé
              </legend>
              <input
                type="time"
                className="input input-bordered"
                {...register("heureArrivee")}
              />
            </fieldset>
          </div>

          {/* Jours actifs */}
          <fieldset className="fieldset">
            <label className="label">
              <legend className="fieldset-legend required">Jours actifs</legend>
            </label>
            <div className="flex flex-wrap gap-2">
              {JOURS_SEMAINE.map((jour) => (
                <label key={jour.value} className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={joursActifs.includes(jour.value)}
                    onChange={() => handleJourToggle(jour.value)}
                  />
                  <span className="label-text">{jour.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Arrêts */}
          <fieldset className="fieldset">
            <div className="flex items-center justify-between mb-2">
              <legend className="fieldset-legend required">
                Arrêt (optionnel)
              </legend>
              <button
                type="button"
                onClick={handleAddArret}
                className="btn btn-ghost btn-xs gap-1"
              >
                <Plus size={14} />
                Ajouter un arrêt
              </button>
            </div>

            {arrets.length > 0 && (
              <div className="space-y-2">
                {arrets.map((arret, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered input-sm flex-1"
                      placeholder="Nom de l'arrêt"
                      value={arret.nom}
                      onChange={(e) =>
                        handleArretChange(index, "nom", e.target.value)
                      }
                    />
                    <input
                      type="time"
                      className="input input-bordered input-sm w-32"
                      value={arret.heure}
                      onChange={(e) =>
                        handleArretChange(index, "heure", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArret(index)}
                      className="btn btn-ghost btn-sm btn-square text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

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
