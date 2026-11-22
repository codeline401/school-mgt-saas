import { useState } from "react";
import { Bus, Utensils } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import {
  useAffectationTransportEleve,
  useAffectationCantineEleve,
  useCreerAffectationCantine,
  useCreateAffectation,
  useOffresCantineActives,
  useRoutesActives,
  useTerminerAffectationCantine,
  type AffectationTransport,
  type Route,
} from "../hooks/useInscriptions";

type Props = {
  initialEleveId?: string;
};

type Service = "cantine" | "transport";

function dateLocaleISO(): string {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

function anneeScolaireCourante(): string {
  const now = new Date();
  const debut = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${debut}-${debut + 1}`;
}

export function TransportCantineSection({ initialEleveId }: Props) {
  const [eleve, setEleve] = useState<FicheEleveComplete | null>(null);
  const [eleveIdInitial, setEleveIdInitial] = useState(initialEleveId);
  const [service, setService] = useState<Service>("cantine");
  const [offreCantineId, setOffreCantineId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [dateDebut, setDateDebut] = useState(dateLocaleISO());
  const [dateFin, setDateFin] = useState("");
  const [regimeSpecial, setRegimeSpecial] = useState("");
  const [arretMontee, setArretMontee] = useState("");
  const [arretDescente, setArretDescente] = useState("");

  const eleveId = eleve?.id ?? eleveIdInitial;
  const anneeScolaire = anneeScolaireCourante();

  const offres = useOffresCantineActives(anneeScolaire);
  const routes = useRoutesActives();
  const affectationsCantine = useAffectationCantineEleve(eleveId);
  const affectationsTransport = useAffectationTransportEleve(eleveId);

  const creerCantine = useCreerAffectationCantine();
  const terminerCantine = useTerminerAffectationCantine(eleveId);
  const creerTransport = useCreateAffectation();

  function selectionnerEleve(student: FicheEleveComplete) {
    setEleve(student);
    setEleveIdInitial(undefined);
    setOffreCantineId("");
    setRouteId("");
    setRegimeSpecial("");
    setArretMontee("");
    setArretDescente("");
  }

  async function inscrireCantine() {
    if (!eleveId || !offreCantineId) return;

    await creerCantine.mutateAsync({
      eleveId,
      offreCantineId,
      dateDebut,
      dateFin: dateFin || null,
      regimeSpecial: regimeSpecial.trim() || null,
    });

    setOffreCantineId("");
    setDateFin("");
    setRegimeSpecial("");
  }

  async function inscrireTransport() {
    if (!eleveId || !routeId) return;

    await creerTransport.mutateAsync({
      eleveId,
      routeId,
      arretMontee: arretMontee.trim() || undefined,
      arretDescente: arretDescente.trim() || undefined,
      dateDebut,
      dateFin: dateFin || undefined,
    });

    setRouteId("");
    setDateFin("");
    setArretMontee("");
    setArretDescente("");
  }

  return (
    <section className="space-y-5">
      <header className="flex items-center gap-3">
        <Bus className="text-primary" size={22} />
        <div>
          <h2 className="text-lg font-bold">Cantine & transport</h2>
          <p className="text-sm text-base-content/60">
            Inscription d’un élève aux services de l’établissement.
          </p>
        </div>
      </header>

      <StudentSearchSelect
        selectedStudentId={eleveId}
        onSelect={selectionnerEleve}
      />

      {!eleveId && (
        <p className="rounded border border-dashed border-base-300 p-6 text-center">
          Sélectionnez un élève pour gérer ses inscriptions.
        </p>
      )}

      {eleveId && (
        <>
          <div role="tablist" className="tabs tabs-boxed w-fit">
            <button
              type="button"
              role="tab"
              className={`tab gap-2 ${service === "cantine" ? "tab-active" : ""}`}
              onClick={() => setService("cantine")}
            >
              <Utensils size={16} />
              Cantine
            </button>
            <button
              type="button"
              role="tab"
              className={`tab gap-2 ${service === "transport" ? "tab-active" : ""}`}
              onClick={() => setService("transport")}
            >
              <Bus size={16} />
              Transport
            </button>
          </div>

          {service === "cantine" && (
            <div className="space-y-4">
              <fieldset className="fieldset max-w-lg">
                <legend className="fieldset-legend">Forfait cantine</legend>
                <select
                  className="select select-bordered w-full"
                  value={offreCantineId}
                  onChange={(event) => setOffreCantineId(event.target.value)}
                >
                  <option value="">Sélectionner un forfait</option>
                  {offres.data?.map((offre) => (
                    <option key={offre.id} value={offre.id}>
                      {offre.nom} —{" "}
                      {Number(offre.tarifMensuel).toLocaleString("fr-FR")} /
                      mois
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="fieldset max-w-lg">
                <legend className="fieldset-legend">
                  Régime ou restriction alimentaire
                </legend>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  maxLength={2000}
                  value={regimeSpecial}
                  onChange={(event) => setRegimeSpecial(event.target.value)}
                />
              </fieldset>

              <PeriodeInscription
                dateDebut={dateDebut}
                dateFin={dateFin}
                onDateDebutChange={setDateDebut}
                onDateFinChange={setDateFin}
              />

              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!offreCantineId || creerCantine.isPending}
                onClick={() => void inscrireCantine()}
              >
                {creerCantine.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Inscrire à la cantine
              </button>

              {offres.isError && (
                <p role="alert" className="text-error">
                  Impossible de charger les forfaits cantine.
                </p>
              )}

              {affectationsCantine.isLoading && <Chargement />}
              {affectationsCantine.isError && (
                <p role="alert" className="text-error">
                  Impossible de charger les inscriptions cantine.
                </p>
              )}

              {affectationsCantine.data?.map((affectation) => (
                <article
                  key={affectation.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {affectation.offreCantine.nom}
                    </p>
                    <p className="text-sm text-base-content/60">
                      {affectation.statut} · Début{" "}
                      {affectation.dateDebut.slice(0, 10)}
                    </p>
                    {affectation.regimeSpecial && (
                      <p className="text-sm">
                        Régime : {affectation.regimeSpecial}
                      </p>
                    )}
                  </div>
                  {affectation.statut === "ACTIVE" && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-error"
                      disabled={terminerCantine.isPending}
                      onClick={() => {
                        if (
                          window.confirm("Terminer cette inscription cantine ?")
                        ) {
                          terminerCantine.mutate(affectation.id);
                        }
                      }}
                    >
                      Terminer l’inscription
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}

          {service === "transport" && (
            <div className="space-y-4">
              <fieldset className="fieldset max-w-lg">
                <legend className="fieldset-legend">Route</legend>
                <select
                  className="select select-bordered w-full"
                  value={routeId}
                  onChange={(event) => setRouteId(event.target.value)}
                >
                  <option value="">Sélectionner une route active</option>
                  {routes.data?.map((route: Route) => (
                    <option key={route.id} value={route.id}>
                      {route.nom} — {route.typeRoute}
                    </option>
                  ))}
                </select>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Arrêt de montée</legend>
                  <input
                    className="input input-bordered"
                    value={arretMontee}
                    onChange={(event) => setArretMontee(event.target.value)}
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Arrêt de descente</legend>
                  <input
                    className="input input-bordered"
                    value={arretDescente}
                    onChange={(event) => setArretDescente(event.target.value)}
                  />
                </fieldset>
              </div>

              <PeriodeInscription
                dateDebut={dateDebut}
                dateFin={dateFin}
                onDateDebutChange={setDateDebut}
                onDateFinChange={setDateFin}
              />

              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!routeId || creerTransport.isPending}
                onClick={() => void inscrireTransport()}
              >
                {creerTransport.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Inscrire au transport
              </button>

              {routes.isError && (
                <p role="alert" className="text-error">
                  Impossible de charger les routes.
                </p>
              )}
              {affectationsTransport.isLoading && <Chargement />}
              {affectationsTransport.isError && (
                <p role="alert" className="text-error">
                  Impossible de charger les inscriptions transport.
                </p>
              )}

              {affectationsTransport.data?.map(
                (affectation: AffectationTransport) => (
                  <article
                    key={affectation.id}
                    className="border-b border-base-200 py-3"
                  >
                    <p className="font-medium">{affectation.route.nom}</p>
                    <p className="text-sm text-base-content/60">
                      {affectation.route.typeRoute} · {affectation.statut}
                    </p>
                    <p className="text-sm text-base-content/60">
                      Début {affectation.dateDebut.slice(0, 10)}
                      {affectation.arretMontee
                        ? ` · Montée : ${affectation.arretMontee}`
                        : ""}
                      {affectation.arretDescente
                        ? ` · Descente : ${affectation.arretDescente}`
                        : ""}
                    </p>
                  </article>
                ),
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PeriodeInscription({
  dateDebut,
  dateFin,
  onDateDebutChange,
  onDateFinChange,
}: {
  dateDebut: string;
  dateFin: string;
  onDateDebutChange: (value: string) => void;
  onDateFinChange: (value: string) => void;
}) {
  return (
    <div className="grid max-w-lg gap-3 sm:grid-cols-2">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Début</legend>
        <input
          className="input input-bordered"
          type="date"
          required
          value={dateDebut}
          max={dateFin || undefined}
          onChange={(event) => onDateDebutChange(event.target.value)}
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Fin (facultative)</legend>
        <input
          className="input input-bordered"
          type="date"
          min={dateDebut}
          value={dateFin}
          onChange={(event) => onDateFinChange(event.target.value)}
        />
      </fieldset>
    </div>
  );
}

function Chargement() {
  return (
    <div className="flex justify-center py-6" aria-busy="true">
      <span className="loading loading-spinner" />
    </div>
  );
}
