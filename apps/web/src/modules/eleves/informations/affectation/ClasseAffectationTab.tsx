import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  History,
  Loader2,
  School,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Classe } from "@school-mgt/types";
import { api, getApiError } from "../../../../lib/api";
import { useAuthStore } from "../../../../store/authStore";
import {
  ficheEleveKeys,
  useFicheEleve,
  useFichesEleves,
} from "../fiche/hooks/useFicheEleve";

const TYPE_OPTIONS = [
  { value: "INSCRIPTION", label: "Inscription initiale" },
  { value: "TRANSFERT", label: "Transfert" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "REDOUBLEMENT", label: "Redoublement" },
  { value: "RETRAIT", label: "Retrait de la classe" },
] as const;

type AffectationType = (typeof TYPE_OPTIONS)[number]["value"];

interface AffectationRecord {
  id: string;
  type: AffectationType;
  motif?: string | null;
  anneeScolaire: string;
  createdAt: string;
  ancienneClasse?: { id: string; nom: string } | null;
  nouvelleClasse?: { id: string; nom: string } | null;
  effectuePar?: { nom: string; prenom: string } | null;
}

interface Props {
  eleveId?: string;
}

function currentSchoolYear(): string {
  const date = new Date();
  const year =
    date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClasseAffectationTab({ eleveId }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";
  const {
    data: eleve,
    isLoading: isLoadingEleve,
    isError: isEleveError,
    error: eleveError,
  } = useFicheEleve(eleveId);
  const { data: allEleves = [], isLoading: isLoadingEleves } =
    useFichesEleves();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AffectationType>("INSCRIPTION");
  const [classeId, setClasseId] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState(currentSchoolYear());
  const [motif, setMotif] = useState("");

  const classesQuery = useQuery<Classe[]>({
    queryKey: ["classes", "affectation-eleve"],
    queryFn: async () => (await api.get<Classe[]>("/api/classes")).data,
    enabled: !!eleveId,
  });
  const historyQuery = useQuery<AffectationRecord[]>({
    queryKey: ["eleve-affectations", eleveId],
    queryFn: async () =>
      (
        await api.get<AffectationRecord[]>(
          `/api/eleves/${eleveId}/informations/affectations`,
        )
      ).data,
    enabled: !!eleveId,
  });

  const filteredEleves = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allEleves.slice(0, 12);
    return allEleves
      .filter((item) => {
        const fullName = `${item.nom} ${item.prenom}`.toLowerCase();
        return (
          fullName.includes(query) || String(item.matricule).includes(query)
        );
      })
      .slice(0, 12);
  }, [allEleves, search]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<AffectationRecord>(
        "/api/informations/affectations",
        {
          eleveId,
          nouvelleClasseId: type === "RETRAIT" ? null : classeId,
          type,
          anneeScolaire: anneeScolaire.trim(),
          motif: motif.trim() || undefined,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["eleve-affectations", eleveId],
      });
      queryClient.invalidateQueries({
        queryKey: ficheEleveKeys.detail(eleveId ?? ""),
      });
      queryClient.invalidateQueries({ queryKey: ficheEleveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setClasseId("");
      setMotif("");
      toast.success("Affectation enregistrée avec succès.");
    },
    onError: (error) => {
      toast.error(
        getApiError(error, "Impossible d'enregistrer l'affectation."),
      );
    },
  });

  if (!canEdit) {
    return (
      <div className="alert alert-warning">
        <span>
          Seuls les administrateurs peuvent modifier la classe d&apos;un élève.
        </span>
      </div>
    );
  }

  if (!eleveId) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <School size={19} className="text-primary" />
            Classe & affectation
          </h2>
          <p className="text-sm text-base-content/60 mt-1">
            Sélectionnez un élève pour consulter ou modifier son affectation.
          </p>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body gap-4">
            <input
              className="input input-bordered w-full"
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />
            {isLoadingEleves ? (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner loading-sm" />
              </div>
            ) : filteredEleves.length === 0 ? (
              <p className="text-sm text-base-content/50 py-4">
                Aucun élève trouvé.
              </p>
            ) : (
              <div className="divide-y divide-base-200 border-y border-base-200">
                {filteredEleves.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-base-200/60 px-2"
                    onClick={() => navigate(`/eleves/informations/${item.id}`)}
                  >
                    <span>
                      <span className="block font-medium">
                        {item.nom} {item.prenom}
                      </span>
                      <span className="block text-xs text-base-content/50">
                        Matricule : {item.matricule}
                      </span>
                    </span>
                    <span className="badge badge-ghost badge-sm">
                      {item.classe?.nom ?? "Sans classe"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingEleve) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (isEleveError || !eleve) {
    return (
      <div role="alert" className="alert alert-error">
        <span>
          {getApiError(
            eleveError,
            "Impossible de charger la fiche de l'élève.",
          )}
        </span>
      </div>
    );
  }

  const currentClasseId = eleve.classeId ?? null;
  const classes = classesQuery.data ?? [];
  const selectableClasses = classes.filter(
    (classe) => classe.id !== currentClasseId,
  );
  const isWithdrawal = type === "RETRAIT";
  const canSubmit =
    !!anneeScolaire.trim() &&
    (isWithdrawal || !!classeId) &&
    !mutation.isPending;

  function handleTypeChange(nextType: AffectationType) {
    setType(nextType);
    if (nextType === "RETRAIT") setClasseId("");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <School size={60} className="text-primary" />
            Classe & affectation
          </h2>
          <p className="text-sm text-base-content/60 mt-1">
            Gérez l&apos;inscription et les changements de classe de{" "}
            {eleve.prenom} {eleve.nom}.
          </p>
        </div>
        <span className="badge badge-outline gap-1">
          <UserRound size={13} />
          {eleve.matricule}
        </span>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body">
          <p className="text-xs uppercase tracking-wide text-base-content/50">
            Classe actuelle
          </p>
          {eleve.classe ? (
            <div className="flex items-center gap-3 mt-2">
              <div className="avatar placeholder">
                <div className="bg-primary/10 text-primary rounded-lg w-11 h-11">
                  <School size={20} />
                </div>
              </div>
              <div>
                <p className="font-semibold">{eleve.classe.nom}</p>
                <p className="text-xs text-base-content/60">
                  Affectation active
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-warning mt-2">
              Cet élève n&apos;est affecté à aucune classe.
            </p>
          )}
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body gap-4">
          <h3 className="card-title text-sm gap-2">
            <ClipboardList size={17} className="text-primary" />
            Nouvelle affectation
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Type d&apos;opération *
              </legend>
              <select
                className="select select-sm w-full"
                value={type}
                onChange={(event) =>
                  handleTypeChange(event.target.value as AffectationType)
                }
              >
                {TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Année scolaire *</legend>
              <input
                className="input input-sm w-full"
                value={anneeScolaire}
                placeholder="Ex : 2026-2027"
                onChange={(event) => setAnneeScolaire(event.target.value)}
              />
            </fieldset>
          </div>

          {!isWithdrawal && (
            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Classe de destination *
              </legend>
              <select
                className="select select-sm w-full"
                value={classeId}
                onChange={(event) => setClasseId(event.target.value)}
                disabled={
                  classesQuery.isLoading || selectableClasses.length === 0
                }
              >
                <option value="">
                  {classesQuery.isLoading
                    ? "Chargement des classes..."
                    : selectableClasses.length === 0
                      ? "Aucune autre classe disponible"
                      : "Sélectionnez une classe"}
                </option>
                {selectableClasses.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                    {classe.niveau?.nom ? ` - ${classe.niveau.nom}` : ""}
                    {classe.section?.nom ? ` (${classe.section.nom})` : ""}
                  </option>
                ))}
              </select>
              {classesQuery.isError && (
                <p className="text-xs text-error mt-1">
                  Impossible de charger les classes.
                </p>
              )}
            </fieldset>
          )}

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Motif (optionnel)</legend>
            <textarea
              className="textarea textarea-sm w-full"
              rows={2}
              maxLength={250}
              value={motif}
              placeholder="Ex : changement d'établissement, passage en classe supérieure..."
              onChange={(event) => setMotif(event.target.value)}
            />
            <span className="text-xs text-base-content/40 text-right">
              {motif.length}/250
            </span>
          </fieldset>

          <div className="card-actions justify-end">
            {!isWithdrawal && classesQuery.isError && (
              <p className="text-sm text-error mr-auto">
                Les classes ne sont pas disponibles. Vérifiez que l&apos;API est
                démarrée.
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm gap-2"
              disabled={!canSubmit}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Enregistrer l&apos;affectation
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-sm gap-2">
            <History size={17} className="text-secondary" />
            Historique des affectations
          </h3>
          {historyQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner loading-sm" />
            </div>
          ) : historyQuery.isError ? (
            <div className="alert alert-error alert-soft text-sm mt-3">
              Impossible de charger l&apos;historique.
            </div>
          ) : historyQuery.data?.length ? (
            <div className="overflow-x-auto mt-2">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Opération</th>
                    <th>Parcours</th>
                    <th>Année</th>
                    <th>Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {historyQuery.data.map((record) => (
                    <tr key={record.id}>
                      <td className="text-xs">
                        {formatDate(record.createdAt)}
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {record.type}
                        </span>
                      </td>
                      <td>
                        <span>{record.ancienneClasse?.nom ?? "—"}</span>
                        <ArrowRight
                          size={13}
                          className="inline mx-1 text-base-content/40"
                        />
                        <span>{record.nouvelleClasse?.nom ?? "Retrait"}</span>
                      </td>
                      <td className="text-xs">{record.anneeScolaire}</td>
                      <td className="text-xs text-base-content/60">
                        {record.motif ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-base-content/50 py-4">
              Aucun changement de classe enregistré pour cet élève.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
