import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Edit2,
  Users,
  GraduationCap,
  Calendar,
  UserCheck,
  Loader2,
} from "lucide-react";
import { api, getApiError } from "../../lib/api";
import type { Classe } from "@school-mgt/types";
import ConfirmModal from "../ConfirmModal";
import toast from "react-hot-toast";

interface Props {
  classeId: string;
  classe: Classe;
  canEdit: boolean;
}

interface Professeur {
  id: string;
  nom: string;
  prenom: string;
}

/**
 * Onglet Vue générale — affiche les informations de la classe
 * et permet à l'ADMIN de la renommer, supprimer, ou désigner
 * le professeur principal.
 */
export default function VueGeneraleTab({ classeId, classe, canEdit }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDialogElement>(null);

  const [nom, setNom] = useState(classe.nom);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Query : profs de la classe ────────────────────────────────────────────
  const { data: profs = [], isLoading: profsLoading } = useQuery<Professeur[]>({
    queryKey: ["classe-profs", classeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/classes/${classeId}`);
      return data.profs ?? [];
    },
    enabled: canEdit,
  });

  // ── Mutation PUT /api/classes/:id ─────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (newNom: string) => {
      const { data } = await api.put(`/api/classes/${classeId}`, {
        nom: newNom,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classe", classeId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Classe mise à jour !");
      modalRef.current?.close();
    },
    onError: (err) =>
      toast.error(getApiError(err, "Erreur lors de la mise à jour")),
  });

  // ── Mutation PATCH /api/classes/:id/prof-principal ────────────────────────
  const setProfPrincipalMutation = useMutation({
    mutationFn: async (professeurPrincipalId: string | null) => {
      const { data } = await api.patch(
        `/api/classes/${classeId}/prof-principal`,
        { professeurPrincipalId },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classe", classeId] });
      toast.success("Professeur principal mis à jour.");
    },
    onError: (err) =>
      toast.error(getApiError(err, "Erreur lors de la mise à jour")),
  });

  // ── Mutation DELETE /api/classes/:id ──────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/classes/${classeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Classe supprimée");
      navigate("/classes");
    },
    onError: (err) => {
      setShowDeleteConfirm(false);
      toast.error(getApiError(err, "Impossible de supprimer cette classe"));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (nom.trim().length < 2) return;
    updateMutation.mutate(nom.trim());
  };

  // ID du prof principal actuel (depuis la classe)
  const currentProfPrincipalId = classe.professeurPrincipalId ?? null;

  return (
    <div className="space-y-4">
      {/* ── Carte infos ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body flex-row items-center gap-4">
            <Users size={28} className="text-primary" />
            <div>
              <p className="text-base-content/50 text-sm">Élèves</p>
              <p className="text-2xl font-bold">{classe._count?.eleves ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body flex-row items-center gap-4">
            <GraduationCap size={28} className="text-secondary" />
            <div>
              <p className="text-base-content/50 text-sm">Professeurs</p>
              <p className="text-2xl font-bold">{classe._count?.profs ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body flex-row items-center gap-4">
            <Calendar size={28} className="text-accent" />
            <div>
              <p className="text-base-content/50 text-sm">Nom</p>
              <p className="text-xl font-bold">{classe.nom}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Professeur principal ──────────────────────────────────────────── */}
      {canEdit && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body gap-3">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-primary" />
              <h3 className="font-semibold text-sm">Professeur principal</h3>
            </div>
            <p className="text-xs text-base-content/50">
              Le professeur principal apparaîtra comme signataire sur les
              bulletins PDF générés pour cette classe.
            </p>

            {profsLoading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : profs.length === 0 ? (
              <p className="text-xs text-base-content/40">
                Aucun professeur assigné à cette classe.
              </p>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  className="select select-sm max-w-xs"
                  value={currentProfPrincipalId ?? ""}
                  onChange={(e) =>
                    setProfPrincipalMutation.mutate(
                      e.target.value === "" ? null : e.target.value,
                    )
                  }
                  disabled={setProfPrincipalMutation.isPending}
                >
                  <option value="">— Aucun prof principal —</option>
                  {profs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
                </select>

                {setProfPrincipalMutation.isPending && (
                  <Loader2 size={14} className="animate-spin text-primary" />
                )}

                {currentProfPrincipalId && (
                  <span className="badge badge-success badge-sm gap-1">
                    <UserCheck size={10} />
                    {profs.find((p) => p.id === currentProfPrincipalId)
                      ? `${profs.find((p) => p.id === currentProfPrincipalId)!.prenom} ${profs.find((p) => p.id === currentProfPrincipalId)!.nom}`
                      : "Désigné"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Actions ADMIN ─────────────────────────────────────────────────── */}
      {canEdit && (
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm gap-2"
            onClick={() => {
              setNom(classe.nom);
              modalRef.current?.showModal();
            }}
          >
            <Edit2 size={14} /> Renommer
          </button>
          <button
            className="btn btn-error btn-outline btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Supprimer la classe
          </button>
        </div>
      )}

      {/* ── Modal renommer ────────────────────────────────────────────────── */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-sm">
          <h3 className="font-bold text-lg mb-4">Renommer la classe</h3>
          {updateMutation.isError && (
            <div role="alert" className="alert alert-error alert-soft mb-4">
              <span>{getApiError(updateMutation.error, "Erreur")}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nouveau nom</legend>
              <input
                type="text"
                className="input w-full"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                minLength={2}
                required
              />
            </fieldset>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  updateMutation.reset();
                  modalRef.current?.close();
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => updateMutation.reset()}>Fermer</button>
        </form>
      </dialog>

      {/* ── Modal confirmation suppression ───────────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer la classe"
        message={`Êtes-vous sûr de vouloir supprimer la classe "${classe.nom}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
