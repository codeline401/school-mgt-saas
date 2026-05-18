// Définition de base pout toutes les entités du SaaS
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  schoolId: string; // ID de l'école à laquelle cette entité appartient
}

// Un élève appartient à UNE SEULE classe
export interface Eleve extends BaseEntity {
  nom: string;
  prenom: string;
  classeId: string; // ID de la classe à laquelle l'élève appartient
}

// Une classe contient plusieurs élèves
// N.B. le modèle Prisma Classe n'a pas createdAt/updatedAt
export interface Classe {
  id: string;
  nom: string;
  schoolId: string;
  // Compteurs optionnels retournés par l'API (include _count)
  _count?: {
    eleves: number;
    profs: number;
  };
}

// Payload envoyé pour créer une classe
export interface CreateClasseInput {
  nom: string;
}

// Un prof peut avoir PLUSIEURS classes
export interface Professeur extends BaseEntity {
  nom: string;
  prenom: string;
  classeIds: string[]; // IDs des classes que le professeur enseigne
}

// Une école est le tenant principal du Saas
// Elle n'étend PAS BaseEntity car elle n'a pas de schoolId (elle est l'école)
export interface School {
  id: string;
  nom: string;
  inviteCode: string; // Code d'invitation unique pour rejoindre l'école
  createdAt: string;
  // Compteurs optionnels retournés par l'API (include _count)
  _count?: {
    eleves: number;
    classes: number;
    profs: number;
    users: number;
  };
}

// Payload envoyé pour créer une école
export interface CreateSchoolInput {
  nom: string;
}

// Parent : repsonsable légal d'un élève
export interface Parent {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

// Résumé d'un dossier d'admission (pour l'histo dans la fiche élève)
export interface DossierAdmission {
  id: string;
  statut: "EN_ATTENTE" | "EN_LISTE_ATTENTE" | "ADMIS" | "REFUSE";
  nomEleve: string;
  prenomEleve: string;
  classeVisee: string;
  createdAt: string;
  updatedAt: string;
}

// Profil complet retourné par GET /api/profils/eleves/:id
// Etend BaseEntity et inclut les relations (classes, parent, admissions)
export interface EleveProfil extends BaseEntity {
  nom: string;
  prenom: string;
  dateNaissance?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  photoUrl?: string | null;
  classeId?: string | null;
  parentId?: string | null;
  // Relantions imbriquées (retournées par Prisma avec include)
  classe?: Classe | null;
  parent?: Parent | null;
  admissions?: DossierAdmission[];
}

// résumé d'un élève (pour la fiche parent)
export interface EleveResume {
  id: string;
  nom: string;
  prenom: string;
  schoolId: string;
  classeId: string;
  createdAt: string;
  updatedAt: string;
  classe?: Classe | null;
}

// Contrat d'un membre du personnel
export interface Contrat {
  id: string;
  typeContrat: "CDI" | "CDD" | "VACATAIRE" | "STAGIAIRE";
  dateDebut: string;
  dateFin?: string | null;
  poste: string;
  salaire: number | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

// Remplacement (absence d'un prof)
export interface Remplacement {
  id: string;
  date: string;
  motif?: string | null;
  classeNom?: string | null; // Nom de la classe concernée
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

// Profil complet d'un professeur (GET /api/profils/profs/:id)
export interface ProfesseurProfil extends BaseEntity {
  nom: string;
  prenom: string;
  telephone?: string | null;
  adresse?: string | null;
  dateNaissance?: string | null;
  photoUrl?: string | null;
  specialites?: string | null; // ex: "Mathématiques, Physique"
  classes: Classe[]; // Les classes que le prof enseigne
  contrat: Contrat[]; // Historique des contrats du prof
  remplacements: Remplacement[]; // Historique des remplacements du prof
}

// Profil complet d'un parent (GET /api/profils/parents/:id)
export interface ParentProfil {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  eleves: EleveResume[];
}

export interface Matiere extends BaseEntity {
  nom: string;
  description?: string | null;
  classeId: string;
}

/** Résumé d'un élève retourné dans la liste des notes */
export interface NoteEleveResume {
  id: string;
  nom: string;
  prenom: string;
}

/** Résumé d'une matière retourné dans la liste des notes */
export interface NoteMatiereResume {
  id: string;
  nom: string;
}

/**
 * Note d'un elève pour une matière dans une classe
 *
 * Un élève peut avoir plusieurs notes pour la même matière, chacune
 * identifiée par un titre d'évaluation unique (ex: "DS1", "Examen final", etc.)
 *
 * Retourné par GET /api/classes/:classeId/notes
 */
export interface Note extends BaseEntity {
  titre: string; // ex: "DS1", "Examen final", etc.
  note: number; // Note sur 20
  noteMax: number; // Note maximale (ex: 20, 100, etc.)
  coefficient: number; // Coefficient de la note (ex: 1, 2, etc.)
  commentaire?: string | null; // Commentaire optionnel du prof
  feuillePath?: string | null; // Chemin vers la feuille de note (PDF) générée
  eleveId: string; // ID de l'élève concerné
  matiereId: string; // ID de la matière concernée
  classeId: string; // ID de la classe concernée
  createdById: string; // ID du professeur qui a créé la note
  eleve?: NoteEleveResume; // Résumé de l'élève (inclus si demandé avec include)
  matiere?: NoteMatiereResume; // Résumé de la matière (inclus si demandé avec include)
}

export type TypeDocument =
  | "COURS"
  | "DEVOIR"
  | "EVALUATION"
  | "NOTE_SERVICE"
  | "CIRCULAIRE"
  | "AUTRE";

export interface DocumentUploader {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface ClasseDocument {
  id: string;
  titre: string;
  description?: string | null;
  type: TypeDocument;
  filePath: string;
  mimeType: string;
  classeId: string;
  matiereId?: string | null;
  uploadedById: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: DocumentUploader;
  matiere?: { id: string; nom: string } | null;
}

export type JourSemaine =
  | "LUNDI"
  | "MARDI"
  | "MERCREDI"
  | "JEUDI"
  | "VENDREDI"
  | "SAMEDI"
  | "DIMANCHE";

export interface CreneauHoraire {
  id: string;
  classeId: string;
  schoolId: string;
  jour: JourSemaine;
  heureDebut: string;
  heureFin: string;
  intitule?: string | null;
  matiereId?: string | null;
  matiere?: { id: string; nom: string } | null;
  couleur?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StatutPresence = "PRESENT" | "ABSENT" | "RETARD";

export interface PresenceEleve {
  id: string;
  nom: string;
  prenom: string;
}

export interface Presence {
  id: string;
  appelId: string;
  eleveId: string;
  statut: StatutPresence;
  updatedAt: string;
  eleve?: PresenceEleve;
}

export interface CreneauResume {
  id: string;
  jour: JourSemaine;
  heureDebut: string;
  heureFin: string;
  intitule?: string | null;
  couleur?: string | null;
  matiere?: { id: string; nom: string } | null;
}

export interface Appel {
  id: string;
  creneauId: string;
  classeId: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  creneau?: CreneauResume;
  presences?: Presence[];
}

/** Statistiques d'absences par élève sur une période */
export interface AbsenceStat {
  eleveId: string;
  nom: string;
  prenom: string;
  /** Appels où une présence a été enregistrée pour cet élève (peut différer du total classe si l'élève a rejoint la classe en cours de période) */
  appelsEleve: number;
  present: number;
  absent: number;
  retard: number;
  tauxPresence: number; // 0–100 arrondi à 1 décimale, base = appelsEleve
}

/** Réponse de GET /api/classes/:classeId/appels/stats/absences */
export interface AbsenceStatsResponse {
  from: string;
  to: string;
  totalAppels: number;
  stats: AbsenceStat[];
}
