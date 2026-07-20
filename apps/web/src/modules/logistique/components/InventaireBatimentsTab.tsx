import { useState } from "react";
import {
  Building2,
  Search,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Users,
  Layers,
  Accessibility,
  CheckCircle2,
  Wrench,
  CalendarDays,
  AlertCircle,
  Loader2,
  School2,
} from "lucide-react";
import {
  useBatiments,
  useDeleteBatiment,
  useDeleteSalle,
  type Batiment,
  type Salle,
} from "../hooks/useLocaux";
import BatimentModal from "./BatimentModal";
import SalleModal from "./SalleModal";
import { useAuthStore } from "../../../store/authStore";

export default function InventaireBatimentsTab() {
  const user = useAuthStore((state) => state.user);
  const [expandedBatiments, setExpandedBatiments] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [batimentModalOpen, setBatimentModalOpen] = useState(false);
  const [salleModalOpen, setSalleModalOpen] = useState(false);
  const [editingBatiment, setEditingBatiment] = useState<Batiment | null>(null);
  const [editingSalle, setEditingSalle] = useState<Salle | null>(null);
  const [defaultBatimentId, setDefaultBatimentId] = useState<string>("");

  // Queries
  const { data: batiments = [], isLoading, isError } = useBatiments();
  const deleteBatimentMutation = useDeleteBatiment();
  const deleteSalleMutation = useDeleteSalle();

  const canWrite = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  // Gestion de l'expansion des bâtiments
  const toggleBatiment = (id: string) => {
    setExpandedBatiments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filtrage
  const filteredBatiments = batiments.filter((batiment) => {
    const searchLower = searchQuery.toLowerCase();
    const batimentMatch =
      batiment.nom.toLowerCase().includes(searchLower) ||
      (batiment.code && batiment.code.toLowerCase().includes(searchLower));

    const salleMatch = batiment.salles?.some(
      (salle) =>
        salle.nom.toLowerCase().includes(searchLower) ||
        (salle.code && salle.code.toLowerCase().includes(searchLower)),
    );

    return batimentMatch || salleMatch;
  });

  // Handlers
  const handleEditBatiment = (batiment: Batiment) => {
    setEditingBatiment(batiment);
    setBatimentModalOpen(true);
  };

  const handleAddSalle = (batimentId: string) => {
    setDefaultBatimentId(batimentId);
    setEditingSalle(null);
    setSalleModalOpen(true);
  };

  const handleEditSalle = (salle: Salle) => {
    setEditingSalle(salle);
    setSalleModalOpen(true);
  };

  const handleDeleteBatiment = async (batiment: Batiment) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer le bâtiment "${batiment.nom}" et toutes ses salles ?`,
      )
    ) {
      await deleteBatimentMutation.mutateAsync(batiment.id);
    }
  };

  const handleDeleteSalle = async (salle: Salle) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer la salle "${salle.nom}" ?`,
      )
    ) {
      await deleteSalleMutation.mutateAsync(salle.id);
    }
  };

  // Badges de statut
  const getStatutBadge = (statut: Salle["statut"]) => {
    switch (statut) {
      case "DISPONIBLE":
        return (
          <span className="badge badge-success badge-sm gap-1">
            <CheckCircle2 size={12} /> Disponible
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="badge badge-error badge-sm gap-1">
            <Wrench size={12} /> Maintenance
          </span>
        );
      case "RESERVEE":
        return (
          <span className="badge badge-warning badge-sm gap-1">
            <CalendarDays size={12} /> Réservée
          </span>
        );
    }
  };

  if (isError) {
    return (
      <div className="alert alert-error">
        <AlertCircle size={20} />
        <span>Erreur lors du chargement des bâtiments</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Barre de recherche et actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              />
              <input
                type="text"
                placeholder="Rechercher un bâtiment ou une salle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm input-bordered w-full pl-10"
              />
            </div>
          </div>

          {canWrite && (
            <button
              onClick={() => {
                setEditingBatiment(null);
                setBatimentModalOpen(true);
              }}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus size={16} />
              Nouveau bâtiment
            </button>
          )}
        </div>

        {/* Liste des bâtiments */}
        <div className="space-y-3">
          {filteredBatiments.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <Building2 size={48} className="mx-auto mb-4 opacity-20" />
              <p>Aucun bâtiment trouvé</p>
            </div>
          ) : (
            filteredBatiments.map((batiment) => {
              const isExpanded = expandedBatiments.has(batiment.id);
              const nbSalles = batiment.salles?.length || 0;

              return (
                <div
                  key={batiment.id}
                  className="card bg-base-100 shadow-sm border border-base-300"
                >
                  {/* En-tête du bâtiment */}
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleBatiment(batiment.id)}
                          className="btn btn-ghost btn-sm btn-square"
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>

                        <Building2
                          size={24}
                          className="text-primary shrink-0"
                        />

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base">
                              {batiment.nom}
                            </h3>
                            {batiment.code && (
                              <span className="badge badge-sm badge-ghost">
                                {batiment.code}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-base-content/60">
                            {nbSalles} salle{nbSalles > 1 ? "s" : ""} •{" "}
                            {batiment.nbEtages} étage
                            {batiment.nbEtages > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {canWrite && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddSalle(batiment.id)}
                            className="btn btn-ghost btn-sm gap-1"
                          >
                            <Plus size={16} />
                            Salle
                          </button>
                          <button
                            onClick={() => handleEditBatiment(batiment)}
                            className="btn btn-ghost btn-sm btn-square"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBatiment(batiment)}
                            className="btn btn-ghost btn-sm btn-square text-error"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {batiment.description && (
                      <p className="text-sm text-base-content/70 mt-2 pl-11">
                        {batiment.description}
                      </p>
                    )}

                    {/* Liste des salles */}
                    {isExpanded && nbSalles > 0 && (
                      <div className="mt-4 pl-11 space-y-2">
                        <div className="divider my-2"></div>
                        {batiment.salles!.map((salle) => (
                          <div
                            key={salle.id}
                            className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <DoorOpen
                                size={20}
                                className="text-base-content/60"
                              />

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">
                                    {salle.nom}
                                  </span>
                                  {salle.code && (
                                    <span className="text-xs text-base-content/50">
                                      {salle.code}
                                    </span>
                                  )}
                                  {getStatutBadge(salle.statut)}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-base-content/60">
                                  <span className="flex items-center gap-1">
                                    <Layers size={12} />
                                    Étage {salle.etage}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users size={12} />
                                    {salle.capacite} places
                                  </span>
                                  {salle.pmrAccessible && (
                                    <span className="flex items-center gap-1">
                                      <Accessibility size={12} />
                                      PMR
                                    </span>
                                  )}
                                  {salle.classe && (
                                    <span className="flex items-center gap-3">
                                      <School2 size={12} />
                                      {salle.classe.nom}
                                    </span>
                                  )}
                                  <span className="badge badge-xs">
                                    {salle.type.replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {canWrite && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditSalle(salle)}
                                  className="btn btn-ghost btn-xs btn-square"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSalle(salle)}
                                  className="btn btn-ghost btn-xs btn-square text-error"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {isExpanded && nbSalles === 0 && (
                      <div className="mt-4 pl-11 text-center py-6 text-base-content/40 text-sm">
                        <DoorOpen
                          size={32}
                          className="mx-auto mb-2 opacity-20"
                        />
                        Aucune salle dans ce bâtiment
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <BatimentModal
        isOpen={batimentModalOpen}
        onClose={() => {
          setBatimentModalOpen(false);
          setEditingBatiment(null);
        }}
        batiment={editingBatiment}
      />

      <SalleModal
        isOpen={salleModalOpen}
        onClose={() => {
          setSalleModalOpen(false);
          setEditingSalle(null);
          setDefaultBatimentId("");
        }}
        salle={editingSalle}
        defaultBatimentId={defaultBatimentId}
      />
    </>
  );
}
