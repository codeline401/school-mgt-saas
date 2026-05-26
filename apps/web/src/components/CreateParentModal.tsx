import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../lib/api";
import type { Parent } from "@school-mgt/types";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** ID de l'élève auquel le parent sera automatiquement lié */
  eleveId: string;
  /** Nom complet de l'élève, affiché dans le titre */
  eleveNom: string;
}

type CreateParentForm = {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
};

const EMPTY: CreateParentForm = {
  nom: "",
  prenom: "",
  telephone: "",
  email: "",
  adresse: "",
};

export default function CreateParentModal({
  isOpen,
  onClose,
  eleveId,
  eleveNom,
}: Props) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateParentForm>(EMPTY);

  // Ouvre / ferme le dialog natif et réinitialise le formulaire
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async (f: CreateParentForm) => {
      const body: Record<string, unknown> = {
        nom: f.nom.trim(),
        prenom: f.prenom.trim(),
        eleveId,
      };
      if (f.telephone.trim()) body.telephone = f.telephone.trim();
      if (f.email.trim()) body.email = f.email.trim();
      if (f.adresse.trim()) body.adresse = f.adresse.trim();

      const { data } = await api.post<Parent>("/api/profils/parents", body);
      return data;
    },
    onSuccess: () => {
      // Rafraîchit la fiche élève pour afficher le nouveau parent
      queryClient.invalidateQueries({ queryKey: ["eleve", eleveId] });
      toast.success("Parent créé et lié à l'élève !");
      onClose();
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la création du parent."));
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <dialog
      ref={modalRef}
      className="modal"
      onCancel={(e) => {
        if (mutation.isPending) e.preventDefault();
      }}
      onClose={() => {
        if (mutation.isPending) {
          modalRef.current?.showModal();
          return;
        }
        setForm(EMPTY);
        onClose();
      }}
    >
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-1">Créer un parent responsable</h3>
        <p className="text-base-content/60 text-sm mb-4">
          Le parent sera automatiquement lié à <strong>{eleveNom}</strong>.
        </p>

        {mutation.isError && (
          <div role="alert" className="alert alert-error alert-soft mb-4">
            <span>
              {getApiError(mutation.error, "Erreur lors de la création.")}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom *</legend>
              <input
                type="text"
                className="input w-full"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                minLength={2}
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Prénom *</legend>
              <input
                type="text"
                className="input w-full"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                required
                minLength={2}
              />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Téléphone</legend>
            <input
              type="tel"
              className="input w-full"
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input
              type="email"
              className="input w-full"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Adresse</legend>
            <input
              type="text"
              className="input w-full"
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
            />
          </fieldset>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Créer le parent"
              )}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}
