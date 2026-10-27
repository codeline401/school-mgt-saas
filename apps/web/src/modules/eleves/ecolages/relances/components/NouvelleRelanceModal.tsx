import { useState } from "react";
import { Send, CalendarClock, X } from "lucide-react";
import type { FicheEleveComplete } from "@school-mgt/types";
import { StudentSearchSelect } from "../../../informations/emergencyContact/components/StudentSearchSelect";
import { useClasses } from "../../../../logistique/hooks/useLocaux";
import {
  useApercuRelance,
  useCreerRelance,
  type CiblageRelance,
  type TypeRelance,
} from "../hooks/useRelances";

const VARIABLES = ["nom_parent", "nom_eleve", "montant_du", "mois"] as const;

const MESSAGE_PAR_DEFAUT =
  "Bonjour {{nom_parent}}, l'écolage de {{nom_eleve}} ({{mois}}) reste impayé : {{montant_du}}. Merci de régulariser votre situation.";

type Props = { onClose: () => void };

// Assistant de création : mode, ciblage, aperçu, message, envoi ou programmation.
export function NouvelleRelanceModal({ onClose }: Props) {
  const [type, setType] = useState<TypeRelance>("MANUELLE");
  const [ciblage, setCiblage] = useState<CiblageRelance>("TOUS_RETARDS");
  const [classeId, setClasseId] = useState("");
  const [eleves, setEleves] = useState<FicheEleveComplete[]>([]);
  const [message, setMessage] = useState(MESSAGE_PAR_DEFAUT);
  const [recurrent, setRecurrent] = useState(true);
  const [jourMois, setJourMois] = useState(5);
  const [dateProgrammee, setDateProgrammee] = useState("");

  const { data: classes = [] } = useClasses();
  const creer = useCreerRelance();

  // Le mode automatique cible toujours tous les retards.
  const ciblageEffectif: CiblageRelance =
    type === "AUTOMATIQUE" ? "TOUS_RETARDS" : ciblage;
  const cibleIds =
    ciblageEffectif === "ELEVES"
      ? eleves.map((e) => e.id)
      : ciblageEffectif === "CLASSE" && classeId
        ? [classeId]
        : [];
  const filtre = { ciblage: ciblageEffectif, cibleIds };
  const ciblageComplet =
    ciblageEffectif === "TOUS_RETARDS" || cibleIds.length > 0;

  const apercu = useApercuRelance(filtre, ciblageComplet);

  const messageValide = message.trim().length >= 10;
  const programmationValide =
    type === "MANUELLE" || (recurrent ? jourMois >= 1 : !!dateProgrammee);
  const peutValider = ciblageComplet && messageValide && programmationValide;

  function ajouterEleve(student: FicheEleveComplete) {
    setEleves((prev) =>
      prev.some((e) => e.id === student.id) ? prev : [...prev, student],
    );
  }

  async function soumettre() {
    try {
      await creer.mutateAsync({
        ...filtre,
        type,
        canal: "NOTIFICATION",
        message: message.trim(),
        ...(type === "AUTOMATIQUE"
          ? recurrent
            ? { recurrent: true, jourMois }
            : {
                recurrent: false,
                dateProgrammee: new Date(dateProgrammee).toISOString(),
              }
          : {}),
      });
      onClose();
    } catch {
      // Erreur déjà notifiée par le hook
    }
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Nouvelle relance</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode */}
        <div role="tablist" className="tabs tabs-boxed w-fit">
          {(["MANUELLE", "AUTOMATIQUE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              className={`tab ${type === t ? "tab-active" : ""}`}
              onClick={() => setType(t)}
            >
              {t === "MANUELLE" ? "Manuel" : "Automatique"}
            </button>
          ))}
        </div>

        {/* Ciblage (manuel uniquement) */}
        {type === "MANUELLE" ? (
          <div className="space-y-3">
            <select
              className="select select-bordered w-full"
              value={ciblage}
              onChange={(e) => setCiblage(e.target.value as CiblageRelance)}
            >
              <option value="TOUS_RETARDS">Tous les élèves en retard</option>
              <option value="CLASSE">Une classe</option>
              <option value="ELEVES">Élèves spécifiques</option>
            </select>

            {ciblage === "CLASSE" && (
              <select
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
            )}

            {ciblage === "ELEVES" && (
              <div className="space-y-2">
                <StudentSearchSelect
                  selectedStudentId={undefined}
                  onSelect={ajouterEleve}
                />
                <div className="flex flex-wrap gap-2">
                  {eleves.map((e) => (
                    <span key={e.id} className="badge badge-outline gap-1">
                      {e.prenom} {e.nom}
                      <button
                        type="button"
                        aria-label="Retirer"
                        onClick={() =>
                          setEleves((prev) => prev.filter((x) => x.id !== e.id))
                        }
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-base-200 p-4">
            <p className="text-sm text-base-content/70">
              Relance de tous les impayés, hors ajournement valide.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={recurrent}
                onChange={(e) => setRecurrent(e.target.checked)}
              />
              Récurrente (chaque mois)
            </label>
            {recurrent ? (
              <label className="flex items-center gap-2 text-sm">
                Le
                <input
                  type="number"
                  min={1}
                  max={28}
                  className="input input-bordered input-sm w-20"
                  value={jourMois}
                  onChange={(e) => setJourMois(Number(e.target.value))}
                />
                de chaque mois
              </label>
            ) : (
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={dateProgrammee}
                onChange={(e) => setDateProgrammee(e.target.value)}
              />
            )}
          </div>
        )}

        {/* Aperçu du nombre d'élèves concernés */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          {!ciblageComplet &&
            "Sélectionnez une cible pour voir les élèves concernés."}
          {ciblageComplet && apercu.isLoading && (
            <span className="loading loading-spinner loading-xs" />
          )}
          {ciblageComplet && apercu.data && (
            <>
              <strong>{apercu.data.nbEleves}</strong> élève(s) en retard
              concerné(s) —{" "}
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "MGA",
                maximumFractionDigits: 0,
              }).format(apercu.data.montantTotal)}
              {apercu.data.sansCompteParent > 0 && (
                <span className="block text-warning">
                  {apercu.data.sansCompteParent} sans compte parent :
                  notification impossible.
                </span>
              )}
            </>
          )}
        </div>

        {/* Éditeur de message */}
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Message</legend>
          <textarea
            className="textarea textarea-bordered h-28 w-full"
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                className="badge badge-outline cursor-pointer"
                onClick={() => setMessage((m) => `${m} {{${v}}}`)}
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary gap-2"
            disabled={!peutValider || creer.isPending}
            onClick={soumettre}
          >
            {type === "MANUELLE" ? (
              <Send size={16} />
            ) : (
              <CalendarClock size={16} />
            )}
            {type === "MANUELLE" ? "Envoyer maintenant" : "Programmer"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
