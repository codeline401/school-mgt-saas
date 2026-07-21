import { useState, useMemo } from "react";
import { X, Calendar, Clock } from "lucide-react";
import {
  useCreateReservation,
  useUpdateReservation,
  type Reservation,
  type CreateReservationInput,
} from "../hooks/useReservations";
import { useSalles, type Salle } from "../hooks/useLocaux";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reservation?: Reservation | null;
  defaultSalleId?: string;
  defaultDateDebut?: Date;
}

const INITIAL_FORM: CreateReservationInput = {
  titre: "",
  description: "",
  dateDebut: "",
  dateFin: "",
  salleId: "",
};

const toLocalDateTimeInput = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export default function ReservationModal({
  isOpen,
  onClose,
  reservation,
  defaultSalleId,
  defaultDateDebut,
}: Props) {
  const initialFormValue = useMemo(() => {
    if (reservation) {
      return {
        titre: reservation.titre,
        description: reservation.description || "",
        dateDebut: toLocalDateTimeInput(new Date(reservation.dateDebut)),
        dateFin: toLocalDateTimeInput(new Date(reservation.dateFin)),
        salleId: reservation.salleId,
      };
    }

    const now = defaultDateDebut || new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    return {
      ...INITIAL_FORM,
      salleId: defaultSalleId || "",
      dateDebut: toLocalDateTimeInput(now),
      dateFin: toLocalDateTimeInput(oneHourLater),
    };
  }, [reservation, defaultSalleId, defaultDateDebut]);

  const [form, setForm] = useState<CreateReservationInput>(initialFormValue);

  const [prevDeps, setPrevDeps] = useState({
    isOpen,
    reservation,
    defaultSalleId,
    defaultDateDebut,
  });

  if (
    isOpen !== prevDeps.isOpen ||
    reservation !== prevDeps.reservation ||
    defaultSalleId !== prevDeps.defaultSalleId ||
    defaultDateDebut !== prevDeps.defaultDateDebut
  ) {
    setPrevDeps({ isOpen, reservation, defaultSalleId, defaultDateDebut });
    if (isOpen) {
      setForm(initialFormValue);
    }
  }

  const { data: salles = [] } = useSalles();
  const createMutation = useCreateReservation();
  const updateMutation = useUpdateReservation();

  const isEdit = !!reservation;
  const title = isEdit ? "Modifier la réservation" : "Nouvelle réservation";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDescription = form.description?.trim();
    const input: CreateReservationInput = {
      titre: form.titre.trim(),
      description: trimmedDescription || undefined,
      dateDebut: new Date(form.dateDebut).toISOString(),
      dateFin: new Date(form.dateFin).toISOString(),
      salleId: form.salleId,
    };

    if (isEdit && reservation) {
      await updateMutation.mutateAsync({ id: reservation.id, input });
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
  const selectedSalle = salles.find((s: Salle) => s.id === form.salleId);

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
          {/* Titre */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend required">Titre</legend>
            <input
              type="text"
              name="titre"
              value={form.titre}
              onChange={handleChange}
              className="input input-sm w-full"
              placeholder="Ex: Cours de mathématiques, Réunion..."
              required
              disabled={isPending}
            />
          </fieldset>

          {/* Description */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description (optionnel)</legend>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="textarea textarea-sm w-full"
              placeholder="Détails supplémentaires..."
              rows={3}
              disabled={isPending}
            />
          </fieldset>

          {/* Salle */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend required">Salle</legend>
            <select
              name="salleId"
              value={form.salleId}
              onChange={handleChange}
              className="select select-sm w-full"
              required
              disabled={isPending}
            >
              <option value="">Sélectionnez une salle</option>
              {salles
                .filter((s: Salle) => s.statut === "DISPONIBLE")
                .map((s: Salle) => (
                  <option key={s.id} value={s.id}>
                    {s.nom} {s.code ? `(${s.code})` : ""} - {s.batiment?.nom} -{" "}
                    {s.capacite} places
                  </option>
                ))}
            </select>
            {selectedSalle && (
              <p className="text-xs text-base-content/60 mt-1">
                Capacité: {selectedSalle.capacite} personnes
              </p>
            )}
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            {/* Date de début */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">
                <Calendar size={14} className="inline mr-1" />
                Date et heure de début
              </legend>
              <input
                type="datetime-local"
                name="dateDebut"
                value={form.dateDebut}
                onChange={handleChange}
                className="input input-sm w-full"
                required
                disabled={isPending}
              />
            </fieldset>

            {/* Date de fin */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend required">
                <Clock size={14} className="inline mr-1" />
                Date et heure de fin
              </legend>
              <input
                type="datetime-local"
                name="dateFin"
                value={form.dateFin}
                onChange={handleChange}
                className="input input-sm w-full"
                required
                disabled={isPending}
                min={form.dateDebut}
              />
            </fieldset>
          </div>

          {/* Info */}
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-sm">
              Votre réservation sera soumise à validation par un administrateur.
            </span>
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
              disabled={
                isPending ||
                !form.titre.trim() ||
                !form.salleId ||
                !form.dateDebut ||
                !form.dateFin
              }
            >
              {isPending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : isEdit ? (
                "Modifier"
              ) : (
                "Réserver"
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
