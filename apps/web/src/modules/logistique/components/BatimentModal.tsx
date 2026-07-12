import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  useCreateBatiment,
  useUpdateBatiment,
  type Batiment,
  type CreateBatimentInput,
} from "../hooks/useLocaux";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  batiment?: Batiment | null;
}

const INITIAL_FORM: CreateBatimentInput = {
  nom: "",
  code: "",
  description: "",
  nbEtages: 1,
};

export default function BatimentModal({ isOpen, onClose, batiment }: Props) {
  const [form, setForm] = useState<CreateBatimentInput>(INITIAL_FORM);

  const createMutation = useCreateBatiment();
  const updateMutation = useUpdateBatiment();

  const isEdit = !!batiment;
  const title = isEdit ? "Modifier le bâtiment" : "Créer un nouveau bâtiment";

  useEffect(() => {
    if (isOpen && batiment) {
      setForm({
        nom: batiment.nom,
        code: batiment.code || "",
        description: batiment.description || "",
        nbEtages: batiment.nbEtages,
      });
    } else if (isOpen && !batiment) {
      setForm(INITIAL_FORM);
    }
  }, [isOpen, batiment]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "nbEtages" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      nom: form.nom.trim(),
      code: form.code?.trim() || undefined,
      description: form.description?.trim() || undefined,
      nbEtages: form.nbEtages,
    };

    if (isEdit && batiment) {
      await updateMutation.mutateAsync({
        id: batiment.id,
        input,
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

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
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
          {/* Nom du bâtiment */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend required">
              Nom du bâtiment
            </legend>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              className="input input-sm w-full"
              placeholder="Ex: Bâtiment A, Pavillon Sciences..."
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
              placeholder="Ex: BAT-A, SCI"
              maxLength={20}
              disabled={isPending}
            />
          </fieldset>

          {/* Description */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description (optionnelle)</legend>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="textarea textarea-sm w-full"
              placeholder="Description du bâtiment..."
              rows={3}
              maxLength={500}
              disabled={isPending}
            />
          </fieldset>

          {/* Nombre d'étages */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend required">
              Nombre d'étages
            </legend>
            <input
              type="number"
              name="nbEtages"
              value={form.nbEtages}
              onChange={handleChange}
              className="input input-sm w-full"
              min={1}
              max={100}
              required
              disabled={isPending}
            />
            <p className="text-xs text-base-content/60 mt-1">
              Les étages sont numérotés de 0 (RDC) à {(form.nbEtages || 1) - 1}
            </p>
          </fieldset>

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
              disabled={isPending || !form.nom.trim()}
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
