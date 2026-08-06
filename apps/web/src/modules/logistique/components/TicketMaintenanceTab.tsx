import { useState } from "react";
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  useTickets,
  useDeleteTicket,
  type TicketMaintenance,
  type StatutTicket,
  type PrioriteTicket,
  type TypeTicket,
} from "../hooks/useMaintenance";
import TicketMaintenanceModal from "./TicketMaintenanceModal";
import ConfirmModal from "../../../components/ConfirmModal";

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

const TYPE_LABELS: Record<TypeTicket, string> = {
  EQUIPEMENT: "Équipement",
  BATIMENT: "Bâtiment",
  SALLE: "Salle",
  RESEAU: "Réseau",
  PLOMBERIE: "Plomberie",
  ELECTRICITE: "Électricité",
  MOBILIER: "Mobilier",
  AUTRE: "Autre",
};

export default function TicketsMaintenanceTab() {
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutTicket | "">("");
  const [prioriteFilter, setPrioriteFilter] = useState<PrioriteTicket | "">("");

  const [selectedTicket, setSelectedTicket] =
    useState<TicketMaintenance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const { data: tickets = [], isLoading } = useTickets({
    search: search || undefined,
    statut: statutFilter || undefined,
    priorite: prioriteFilter || undefined,
  });

  const deleteMutation = useDeleteTicket();

  const handleEdit = (ticket: TicketMaintenance) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!ticketToDelete) return;
    try {
      await deleteMutation.mutateAsync(ticketToDelete);
      setTicketToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du ticket:", error);
    }
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
    setIsModalOpen(false);
  };

  const getStatutIcon = (statut: StatutTicket) => {
    switch (statut) {
      case "OUVERT":
        return <AlertTriangle size={16} className="text-error" />;
      case "EN_COURS":
        return <Clock size={16} className="text-warning" />;
      case "RESOLU":
        return <CheckCircle2 size={16} className="text-success" />;
      case "FERME":
      case "ANNULE":
        return <XCircle size={16} className="text-base-content/40" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="form-control flex-1">
          <div className="input-group">
            <span className="bg-base-200">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Rechercher un ticket..."
              className="input input-bordered flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <select
          className="select select-bordered w-full md:w-48"
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as StatutTicket | "")}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="select select-bordered w-full md:w-48"
          value={prioriteFilter}
          onChange={(e) =>
            setPrioriteFilter(e.target.value as PrioriteTicket | "")
          }
        >
          <option value="">Toutes les priorités</option>
          {Object.entries(PRIORITE_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des tickets */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Localisation</th>
                <th>Créé par</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <AlertTriangle
                      size={36}
                      className="mx-auto mb-3 text-base-content/30"
                    />
                    <p className="text-base-content/50">
                      {search || statutFilter || prioriteFilter
                        ? "Aucun ticket trouvé avec ces critères"
                        : "Aucun ticket de maintenance"}
                    </p>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover">
                    <td>
                      <div className="flex items-center gap-2">
                        {getStatutIcon(ticket.statut)}
                        <span className="font-medium">{ticket.titre}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">
                        {TYPE_LABELS[ticket.type]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${PRIORITE_LABELS[ticket.priorite].color}`}
                      >
                        {PRIORITE_LABELS[ticket.priorite].label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${STATUT_LABELS[ticket.statut].color}`}
                      >
                        {STATUT_LABELS[ticket.statut].label}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-base-content/60">
                        {ticket.localisationNom || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {ticket.creePar.nom} {ticket.creePar.prenom}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-base-content/60">
                        {new Date(ticket.dateOuverture).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(ticket)}
                          className="btn btn-ghost btn-xs"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setTicketToDelete(ticket.id)}
                          className="btn btn-ghost btn-xs text-error"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <TicketMaintenanceModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
        />
      )}

      {ticketToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer le ticket"
          message="Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible."
          onConfirm={handleDelete}
          onCancel={() => setTicketToDelete(null)}
          isLoading={deleteMutation.isPending}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
        />
      )}
    </div>
  );
}
