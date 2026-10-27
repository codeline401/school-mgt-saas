import { X } from "lucide-react";
import { useClasses } from "../../../../logistique/hooks/useLocaux";
import type {
  CanalRelance,
  CiblageRelance,
  Relance,
  StatutRelance,
} from "../hooks/useRelances";

type Props = { relance: Relance; onClose: () => void };

const STATUT_LABELS: Record<StatutRelance, string> = {
  EN_ATTENTE: "Programmée",
  EN_COURS: "En cours",
  ENVOYE: "Envoyée",
  ECHOUE: "Échec",
  ANNULEE: "Annulée",
};

const CANAL_LABELS: Record<CanalRelance, string> = {
  NOTIFICATION: "Notification",
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
};

const CIBLAGE_LABELS: Record<CiblageRelance, string> = {
  TOUS_RETARDS: "Tous les élèves en retard",
  CLASSE: "Classe(s)",
  ELEVES: "Élèves sélectionnés",
};

function formatDateHeure(value: string | null): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

function Ligne({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm text-base-content/60">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

// Détail d'une campagne : paramètres, message et résultat d'envoi.
export function RelanceDetailModal({ relance, onClose }: Props) {
  const { data: classes = [] } = useClasses();

  const cible =
    relance.ciblage === "CLASSE"
      ? relance.cibleIds
          .map(
            (id) => classes.find((c) => c.id === id)?.nom ?? "Classe inconnue",
          )
          .join(", ")
      : relance.ciblage === "ELEVES"
        ? `${relance.cibleIds.length} élève(s)`
        : null;

  const nbEnvoyes = relance.nbDestinataires - relance.nbEchecs;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Détail de la relance</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <dl className="space-y-2">
          <Ligne label="Statut">{STATUT_LABELS[relance.statut]}</Ligne>
          <Ligne label="Type">
            {relance.type === "MANUELLE"
              ? "Manuelle"
              : relance.recurrent
                ? `Automatique — le ${relance.jourMois} de chaque mois`
                : "Automatique — date unique"}
          </Ligne>
          <Ligne label="Canal">{CANAL_LABELS[relance.canal]}</Ligne>
          <Ligne label="Ciblage">
            {CIBLAGE_LABELS[relance.ciblage]}
            {cible && <span className="block font-normal">{cible}</span>}
          </Ligne>
          <Ligne label="Créée le">{formatDateHeure(relance.createdAt)}</Ligne>
          {relance.statut === "EN_ATTENTE" && (
            <Ligne label="Prochaine exécution">
              {formatDateHeure(relance.dateProgrammee)}
            </Ligne>
          )}
          <Ligne label="Dernière exécution">
            {formatDateHeure(relance.dateExecution)}
          </Ligne>
          <Ligne label="Destinataires">
            {relance.dateExecution
              ? `${relance.nbDestinataires} (${nbEnvoyes} envoyé(s), ${relance.nbEchecs} échec(s))`
              : "—"}
          </Ligne>
        </dl>

        <div>
          <h4 className="mb-1 text-sm text-base-content/60">Message</h4>
          <p className="whitespace-pre-wrap rounded-lg border border-base-200 bg-base-200/40 p-3 text-sm">
            {relance.message}
          </p>
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </dialog>
  );
}
