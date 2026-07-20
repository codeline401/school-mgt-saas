import { useState, useMemo } from "react";
import { X } from "lucide-react";
import {
  useCreateSalle,
  useUpdateSalle,
  useBatiments,
  useClasses,
  type Salle,
  type CreateSalleInput,
} from "../hooks/useLocaux";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  salle?: Salle | null;
  defaultBatimentId?: string;
}

const INITIAL_FORM: CreateSalleInput = {
  nom: "",
  code: "",
  type: "COURS",
  etage: 0,
  capacite: 30,
  pmrAccessible: true,
  equipements: {},
  statut: "DISPONIBLE",
  batimentId: "",
  classeId: undefined,
};

export default function SalleModal({
  isOpen,
  onClose,
  salle,
  defaultBatimentId,
}: Props) {
  // Calculer la valeur du formulaire basée sur les props
  const initialFormValue = useMemo(
    () =>
      salle
        ? {
            nom: salle.nom,
            code: salle.code || "",
            type: salle.type,
            etage: salle.etage,
            capacite: salle.capacite,
            pmrAccessible: salle.pmrAccessible,
            equipements: salle.equipements || {},
            statut: salle.statut,
            batimentId: salle.batimentId,
            classeId: salle.classeId || undefined,
          }
        : {
            ...INITIAL_FORM,
            batimentId: defaultBatimentId || "",
          },
    [salle, defaultBatimentId],
  );

  const [form, setForm] = useState<CreateSalleInput>(initialFormValue);

  // Suivre les dépendances précédentes pour synchroniser pendant le rendu
  const [prevDeps, setPrevDeps] = useState({
    isOpen,
    salle,
    defaultBatimentId,
  });

  // Synchronisation pendant la phase de rendu
  if (
    isOpen !== prevDeps.isOpen ||
    salle !== prevDeps.salle ||
    defaultBatimentId !== prevDeps.defaultBatimentId
  ) {
    setPrevDeps({ isOpen, salle, defaultBatimentId });
    if (isOpen) {
      setForm(initialFormValue);
    }
  }

  const { data: batiments = [] } = useBatiments();
  const { data: classes = [] } = useClasses();
  const createMutation = useCreateSalle();
  const updateMutation = useUpdateSalle();

  const isEdit = !!salle;
  const title = isEdit ? "Modifier la salle" : "Créer une nouvelle salle";

  // Initialiser le formulaire quand le modal s'ouvre

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "capacite" || name === "etage") {
      setForm((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (name === "classeId") {
      setForm((prev) => ({ ...prev, classeId: value || undefined }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input: CreateSalleInput = {
      nom: form.nom.trim(),
      code: form.code?.trim() || undefined,
      type: form.type,
      etage: form.etage,
      capacite: form.capacite,
      pmrAccessible: form.pmrAccessible,
      equipements: form.equipements,
      statut: form.statut,
      batimentId: form.batimentId,
      classeId: form.classeId || undefined,
    };

    if (isEdit && salle) {
      await updateMutation.mutateAsync({
        id: salle.id,
        input: {
          ...input,
          classeId: form.classeId || null,
        },
      });
    } else {
      await createMutation.mutateAsync(input);
    }

    handleClose();
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    onClose();
  };

  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedBatiment = batiments.find((b) => b.id === form.batimentId);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={isPending}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Nom de la salle */}
            <fieldset className="fieldset col-span-2">
              <legend className="fieldset-legend required">
                Nom de la salle
              </legend>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                className="input input-sm w-full"
                placeholder="Ex: Salle 204, Labo Chimie..."
                required
                disabled={isPending}
              />
            </fieldset>

            {/* Code */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Code (optionnel)</legend>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className="input input-sm w-full"
                placeholder="Ex: S-204"
                maxLength={20}
                disabled={isPending}
              />
            </fieldset>

            {/* Type de salle */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Type</legend>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="select select-sm w-full"
                required
                disabled={isPending}
              >
                <option value="COURS">Salle de cours</option>
                <option value="LABO_SCIENCE">Laboratoire Science</option>
                <option value="INFORMATIQUE">Salle Informatique</option>
                <option value="AMPHI">Amphithéâtre</option>
                <option value="REUNION">Salle de réunion</option>
                <option value="SPORT">Infrastructures Sportives</option>
                <option value="ADMINISTRATIF">Bureaux administratifs</option>
                <option value="AUTRE">Autre</option>
              </select>
            </fieldset>

            {/* Bâtiment */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Bâtiment</legend>
              <select
                name="batimentId"
                value={form.batimentId}
                onChange={handleChange}
                className="select select-sm w-full"
                required
                disabled={isPending}
              >
                <option value="">Sélectionnez un bâtiment</option>
                {batiments.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom} {b.code ? `(${b.code})` : ""}
                  </option>
                ))}
              </select>
            </fieldset>

            {/* Étage */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Étage</legend>
              <input
                type="number"
                name="etage"
                value={form.etage}
                onChange={handleChange}
                className="input input-sm w-full"
                min={0}
                max={selectedBatiment ? selectedBatiment.nbEtages - 1 : 100}
                required
                disabled={isPending}
              />
              {selectedBatiment && (
                <p className="text-xs text-base-content/60 mt-1">
                  Max: étage {selectedBatiment.nbEtages - 1}
                </p>
              )}
            </fieldset>

            {/* Capacité */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Capacité</legend>
              <input
                type="number"
                name="capacite"
                value={form.capacite}
                onChange={handleChange}
                className="input input-sm w-full"
                min={1}
                max={1000}
                required
                disabled={isPending}
              />
            </fieldset>

            {/* Statut */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">Statut</legend>
              <select
                name="statut"
                value={form.statut}
                onChange={handleChange}
                className="select select-sm w-full"
                required
                disabled={isPending}
              >
                <option value="DISPONIBLE">Disponible</option>
                <option value="MAINTENANCE">En maintenance</option>
                <option value="RESERVEE">Réservée</option>
              </select>
            </fieldset>

            {/* Classe assignée (optionnel) */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Classe assignée (optionnel)
              </legend>
              <select
                name="classeId"
                value={form.classeId || ""}
                onChange={handleChange}
                className="select select-sm w-full"
                disabled={isPending}
              >
                <option value="">Aucune classe spécifique</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>

          {/* PMR Accessible */}
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                name="pmrAccessible"
                checked={form.pmrAccessible}
                onChange={handleChange}
                className="checkbox checkbox-sm"
                disabled={isPending}
              />
              <span className="label-text">Accessible PMR</span>
            </label>
          </div>

          {/* Boutons d'action */}
          <div className="modal-action">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost btn-sm"
              disabled={isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isPending || !form.nom.trim() || !form.batimentId}
            >
              {isPending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : isEdit ? (
                "Modifier"
              ) : (
                "Créer"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
