import { Router } from "express";

import ficheRoutes from "./informations/fiche/fiche.routes.js";

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

export default router;
