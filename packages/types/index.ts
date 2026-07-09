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
  professeurPrincipalId?: string | null; // ID du prof principal de la classe (optionnel)
  // Compteurs optionnels retournés par l'API (include _count)
  _count?: {
    eleves: number;
    profs: number;
  };
}

// Payload envoyé pour créer une classe
export interface CreateClasseInput {
  nom: string;
  schoolId?: string; // Requis pour SUDO_ADMIN, optionnel pour ADMIN
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
  matieres: { id: string; nom: string; classeId: string }[]; // Les matières enseignées par le prof
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
 */

export type TypeNote = "INTERROGATION" | "DS" | "EXAMEN" | "AUTRE";

/**
 * Retourné par GET /api/classes/:classeId/notes
 */
export interface Note extends BaseEntity {
  titre: string; // ex: "DS1", "Examen final", etc.
  note: number; // Note sur 20
  noteMax: number; // Note maximale (ex: 20, 100, etc.)
  coefficient: number; // Coefficient de la note (ex: 1, 2, etc.)
  typeNote: TypeNote; // Type d'évaluation
  dateEval: string; // Date effective de l'évaluation (ISO string)
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

/** Créneau enrichi pour l'emploi du temps personnel d'un prof */
export interface CreneauHoraireProf extends CreneauHoraire {
  classe: { id: string; nom: string };
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

export interface Notification {
  id: string;
  userId: string;
  message: string;
  lien?: string | null;
  lu: boolean;
  createdAt: string;
}

/**
 * Module Prof - quiz & Cahier de texte
 */
export type StatutQuiz = "BROUILLON" | "PUBLIE" | "FERME";
export type TypeQuestion = "QCM" | "VRAI_FAUX" | "REPONSE_COURTE";

export interface Devoir {
  id: string;
  titre: string;
  description?: string | null;
  dateRendu: string; // YYYY-MM-DD
  cahierTexteId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CahierTexte {
  id: string;
  titre: string;
  detail?: string | null;
  date: string;
  classeId: string;
  matiereId?: string | null;
  professeurId: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  matiere?: { id: string; nom: string } | null;
  classe?: { id: string; nom: string } | null;
  devoir?: Devoir[];
}

export interface Question {
  id: string;
  quizId: string;
  enonce: string;
  type: TypeQuestion;
  options: string[]; // Pour QCM et VRAI_FAUX, les options possibles (ex: ["A", "B", "C", "D"] ou ["VRAI", "FAUX"])
  bonneReponse: string;
  ordre: number; // Ordre de la question dans le quiz
  createdAt: string;
}

export interface Reponse {
  id: string;
  soumissionId: string;
  questionId: string;
  valeur: string;
  correcte: boolean | null;
}

export interface Soumission {
  id: string;
  quizId: string;
  eleveId: string;
  score?: number | null; // Score obtenu sur le quiz (calculé à la correction)
  total: number; // Score total possible du quiz
  soumisAt: string;
  reponses?: Reponse[]; // Les réponses soumises par l'élève (inclus si demandé avec include)
  eleve?: { id: string; nom: string; prenom: string } | null; // Résumé de l'élève (inclus si demandé avec include)
}

export interface Quiz {
  id: string;
  titre: string;
  classeId: string;
  matiereId?: string | null;
  professeurId: string;
  schoolId: string;
  statut: StatutQuiz;
  createdAt: string;
  updatedAt: string;
  matiere?: { id: string; nom: string } | null;
  classe?: { id: string; nom: string } | null;
  questions?: Question[]; // Les questions du quiz (inclus si demandé avec include)
  _count?: {
    questions: number;
    soumissions: number;
  };
}

// --- BULLETIN TEMPLATE ------------------------------------------
/**
 * COnfiguration JSON du canevas de bulletin
 * Stockée dans BuuletinTemplate.config (Prisma Json)
 * Les valeurs manquantes dans la DB sont complétés par DEFAULT_BULLETIN_CONFIG.
 */
export interface BulletinTemplateConfig {
  /** Texte d'en-tête affiché en haut de chaque bulletin imprimé */
  enteteTexte: string;
  /** Année scolaire, ex: "2025-2026" */
  anneeTexte: string;
  /** Texte de peid de page, ex: "Le Directeur : "_______________________" */
  piedTexte: string;
  /** Afficher le rang de l'élève dans la classe */
  showRang: boolean;
  /** Afficher la colonne de coefficient dans le tableau des matières */
  showCoef: boolean;
  /** Afficher le nombre d'évaluation pas matières */
  showNbEval: boolean;
  /** Note minimale (sur 20) pour afficher la couleur "Bien" */
  seuilBien: number;
  /** Note minimale (sur 20) pour afficher la couleur "Assez-Bien" */
  seuilAssezBien: number;
  /** Note minimale (sur 20) pour afficher la couleur "Passable" */
  seuilPassable: number;
}

/** Valeur par défaut appliquées quand aucun canevas n'a été configuré */
export const DEFAULT_BULLETIN_CONFIG: BulletinTemplateConfig = {
  enteteTexte: "Bulletin scolaire",
  anneeTexte: "2025-2026",
  piedTexte: "Le Directeur : _______________________",
  showRang: true,
  showCoef: true,
  showNbEval: false,
  seuilBien: 14,
  seuilAssezBien: 12,
  seuilPassable: 10,
};

/**
 * Canevas de bulletin retourné par GET /api/bulletin-template.
 * `config` est toujours peuplé (fusionné avec les défauts côté serveur).
 */
export interface BulletinTemplate extends BaseEntity {
  schoolId: string;
  config: BulletinTemplateConfig;
}

export type ExamenStatut =
  | "PLANIFIE"
  | "EN_COURS"
  | "TERMINE"
  | "REPORTE"
  | "ANNULE";

export interface ExamenSalle {
  id: string;
  nom: string;
  capacite?: number | null;
  location?: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamenSurveillant {
  id: string;
  userId: string;
  roleLabel?: string | null;
  user?: {
    id: string;
    nom: string;
    prenom: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExamenIncident {
  id: string;
  sessionId: string;
  type: string;
  message: string;
  createdById: string;
  createdAt: string;
}

export interface ExamenSession {
  id: string;
  titre: string;
  description?: string | null;
  classeId: string;
  matiereId?: string | null;
  salleId?: string | null;
  schoolId: string;
  dateExamen: string;
  heureDebut: string;
  heureFin: string;
  statut: ExamenStatut;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  salle?: ExamenSalle | null;
  matiere?: { id: string; nom: string } | null;
  surveillants?: ExamenSurveillant[];
  incidents?: ExamenIncident[];
}

export interface ExamenPlanningEpreuveInput {
  dateExamen: string;
  matiereId: string;
  salleId: string;
  heureDebut: string;
  heureFin: string;
  surveillantUserIds: string[];
}

export interface CreateExamenPlanningInput {
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  epreuves: ExamenPlanningEpreuveInput[];
}

// EXPORT MODULE

export type ExportType = "BULLETIN" | "RELEVE" | "CLASSEMENT" | "DELIBERATION";
export type ExportFormat = "A4" | "A3" | "Letter";
export type ExportOrientation = "portrait" | "landscape";

export interface SchoolExportInfo {
  nom: string;
  logoUrl: string | null;
  devise: string | null;
  slogan: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  numAutorisation: string | null;
}

export interface BulletinSubject {
  matiereId: string;
  nom: string;
  coefficient: number;
  moyenne: number;
  nbEvaluations: number;
  rang: number | null;
  appreciation: string | null;
}

export interface BulletinData {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    dateNaissance: string | null;
    photoUrl: string | null;
  };
  classe: { id: string; nom: string };
  periode: { id: string; nom: string; type: string; anneeScolaire: string };
  subjects: BulletinSubject[];
  moyenneGenerale: number;
  rang: number | null;
  totalEleves: number;
  appreciationConseil: string | null;
  decision: string | null;
  mention: string | null;
  avertissement: string | null;
  config: BulletinTemplateConfig;
  school: SchoolExportInfo;
  dateGeneration: string;
  watermark: string | null;
  primaryColor: string;
  signatureDirecteur: string | null; // base64 de la signature du directeur
  signatureProfPrincipal: string | null; // base64 de la signature du prof principal
}

export interface ReleveEvaluation {
  titre: string;
  type: string;
  date: string;
  note: number;
  noteMax: number;
  noteNormalisee: number;
  coefficient: number;
}

export interface ReleveMatiere {
  matiereId: string;
  nom: string;
  coefficient: number;
  evaluations: ReleveEvaluation[];
  moyenne: number;
  appreciation: string | null;
}

export interface ReleveData {
  eleve: BulletinData["eleve"];
  classe: BulletinData["classe"];
  periode: BulletinData["periode"];
  matieres: ReleveMatiere[];
  moyenneGenerale: number;
  rang: number | null;
  totalEleves: number;
  config: BulletinTemplateConfig;
  school: SchoolExportInfo;
  dateGeneration: string;
}

export interface ClassementEntry {
  rang: number;
  eleveId: string;
  nom: string;
  prenom: string;
  moyenne: number;
  nbMatieres: number;
  mention: string | null;
}

export interface ClassementData {
  classe: { id: string; nom: string };
  periode: BulletinData["periode"];
  entries: ClassementEntry[];
  moyenneClasse: number;
  moyenneMin: number;
  moyenneMax: number;
  tauxReussite: number;
  config: BulletinTemplateConfig;
  school: SchoolExportInfo;
  dateGeneration: string;
}

export interface DeliberationEntry {
  rang: number | null;
  eleveId: string;
  nom: string;
  prenom: string;
  moyenne: number;
  decision: string;
  mention: string | null;
  avertissement: string | null;
  commentaire: string | null;
}

export interface DeliberationData {
  session: {
    id: string;
    periodeLabel: string;
    anneeScolaire: string;
    statut: string;
    compteRendu: string | null;
    dateValidation: string | null;
    validePar: string | null;
  };
  classe: { id: string; nom: string };
  entries: DeliberationEntry[];
  statistiques: {
    totalEleves: number;
    passes: number;
    redoublants: number;
    orientes: number;
    exclus: number;
    moyenneClasse: number;
    tauxReussite: number;
  };
  config: BulletinTemplateConfig;
  school: SchoolExportInfo;
  dateGeneration: string;
}

export interface ExportOptions {
  format: ExportFormat;
  orientation: ExportOrientation;
  watermark: string | null;
  includeGraphs: boolean;
  primaryColor: string | null;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: "A4",
  orientation: "portrait",
  watermark: null,
  includeGraphs: false,
  primaryColor: null,
};
