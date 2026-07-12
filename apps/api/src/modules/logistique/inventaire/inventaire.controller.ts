import { Request, Response } from "express";
import { InventaireService } from "./inventaire.service.js";

const service = new InventaireService();

/**
 * TODO: Récupérer tous les équipements de l'inventaire
 */
export const getEquipements = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Appel au service
    // const equipements = await service.getEquipements(schoolId!);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des équipements." });
  }
};

/**
 * TODO: Créer un nouvel équipement
 */
export const createEquipement = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;

    // TODO: Validation Zod
    // TODO: Appel au service
    // const equipement = await service.createEquipement(req.body, schoolId!, { schoolId, role });

    return res.status(201).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création de l'équipement." });
  }
};

/**
 * TODO: Mettre à jour un équipement
 */
export const updateEquipement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Validation des données
    // TODO: Appel au service
    // const equipement = await service.updateEquipement(id, req.body, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'équipement." });
  }
};

/**
 * TODO: Supprimer un équipement
 */
export const deleteEquipement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Appel au service
    // await service.deleteEquipement(id, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la suppression de l'équipement." });
  }
};

/**
 * TODO: Créer un prêt d'équipement
 */
export const createPret = async (req: Request, res: Response) => {
  try {
    const { schoolId, role } = req.user!;

    // TODO: Validation des données (equipementId, emprunteur, dateDebut, dateFinPrevue)
    // TODO: Appel au service
    // const pret = await service.createPret(req.body, { schoolId, role });

    return res.status(201).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du prêt." });
  }
};

/**
 * TODO: Retourner un équipement prêté
 */
export const retournerPret = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, role } = req.user!;

    // TODO: Validation des données (dateRetour, etatEquipement)
    // TODO: Appel au service
    // const pret = await service.retournerPret(id, req.body, { schoolId, role });

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors du retour de l'équipement." });
  }
};

/**
 * TODO: Récupérer les prêts
 */
export const getPrets = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Parser les filtres
    // TODO: Appel au service
    // const prets = await service.getPrets(req.query, schoolId!);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la récupération des prêts." });
  }
};

/**
 * TODO: Récupérer les équipements en retard de retour
 */
export const getEquipementsEnRetard = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.user!;

    // TODO: Appel au service
    // const equipements = await service.getEquipementsEnRetard(schoolId!);

    return res.status(200).json({ message: "Not implemented" });
  } catch (error: any) {
    console.error(error);
    return res
      .status(500)
      .json({
        error: "Erreur lors de la récupération des équipements en retard.",
      });
  }
};
