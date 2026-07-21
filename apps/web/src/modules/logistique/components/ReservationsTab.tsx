import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  Edit,
  Trash2,
} from "lucide-react";
import {
  useReservations,
  useApprouverReservation,
  useAnnulerReservation,
  useDeleteReservation,
  type Reservation,
} from "../hooks/useReservations";
import ReservationModal from "./ReservationModal";
import { useAuthStore } from "../../../store/authStore";
import ConfirmModal from "../../../components/ConfirmModal";

export default function ReservationsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<string>("");
  
  // États pour les modals de confirmation
  const [isAnnulerModalOpen, setIsAnnulerModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reservationToProcess, setReservationToProcess] = useState<string>("");

  const { user } = useAuthStore();
  const { data: reservations = [], isLoading } = useReservations(
    filtreStatut ? { statut: filtreStatut } : undefined,
  );

  const approuverMutation = useApprouverReservation();
  const annulerMutation = useAnnulerReservation();
  const deleteMutation = useDeleteReservation();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleApprouver = async (id: string) => {
    if (confirm("Approuver cette réservation ?")) {
      await approuverMutation.mutateAsync({
        id,
        input: { statut: "APPROUVEE" },
      });
    }
  };

  const handleRefuser = async (id: string) => {
    const motifRefus = prompt("Motif de refus (obligatoire) :");
    if (motifRefus && motifRefus.trim().length >= 10) {
      await approuverMutation.mutateAsync({
        id,
        input: { statut: "REFUSEE", motifRefus },
      });
    } else {
      alert("Le motif de refus doit contenir au moins 10 caractères.");
    }
  };

  const handleAnnuler = (id: string) => {
    setReservationToProcess(id);
    setIsAnnulerModalOpen(true);
  };

  const confirmAnnuler = async () => {
    await annulerMutation.mutateAsync(reservationToProcess);
    setIsAnnulerModalOpen(false);
    setReservationToProcess("");
  };

  const handleDelete = (id: string) => {
    setReservationToProcess(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    await deleteMutation.mutateAsync(reservationToProcess);
    setIsDeleteModalOpen(false);
    setReservationToProcess("");
  };

  const getStatutBadge = (statut: string) => {
    const badges = {
      EN_ATTENTE: {
        class: "badge-warning",
        icon: <AlertCircle size={12} />,
        text: "En attente",
      },
      APPROUVEE: {
        class: "badge-success",
        icon: <CheckCircle size={12} />,
        text: "Approuvée",
      },
      REFUSEE: {
        class: "badge-error",
        icon: <XCircle size={12} />,
        text: "Refusée",
      },
      ANNULEE: {
        class: "badge-ghost",
        icon: <Ban size={12} />,
        text: "Annulée",
      },
    };

    const badge = badges[statut as keyof typeof badges];
    return (
      <span className={`badge badge-sm gap-1 ${badge.class}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (debut: string, fin: string) => {
    const diff = new Date(fin).getTime() - new Date(debut).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Réservations de salles</h2>
          <p className="text-sm text-base-content/60">
            Gérez vos réservations de salles
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedReservation(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary btn-sm gap-2"
        >
          <Plus size={16} />
          Nouvelle réservation
        </button>
      </div>

      {/* Filtres */}
      <div className="card bg-base-200">
        <div className="card-body p-4">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm font-medium">Filtrer par statut:</span>
            {["", "EN_ATTENTE", "APPROUVEE", "REFUSEE", "ANNULEE"].map((s) => (
              <button
                key={s}
                onClick={() => setFiltreStatut(s)}
                className={`btn btn-xs ${
                  filtreStatut === s ? "btn-primary" : "btn-ghost"
                }`}
              >
                {s === "" ? "Tous" : getStatutBadge(s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des réservations */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center p-8 text-base-content/60">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune réservation pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow"
            >
              <div className="card-body p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Titre et statut */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg">{reservation.titre}</h3>
                      {getStatutBadge(reservation.statut)}
                    </div>

                    {/* Description */}
                    {reservation.description && (
                      <p className="text-sm text-base-content/70">
                        {reservation.description}
                      </p>
                    )}

                    {/* Infos */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-primary" />
                        <span>
                          {reservation.salle.nom} -{" "}
                          {reservation.salle.batiment.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-primary" />
                        <span>
                          {reservation.user.prenom} {reservation.user.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary" />
                        <span>
                          {formatDate(reservation.dateDebut)} -{" "}
                          {formatDate(reservation.dateFin)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-primary" />
                        <span>
                          {formatTime(reservation.dateDebut)} -{" "}
                          {formatTime(reservation.dateFin)} (
                          {formatDuration(
                            reservation.dateDebut,
                            reservation.dateFin,
                          )}
                          )
                        </span>
                      </div>
                    </div>

                    {/* Motif de refus */}
                    {reservation.statut === "REFUSEE" &&
                      reservation.motifRefus && (
                        <div className="alert alert-error py-2">
                          <XCircle size={16} />
                          <span className="text-sm">
                            Motif de refus: {reservation.motifRefus}
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {/* Actions admin pour réservations en attente */}
                    {isAdmin && reservation.statut === "EN_ATTENTE" && (
                      <>
                        <button
                          onClick={() => handleApprouver(reservation.id)}
                          className="btn btn-success btn-xs gap-1"
                          disabled={approuverMutation.isPending}
                        >
                          <CheckCircle size={14} />
                          Approuver
                        </button>
                        <button
                          onClick={() => handleRefuser(reservation.id)}
                          className="btn btn-error btn-xs gap-1"
                          disabled={approuverMutation.isPending}
                        >
                          <XCircle size={14} />
                          Refuser
                        </button>
                      </>
                    )}

                    {/* Actions pour l'utilisateur */}
                    {(reservation.userId === user?.id || isAdmin) &&
                      (reservation.statut === "EN_ATTENTE" ||
                        reservation.statut === "APPROUVEE") && (
                        <>
                          {reservation.statut === "EN_ATTENTE" && (
                            <button
                              onClick={() => handleEdit(reservation)}
                              className="btn btn-ghost btn-xs gap-1"
                            >
                              <Edit size={14} />
                              Modifier
                            </button>
                          )}
                          <button
                            onClick={() => handleAnnuler(reservation.id)}
                            className="btn btn-ghost btn-xs gap-1"
                            disabled={annulerMutation.isPending}
                          >
                            <Ban size={14} />
                            Annuler
                          </button>
                        </>
                      )}

                    {/* Supprimer (admin uniquement) */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(reservation.id)}
                        className="btn btn-ghost btn-xs gap-1 text-error"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation}
      />

      {/* Modal d'annulation */}
      <ConfirmModal
        isOpen={isAnnulerModalOpen}
        title="Annuler la réservation"
        message="Êtes-vous sûr de vouloir annuler cette réservation ?"
        confirmLabel="Oui, annuler"
        cancelLabel="Non, garder"
        isLoading={annulerMutation.isPending}
        onConfirm={confirmAnnuler}
        onCancel={() => {
          setIsAnnulerModalOpen(false);
          setReservationToProcess("");
        }}
      />

      {/* Modal de suppression */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Supprimer la réservation"
        message="Êtes-vous sûr de vouloir supprimer définitivement cette réservation ? Cette action est irréversible."
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setReservationToProcess("");
        }}
      />
    </div>
  );
}
