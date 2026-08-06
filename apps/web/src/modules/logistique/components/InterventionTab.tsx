import { useState } from "react";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  WrenchIcon,
} from "lucide-react";
import {
  useTickets,
  useInterventions,
  type TicketMaintenance,
  type StatutTicket,
  type PrioriteTicket,
} from "../hooks/useMaintenance";
import InterventionModal from "./InterventionModal";
import TicketMaintenanceModal from "./TicketMaintenanceModal";

const STATUT_LABELS: Record<StatutTicket, { label: string; color: string }> = {
  OUVERT: { label: "Ouvert", color: "badge-error" },
  EN_COURS: { label: "En cours", color: "badge-warning" },
  RESOLU: { label: "Résolu", color: "badge-success" },
  FERME: { label: "Fermé", color: "badge-ghost" },
  ANNULE: { label: "Annulé", color: "badge-ghost" },
};

const PRIORITE_LABELS: Record<
  PrioriteTicket,
  { label: string; color: string }
> = {
  BASSE: { label: "Basse", color: "badge-info" },
  NORMALE: { label: "Normale", color: "badge-success" },
  HAUTE: { label: "Haute", color: "badge-warning" },
  URGENTE: { label: "Urgente", color: "badge-error" },
};

export default function InterventionsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(
    new Set(),
  );

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<TicketMaintenance | null>(
    null,
  );

  const { data: tickets = [], isLoading: isLoadingTickets } = useTickets();
  const { data: allInterventions = [], isLoading: isLoadingInterventions } =
    useInterventions();

  const handleCreateIntervention = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTicketId(null);
    setIsModalOpen(false);
  };

  const handleEditTicket = (ticket: TicketMaintenance) => {
    setTicketToEdit(ticket);
    setIsTicketModalOpen(true);
  };

  const handleCloseTicketModal = () => {
    setTicketToEdit(null);
    setIsTicketModalOpen(false);
  };
  const toggleTicket = (ticketId: string) => {
    setExpandedTickets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const getTicketInterventions = (ticketId: string) => {
    return allInterventions.filter((i) => i.ticketId === ticketId);
  };

  const getStatutIcon = (statut: StatutTicket) => {
    switch (statut) {
      case "OUVERT":
        return <AlertTriangle size={16} className="text-error" />;
      case "EN_COURS":
        return <Clock size={16} className="text-warning" />;
      case "RESOLU":
        return <CheckCircle2 size={16} className="text-success" />;
      default:
        return null;
    }
  };

  const isLoading = isLoadingTickets || isLoadingInterventions;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="alert alert-info">
        <Wrench size={20} />
        <span>
          Sélectionnez un ticket pour créer ou consulter ses interventions.
        </span>
      </div>

      {/* Liste des tickets */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body text-center py-12">
              <AlertTriangle
                size={36}
                className="mx-auto mb-3 text-base-content/30"
              />
              <p className="text-base-content/50">
                Aucun ticket de maintenance créé
              </p>
            </div>
          </div>
        ) : (
          tickets.map((ticket) => {
            const interventions = getTicketInterventions(ticket.id);
            const isExpanded = expandedTickets.has(ticket.id);

            return (
              <div
                key={ticket.id}
                className="card bg-base-100 shadow-sm border border-base-200"
              >
                <div className="card-body p-4">
                  {/* Header du ticket */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatutIcon(ticket.statut)}
                        <h3 className="font-bold text-base">{ticket.titre}</h3>
                        <span
                          className={`badge badge-sm ${PRIORITE_LABELS[ticket.priorite].color}`}
                        >
                          {PRIORITE_LABELS[ticket.priorite].label}
                        </span>
                        <span
                          className={`badge badge-sm ${STATUT_LABELS[ticket.statut].color}`}
                        >
                          {STATUT_LABELS[ticket.statut].label}
                        </span>
                      </div>

                      {ticket.description && (
                        <p className="text-sm text-base-content/60 mb-2">
                          {ticket.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-base-content/50">
                        {ticket.localisationNom && (
                          <span>📍 {ticket.localisationNom}</span>
                        )}
                        <span>
                          Créé le{" "}
                          {new Date(ticket.dateOuverture).toLocaleDateString(
                            "fr-FR",
                          )}
                        </span>
                        <span>
                          {interventions.length} intervention
                          {interventions.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTicket(ticket)}
                        className="btn btn-primary btn-sm gap-2"
                        title="Modifier le ticket"
                      >
                        <Edit2 size={16} />
                        Modifier le ticket
                      </button>

                      <button
                        onClick={() => handleCreateIntervention(ticket.id)}
                        className="btn btn-success btn-sm gap-2"
                        title="Créer une intervention"
                      >
                        <WrenchIcon size={16} />
                        Nouvelle intervention
                      </button>

                      {interventions.length > 0 && (
                        <button
                          onClick={() => toggleTicket(ticket.id)}
                          className="btn btn-ghost btn-sm btn-square"
                          title={
                            isExpanded
                              ? "Masquer les interventions"
                              : "Voir les interventions"
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Liste des interventions (si expanded) */}
                  {isExpanded && interventions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-base-300">
                      <h4 className="font-semibold text-sm mb-3">
                        Interventions ({interventions.length})
                      </h4>
                      <div className="space-y-2">
                        {interventions.map((intervention) => (
                          <div
                            key={intervention.id}
                            className="bg-base-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {intervention.technicien.nom}{" "}
                                    {intervention.technicien.prenom}
                                  </span>
                                  <span
                                    className={`badge badge-xs ${
                                      intervention.statut === "TERMINEE"
                                        ? "badge-success"
                                        : intervention.statut === "EN_COURS"
                                          ? "badge-warning"
                                          : "badge-info"
                                    }`}
                                  >
                                    {intervention.statut === "TERMINEE"
                                      ? "Terminée"
                                      : intervention.statut === "EN_COURS"
                                        ? "En cours"
                                        : intervention.statut === "PLANIFIEE"
                                          ? "Planifiée"
                                          : "Annulée"}
                                  </span>
                                </div>

                                {intervention.description && (
                                  <p className="text-xs text-base-content/60 mb-2">
                                    {intervention.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-3 text-xs text-base-content/50">
                                  <span>
                                    Début:{" "}
                                    {new Date(
                                      intervention.dateDebut,
                                    ).toLocaleDateString("fr-FR")}
                                  </span>
                                  {intervention.dateFin && (
                                    <span>
                                      Fin:{" "}
                                      {new Date(
                                        intervention.dateFin,
                                      ).toLocaleDateString("fr-FR")}
                                    </span>
                                  )}
                                  {intervention.cout != null && (
                                    <span className="font-medium">
                                      Coût:{" "}
                                      {new Intl.NumberFormat("fr-MG", {
                                        style: "currency",
                                        currency: "MGA",
                                      }).format(Number(intervention.cout) || 0)}
                                    </span>
                                  )}
                                  {intervention.piecesUtilisees && (
                                    <span>
                                      Pièces: {intervention.piecesUtilisees}
                                    </span>
                                  )}
                                </div>

                                {intervention.observations && (
                                  <div className="mt-2 text-xs">
                                    <span className="font-medium">
                                      Observations:
                                    </span>{" "}
                                    {intervention.observations}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedTicketId && (
        <InterventionModal
          intervention={null}
          ticketId={selectedTicketId}
          onClose={handleCloseModal}
        />
      )}

      {isTicketModalOpen && (
        <TicketMaintenanceModal
          ticket={ticketToEdit}
          onClose={handleCloseTicketModal}
        />
      )}
    </div>
  );
}
