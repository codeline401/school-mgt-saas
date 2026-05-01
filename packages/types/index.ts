// Définition de base pout toutes les entités du SaaS
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
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
