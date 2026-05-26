import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { Classe } from "@school-mgt/types";
import toast from "react-hot-toast";
import PhotoUpload from "./PhotoUpload";

// ─── Types ───────────────────────────────────────────────────────────────────
type CreateEleveForm = {
  nom: string;
  prenom: string;
  classeId: string;
  dateNaissance: string;
  telephone: string;
  adresse: string;
  photoUrl: string;
};

const EMPTY_FORM: CreateEleveForm = {
  nom: "",
  prenom: "",
  classeId: "",
  dateNaissance: "",
  telephone: "",
  adresse: "",
  photoUrl: "",
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface CreateEleveModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClasseId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CreateEleveModal({
  isOpen,
  onClose,
  defaultClasseId,
}: CreateEleveModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState<CreateEleveForm>({
    ...EMPTY_FORM,
    classeId: defaultClasseId ?? "",
  });

  // ── Ouvre / ferme le dialog natif ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  // ── Chargement des classes disponibles ────────────────────────────────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: isOpen,
  });

  // ── Mutation POST /api/eleves ──────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (f: CreateEleveForm) => {
      const body: Record<string, unknown> = {
        nom: f.nom,
        prenom: f.prenom,
        classeId: f.classeId,
        schoolId: user?.schoolId,
      };
      if (f.dateNaissance) body.dateNaissance = f.dateNaissance;
      if (f.telephone.trim()) body.telephone = f.telephone.trim();
      if (f.adresse.trim()) body.adresse = f.adresse.trim();
      if (f.photoUrl.trim()) body.photoUrl = f.photoUrl.trim();

      const { data } = await api.post("/api/eleves", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      if (defaultClasseId) {
        queryClient.invalidateQueries({
          queryKey: ["classe-eleves", defaultClasseId],
        });
      }
      toast.success("Eleve cree avec succes !");
      setForm({ ...EMPTY_FORM, classeId: defaultClasseId ?? "" });
      onClose();
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la creation de l eleve."));
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    createMutation.reset();
    setForm({ ...EMPTY_FORM, classeId: defaultClasseId ?? "" });
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <dialog ref={modalRef} className="modal" onClose={handleClose}>
      <div className="modal-box w-11/12 max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Ajouter un eleve</h3>

        {createMutation.isError && (
          <div role="alert" className="alert alert-error alert-soft mb-4">
            <span>
              {getApiError(createMutation.error, "Erreur lors de la creation")}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom *</legend>
              <input
                type="text"
                className="input w-full"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                placeholder="Ex : Randria"
                minLength={2}
                required
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Prenom *</legend>
              <input
                type="text"
                className="input w-full"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                placeholder="Ex : Jean Jacques"
                minLength={2}
                required
              />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Date de naissance</legend>
            <input
              type="date"
              className="input w-full"
              name="dateNaissance"
              value={form.dateNaissance}
              onChange={handleChange}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Classe *</legend>
            <select
              className="select w-full"
              name="classeId"
              value={form.classeId}
              onChange={handleChange}
              required
            >
              <option value="">Selectionner une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Telephone</legend>
              <input
                type="tel"
                className="input w-full"
                name="telephone"
                value={form.telephone}
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
          </div>

          <PhotoUpload
            value={form.photoUrl}
            onChange={(url) => setForm((prev) => ({ ...prev, photoUrl: url }))}
          />

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
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
                "Creer l eleve"
              )}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={handleClose}>
          Fermer
        </button>
      </form>
    </dialog>
  );
}
