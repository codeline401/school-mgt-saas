import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { Classe } from "@school-mgt/types";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
type CreateEleveForm = {
  nom: string;
  prenom: string;
  classeId: string;
};

const EMPTY_FORM: CreateEleveForm = { nom: "", prenom: "", classeId: "" };

// ─── Props ───────────────────────────────────────────────────────────────────
interface CreateEleveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CreateEleveModal({
  isOpen,
  onClose,
}: CreateEleveModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState<CreateEleveForm>(EMPTY_FORM);

  // ── Ouvre / ferme le dialog natif en sync avec isOpen ────────────────────
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  // ── Chargement des classes disponibles ───────────────────────────────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
    enabled: isOpen,
  });

  // ── Mutation POST /api/eleves ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (f: CreateEleveForm) => {
      const { data } = await api.post("/api/eleves", {
        ...f,
        schoolId: user?.schoolId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      toast.success("Élève créé avec succès !");
      onClose();
    },
    onError: (err) => {
      toast.error(getApiError(err, "Erreur lors de la création de l'élève."));
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
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
    if (createMutation.isPending) return; // empêche la fermeture pendant l'envoi
    createMutation.reset();
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <dialog ref={modalRef} className="modal" onClose={handleClose}>
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Ajouter un élève</h3>

        {/* Alerte erreur API */}
        {createMutation.isError && (
          <div role="alert" className="alert alert-error alert-soft mb-4">
            <span>
              {getApiError(createMutation.error, "Erreur lors de la création")}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
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

          {/* Prénom */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Prénom *</legend>
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

          {/* Classe */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Classe *</legend>
            <select
              className="select w-full"
              name="classeId"
              value={form.classeId}
              onChange={handleChange}
              required
            >
              <option value="">— Sélectionner une classe —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </fieldset>

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
                "Créer l'élève"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Fermeture en cliquant en dehors */}
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={handleClose}>
          Fermer
        </button>
      </form>
    </dialog>
  );
}
