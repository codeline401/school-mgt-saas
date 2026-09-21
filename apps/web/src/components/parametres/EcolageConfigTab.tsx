import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiError } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { Classe } from "@school-mgt/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type MoisEcheance = {
  mois: number;
  montant: string; // texte pour l'input, converti au submit
};

type EcolageConfigResponse = {
  id: string;
  classeId: string;
  anneeScolaire: string;
  montantMensuel: string;
  jourEcheance: number;
  penaliteRetard: string | null;
  echeances: {
    id: string;
    mois: number;
    montant: string;
    dateEcheance: string;
  }[];
};

type UpsertConfigPayload = {
  anneeScolaire: string;
  montantMensuel: number;
  jourEcheance: number;
  penaliteRetard?: number | null;
  mois: { mois: number; montant?: number }[];
};

type GenererResult = {
  elevesTraites: number;
  lignesCreees: number;
};

const MOIS_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

/** Année scolaire "en cours" au format AAAA-AAAA, calée sur septembre. */
function currentSchoolYear(): string {
  const d = new Date();
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function EcolageConfigTab() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const canEdit = user?.role === "ADMIN" || user?.role === "SUDO_ADMIN";

  const [classeId, setClasseId] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState(currentSchoolYear());

  const [montantMensuel, setMontantMensuel] = useState("");
  const [jourEcheance, setJourEcheance] = useState("10");
  const [penaliteRetard, setPenaliteRetard] = useState("");
  const [moisSelectionnes, setMoisSelectionnes] = useState<MoisEcheance[]>([]);

  // ── Liste des classes de l'école ─────────────────────────────────────────────
  const { data: classes = [] } = useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => (await api.get("/api/classes")).data,
    enabled: canEdit,
  });

  // ── Configuration actuelle de la classe/année sélectionnée ───────────────────
  const configQuery = useQuery<EcolageConfigResponse>({
    queryKey: ["ecolage-config", classeId, anneeScolaire],
    queryFn: async () =>
      (
        await api.get(`/api/parametres/ecolage/${classeId}`, {
          params: { anneeScolaire },
        })
      ).data,
    enabled: canEdit && !!classeId,
    retry: false, // Une 404 signifie simplement "pas encore configuré" — inutile de réessayer.
  });

  // Pré-remplit le formulaire dès qu'une configuration existante est chargée.
  useEffect(() => {
    if (!configQuery.data) {
      setMontantMensuel("");
      setJourEcheance("10");
      setPenaliteRetard("");
      setMoisSelectionnes([]);
      return;
    }

    const config = configQuery.data;
    setMontantMensuel(config.montantMensuel);
    setJourEcheance(String(config.jourEcheance));
    setPenaliteRetard(config.penaliteRetard ?? "");
    setMoisSelectionnes(
      config.echeances.map((e) => ({ mois: e.mois, montant: e.montant })),
    );
  }, [configQuery.data]);

  // ── Mutation : enregistrer la configuration ──────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: UpsertConfigPayload) =>
      (
        await api.put<EcolageConfigResponse>(
          `/api/parametres/ecolage/${classeId}`,
          payload,
        )
      ).data,
    onSuccess: (config) => {
      queryClient.setQueryData(
        ["ecolage-config", classeId, anneeScolaire],
        config,
      );
      toast.success("Configuration d'écolage enregistrée.");
    },
    onError: (error) =>
      toast.error(
        getApiError(
          error,
          "Erreur lors de l'enregistrement de la configuration.",
        ),
      ),
  });

  // ── Mutation : générer les échéances pour les élèves de la classe ────────────
  const genererMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<GenererResult>(
          `/api/parametres/ecolage/${classeId}/generer`,
          { anneeScolaire },
        )
      ).data,
    onSuccess: (result) => {
      toast.success(
        `${result.lignesCreees} échéance(s) créée(s) pour ${result.elevesTraites} élève(s).`,
      );
    },
    onError: (error) =>
      toast.error(
        getApiError(error, "Erreur lors de la génération des échéances."),
      ),
  });

  function toggleMois(mois: number) {
    setMoisSelectionnes((prev) => {
      const exists = prev.find((m) => m.mois === mois);
      if (exists) {
        return prev.filter((m) => m.mois !== mois);
      }
      return [...prev, { mois, montant: "" }].sort((a, b) => a.mois - b.mois);
    });
  }

  function updateMoisMontant(mois: number, montant: string) {
    setMoisSelectionnes((prev) =>
      prev.map((m) => (m.mois === mois ? { ...m, montant } : m)),
    );
  }

  function handleSubmit() {
    if (!classeId || !montantMensuel.trim() || moisSelectionnes.length === 0) {
      toast.error("Classe, montant mensuel et au moins un mois sont requis.");
      return;
    }

    saveMutation.mutate({
      anneeScolaire,
      montantMensuel: Number(montantMensuel),
      jourEcheance: Number(jourEcheance),
      penaliteRetard: penaliteRetard.trim() ? Number(penaliteRetard) : null,
      mois: moisSelectionnes.map((m) => ({
        mois: m.mois,
        montant: m.montant.trim() ? Number(m.montant) : undefined,
      })),
    });
  }

  if (!canEdit) {
    return (
      <div role="alert" className="alert alert-warning">
        <AlertCircle size={18} />
        <span>Réservé aux administrateurs.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wallet size={20} className="text-primary" />
        <h2 className="text-lg font-bold">Paramétrage de l’écolage</h2>
      </div>
      <p className="text-sm text-base-content/60">
        Définissez le montant, les mois facturés et l’échéance de paiement pour
        chaque classe et année scolaire.
      </p>

      {/* ── Sélecteurs classe / année ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <fieldset className="fieldset">
          <label className="label" htmlFor="classe">
            <span className="label-text">Classe</span>
          </label>
          <select
            id="classe"
            className="select select-bordered w-full"
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
          >
            <option value="">Sélectionner une classe</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="fieldset">
          <label className="label" htmlFor="anneeScolaire">
            <span className="label-text">Année scolaire</span>
          </label>
          <input
            id="anneeScolaire"
            type="text"
            className="input input-bordered w-full"
            value={anneeScolaire}
            onChange={(e) => setAnneeScolaire(e.target.value)}
            placeholder="AAAA-AAAA"
          />
        </fieldset>
      </div>

      {!classeId && (
        <div className="rounded-lg border border-dashed border-base-300 p-8 text-center">
          <p className="font-medium">Aucune classe sélectionnée</p>
          <p className="mt-1 text-sm text-base-content/60">
            Choisissez une classe pour configurer son écolage.
          </p>
        </div>
      )}

      {classeId && configQuery.isLoading && (
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <Loader2 size={16} className="animate-spin" />
          Chargement de la configuration...
        </div>
      )}

      {classeId && !configQuery.isLoading && (
        <div className="card border border-base-200 bg-base-100 shadow-sm">
          <div className="card-body space-y-5">
            {/* ── Montant, échéance, pénalité ────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <fieldset className="fieldset">
                <label className="label" htmlFor="montantMensuel">
                  <span className="label-text">Montant mensuel par défaut</span>
                </label>
                <input
                  id="montantMensuel"
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={montantMensuel}
                  onChange={(e) => setMontantMensuel(e.target.value)}
                />
              </fieldset>

              <fieldset className="fieldset">
                <label className="label" htmlFor="jourEcheance">
                  <span className="label-text">Jour d’échéance (1-28)</span>
                </label>
                <input
                  id="jourEcheance"
                  type="number"
                  min={1}
                  max={28}
                  className="input input-bordered w-full"
                  value={jourEcheance}
                  onChange={(e) => setJourEcheance(e.target.value)}
                />
              </fieldset>

              <fieldset className="fieldset">
                <label className="label" htmlFor="penaliteRetard">
                  <span className="label-text">
                    Pénalité de retard (facultatif)
                  </span>
                </label>
                <input
                  id="penaliteRetard"
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={penaliteRetard}
                  onChange={(e) => setPenaliteRetard(e.target.value)}
                />
              </fieldset>
            </div>

            {/* ── Sélection des mois facturés ────────────────────────────── */}
            <div>
              <p className="label-text mb-2 flex items-center gap-2">
                <CalendarClock size={16} />
                Mois à facturer
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {MOIS_LABELS.map((label, index) => {
                  const mois = index + 1;
                  const selected = moisSelectionnes.find(
                    (m) => m.mois === mois,
                  );
                  return (
                    <div
                      key={mois}
                      className={`rounded-lg border p-2 ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-base-200"
                      }`}
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={!!selected}
                          onChange={() => toggleMois(mois)}
                        />
                        {label}
                      </label>
                      {selected && (
                        <input
                          type="number"
                          step="0.01"
                          className="input input-bordered input-sm mt-2 w-full"
                          placeholder={`Défaut : ${montantMensuel || "—"}`}
                          value={selected.montant}
                          onChange={(e) =>
                            updateMoisMontant(mois, e.target.value)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Actions ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary gap-2"
                disabled={saveMutation.isPending}
                onClick={handleSubmit}
              >
                {saveMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Banknote size={16} />
                )}
                Enregistrer la configuration
              </button>

              <button
                type="button"
                className="btn btn-outline gap-2"
                disabled={!configQuery.data || genererMutation.isPending}
                onClick={() => genererMutation.mutate()}
                title="Crée les échéances dues pour tous les élèves actifs de la classe"
              >
                {genererMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                Générer les échéances élèves
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
