import { Router } from "express";
import locauxRoutes from "./locaux/locaux.routes.js";
import stocksRoutes from "./stocks/stocks.routes.js";
import equipementsRoutes from "./equipement/equipement.routes.js";
import maintenanceRoutes from "./maintenance/maintenance.routes.js";
import reservationsRoutes from "./reservations/reservation.routes.js";
import transportRoutes from "./transport/transport.routes.js";
import sortieRoutes from "./sortie/sortie.routes.js";

const router = Router();

/**
 * ROUTES CENTRALES DU MODULE LOGISTIQUE
 *
 * Ce fichier regroupe toutes les sous-routes du module de gestion logistique :
 * - /api/logistique/locaux : Gestion des salles, bâtiments et réservations
 * - /api/logistique/stocks : Gestion des fournitures pédagogiques et alertes de seuil
 * - /api/logistique/inventaire : Gestion du matériel informatique et suivi des prêts
 * - /api/logistique/maintenance : Gestion des tickets de pannes et suivi des interventions
 */

router.use("/locaux", locauxRoutes);
router.use("/stocks", stocksRoutes);
router.use("/equipements", equipementsRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/reservations", reservationsRoutes);
router.use("/transport", transportRoutes);
router.use("/sortie", sortieRoutes);

export default router;
