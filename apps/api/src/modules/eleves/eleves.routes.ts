import { Router } from "express";

import ficheRoutes from "./informations/fiche/fiche.routes.js";
import responsableRoutes from "./informations/responsable/responsable.routes.js";
import emergencyContactRoutes from "./informations/emergencyContact/emergencyContact.routes.js";
import historiqueRoutes from "./informations/historique/historique.routes.js";
import paiementRoutes from "./ecolages/paiement/paiement.routes.js";
import factureRoutes from "./ecolages/factures/facture.routes.js";

const router = Router();

/**
 * ROUTES CENTRALES DU MODULE ELEVES
 *
 * Ce fichier regroupe toutes les sous-routes du module de gestion logistique :
 * - /api/eleves/informations : Gestion du fiche eleve, responsable, classe, contact d'urgence, historique, etc.
 * - /api/eleves/ecolages : paiement, factures, ajournement, relances, garanties
 * - /api/eleves/abesences : suivi absence, jusitification, retard, alerte, sanctions
 * - /api/eleves/parcours : gestion des notes, bulletin, progression, orientation, projets
 * - /api/eleves/viescolaire : suivi de comportement, activite, récompense, sante & sécurité, transport & cantine
 */

router.use("/informations", ficheRoutes);
router.use("/informations", responsableRoutes);
router.use("/informations", emergencyContactRoutes);
router.use("/informations", historiqueRoutes);

router.use("/ecolages", paiementRoutes);

/**
 * Facture routes mounted under /ecolages:
 * - GET /api/eleves/ecolages/factures (lister les factures)
 * - GET /api/eleves/ecolages/factures/:factureId (obtenir une facture)
 * - GET /api/eleves/ecolages/factures/:factureId/print (imprimer une facture en PDF)
 */
router.use("/ecolages", factureRoutes);

export default router;
