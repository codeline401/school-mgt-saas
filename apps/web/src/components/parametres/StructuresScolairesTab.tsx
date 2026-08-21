import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { Niveau, Option, Section } from "@school-mgt/types";

interface CreateNiveauPayload {
  nom: string;
  ordre?: number;
}

interface CreateSectionPayload {
  nom: string;
  niveauId: string;
}

interface CreateOptionPayload {
  nom: string;
}

export default function StructuresScolairesTab() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [niveauNom, setNiveauNom] = useState("");
  const [niveauOrdre, setNiveauOrdre] = useState("0");
  const [sectionNom, setSectionNom] = useState("");
  const [sectionNiveauId, setSectionNiveauId] = useState("");
  const [optionNom, setOptionNom] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "niveaux" | "sections" | "options";
    id: string;
  } | null>(null);

  const niveauxQuery = useQuery<Niveau[]>({
    queryKey: ["niveaux"],
    queryFn: async () => (await api.get("/api/classes/niveaux")).data,
    enabled: canEdit,
  });
  const sectionsQuery = useQuery<Section[]>({
    queryKey: ["sections"],
    queryFn: async () => (await api.get("/api/classes/sections")).data,
    enabled: canEdit,
  });
  const optionsQuery = useQuery<Option[]>({
    queryKey: ["options"],
    queryFn: async () => (await api.get("/api/classes/options")).data,
    enabled: canEdit,
  });

  const createNiveauMutation = useMutation({
    mutationFn: async (payload: CreateNiveauPayload) =>
      (await api.post<Niveau>("/api/classes/niveaux", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["niveaux"] });
      setNiveauNom("");
      setNiveauOrdre("0");
      toast.success("Niveau créé avec succès.");
    },
    onError: (error) =>
      toast.error(getApiError(error, "Erreur lors de la création du niveau.")),
  });

  const createSectionMutation = useMutation({
    mutationFn: async (payload: CreateSectionPayload) =>
      (await api.post<Section>("/api/classes/sections", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      setSectionNom("");
      toast.success("Section créée avec succès.");
    },
    onError: (error) =>
      toast.error(
        getApiError(error, "Erreur lors de la création de la section."),
      ),
  });

  const createOptionMutation = useMutation({
    mutationFn: async (payload: CreateOptionPayload) =>
      (await api.post<Option>("/api/classes/options", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] });
      setOptionNom("");
      toast.success("Option créée avec succès.");
    },
    onError: (error) =>
      toast.error(
        getApiError(error, "Erreur lors de la création de l'option."),
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: async (target: NonNullable<typeof deleteTarget>) => {
      await api.delete(`/api/classes/${target.type}/${target.id}`);
    },
    onSuccess: (_data, target) => {
      queryClient.invalidateQueries({ queryKey: [target.type] });
      setDeleteTarget(null);
      toast.success("Élément supprimé.");
    },
    onError: (error) => {
      setDeleteTarget(null);
      toast.error(getApiError(error, "Impossible de supprimer cet élément."));
    },
  });

  function confirmDelete(type: "niveaux" | "sections" | "options", id: string) {
    setDeleteTarget({ type, id });
  }

  if (!canEdit) {
    return (
      <div className="text-center py-16 text-base-content/40 text-sm">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  const isLoading =
    niveauxQuery.isLoading || sectionsQuery.isLoading || optionsQuery.isLoading;
  const isError =
    niveauxQuery.isError || sectionsQuery.isError || optionsQuery.isError;
  const niveaux = niveauxQuery.data ?? [];
  const sections = sectionsQuery.data ?? [];
  const options = optionsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-primary" />
          <h2 className="font-semibold text-base">Structures scolaires</h2>
        </div>
        <p className="text-sm text-base-content/60 mt-1">
          Créez les niveaux, sections et options avant de créer vos classes.
        </p>
      </div>

      {isError && (
        <div className="alert alert-error text-sm">
          <AlertCircle size={15} />
          Impossible de charger la structure scolaire.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-sm" />
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-4 items-start">
          <StructureCard
            title="Niveaux"
            icon={<GraduationCap size={17} className="text-primary" />}
            inputLabel="Nom du niveau"
            placeholder="Ex : 6ème, Terminale"
            value={niveauNom}
            onChange={setNiveauNom}
            onSubmit={() => {
              if (!niveauNom.trim()) return;
              createNiveauMutation.mutate({
                nom: niveauNom.trim(),
                ordre: Number(niveauOrdre) || 0,
              });
            }}
            isPending={createNiveauMutation.isPending}
          >
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Ordre</legend>
              <input
                type="number"
                className="input input-sm w-full"
                min="0"
                value={niveauOrdre}
                onChange={(event) => setNiveauOrdre(event.target.value)}
              />
            </fieldset>
            <StructureList
              emptyLabel="Aucun niveau créé."
              items={niveaux.map((niveau) => ({
                id: niveau.id,
                label: niveau.nom,
              }))}
              deleteTarget={deleteTarget}
              type="niveaux"
              onDelete={confirmDelete}
              onConfirmDelete={(id) =>
                deleteMutation.mutate({ type: "niveaux", id })
              }
              onCancelDelete={() => setDeleteTarget(null)}
              isDeleting={deleteMutation.isPending}
            />
          </StructureCard>

          <StructureCard
            title="Sections"
            icon={<BookOpen size={17} className="text-secondary" />}
            inputLabel="Nom de la section"
            placeholder="Ex : A, Scientifique"
            value={sectionNom}
            onChange={setSectionNom}
            onSubmit={() => {
              if (!sectionNom.trim()) return;
              if (!sectionNiveauId) {
                toast.error("Sélectionnez un niveau pour cette section.");
                return;
              }
              createSectionMutation.mutate({
                nom: sectionNom.trim(),
                niveauId: sectionNiveauId,
              });
            }}
            isPending={createSectionMutation.isPending}
          >
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Niveau associé</legend>
              <select
                className="select select-sm w-full"
                value={sectionNiveauId}
                onChange={(event) => setSectionNiveauId(event.target.value)}
              >
                <option value="">Sélectionnez un niveau</option>
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.nom}
                  </option>
                ))}
              </select>
            </fieldset>
            <StructureList
              emptyLabel="Aucune section créée."
              items={sections.map((section) => ({
                id: section.id,
                label: section.nom,
                detail: niveaux.find((niveau) => niveau.id === section.niveauId)
                  ?.nom,
              }))}
              deleteTarget={deleteTarget}
              type="sections"
              onDelete={confirmDelete}
              onConfirmDelete={(id) =>
                deleteMutation.mutate({ type: "sections", id })
              }
              onCancelDelete={() => setDeleteTarget(null)}
              isDeleting={deleteMutation.isPending}
            />
          </StructureCard>

          <StructureCard
            title="Options"
            icon={<BookOpen size={17} className="text-accent" />}
            inputLabel="Nom de l'option"
            placeholder="Ex : Informatique, Musique"
            value={optionNom}
            onChange={setOptionNom}
            onSubmit={() => {
              if (!optionNom.trim()) return;
              createOptionMutation.mutate({ nom: optionNom.trim() });
            }}
            isPending={createOptionMutation.isPending}
          >
            <StructureList
              emptyLabel="Aucune option créée."
              items={options.map((option) => ({
                id: option.id,
                label: option.nom,
              }))}
              deleteTarget={deleteTarget}
              type="options"
              onDelete={confirmDelete}
              onConfirmDelete={(id) =>
                deleteMutation.mutate({ type: "options", id })
              }
              onCancelDelete={() => setDeleteTarget(null)}
              isDeleting={deleteMutation.isPending}
            />
          </StructureCard>
        </div>
      )}
    </div>
  );
}

interface StructureCardProps {
  title: string;
  icon: React.ReactNode;
  inputLabel: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  children: React.ReactNode;
}

function StructureCard({
  title,
  icon,
  inputLabel,
  placeholder,
  value,
  onChange,
  onSubmit,
  isPending,
  children,
}: StructureCardProps) {
  return (
    <section className="card card-border bg-base-100">
      <div className="card-body gap-4">
        <h3 className="card-title text-sm flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{inputLabel}</legend>
          <input
            className="input input-sm w-full"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
        </fieldset>
        {children}
        <button
          className="btn btn-primary btn-sm"
          disabled={!value.trim() || isPending}
          onClick={onSubmit}
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Créer {title.toLowerCase().replace(/s$/, "")}
        </button>
      </div>
    </section>
  );
}

interface StructureListProps {
  emptyLabel: string;
  items: Array<{ id: string; label: string; detail?: string }>;
  deleteTarget: { type: "niveaux" | "sections" | "options"; id: string } | null;
  type: "niveaux" | "sections" | "options";
  onDelete: (type: "niveaux" | "sections" | "options", id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  isDeleting: boolean;
}

function StructureList({
  emptyLabel,
  items,
  deleteTarget,
  type,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  isDeleting,
}: StructureListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-base-content/40">{emptyLabel}</p>;
  }

  return (
    <div className="divide-y divide-base-200 border-y border-base-200">
      {items.map((item) => (
        <div
          key={item.id}
          className="py-2 flex items-center justify-between gap-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{item.label}</p>
            {item.detail && (
              <p className="text-xs text-base-content/50">{item.detail}</p>
            )}
          </div>
          {deleteTarget?.type === type && deleteTarget.id === item.id ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                className="btn btn-error btn-xs"
                disabled={isDeleting}
                onClick={() => onConfirmDelete(item.id)}
              >
                {isDeleting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  "Oui"
                )}
              </button>
              <button className="btn btn-ghost btn-xs" onClick={onCancelDelete}>
                Non
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-xs text-error shrink-0"
              title={`Supprimer ${item.label}`}
              onClick={() => onDelete(type, item.id)}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
