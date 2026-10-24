import { StatutAjournement } from "../../../../generated/prisma/enums.js";
import { EventEmitter } from "node:events"; // Utilisé pour émettre et écouter les événements liés aux ajournements

// Payload pour les notifications liées aux ajournements
export type AjournementNotificationPayload = {
  destinataireUserId: string;
  type: `AJOURNEMENT_${StatutAjournement}`;
  ajournementId: string;
  statut: StatutAjournement;
  commentaire: string | null;
};

// Instance de l'EventEmitter pour gérer les événements liés aux ajournements
export const ajournementEvents = new EventEmitter();

// Fonction pour notifier les changements de statut d'un ajournement
export function notifierAjournement(
  payload: AjournementNotificationPayload,
): void {
  ajournementEvents.emit("statut-change", payload);
}
