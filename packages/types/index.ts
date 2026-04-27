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
export interface Classe extends BaseEntity {
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
  createdAt: Date;
  // Compteurs optionnels retournés par l'API (include _count)
  _count: {
    eleves: number;
    classes: number;
    profs: number;
    user: number;
  };
}

// Playload envoyé pour créer une école
export interface CreateSchoolInput {
  nom: string;
}
