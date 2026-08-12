-- CreateEnum
CREATE TYPE "TypeVehicule" AS ENUM ('BUS', 'MINIBUS', 'VOITURE', 'VAN');

-- CreateEnum
CREATE TYPE "StatutVehicule" AS ENUM ('ACTIF', 'MAINTENANCE', 'HORS_SERVICE', 'VENDU');

-- CreateEnum
CREATE TYPE "StatutChauffeur" AS ENUM ('ACTIF', 'CONGE', 'SUSPENDU', 'INACTIF');

-- CreateEnum
CREATE TYPE "TypeRoute" AS ENUM ('ALLER', 'RETOUR', 'ALLER_RETOUR', 'SORTIE');

-- CreateEnum
CREATE TYPE "StatutRoute" AS ENUM ('ACTIVE', 'SUSPENDUE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutAffectation" AS ENUM ('ACTIVE', 'SUSPENDUE', 'TERMINEE');

-- CreateEnum
CREATE TYPE "TypeSortie" AS ENUM ('PEDAGOGIQUE', 'SPORTIVE', 'CULTURELLE', 'EXCURSION', 'VOYAGE', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutSortie" AS ENUM ('PLANIFIEE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeParticipant" AS ENUM ('ELEVE', 'ACCOMPAGNATEUR');

-- CreateEnum
CREATE TYPE "StatutParticipant" AS ENUM ('INSCRIT', 'CONFIRME', 'ANNULE', 'ABSENT', 'PRESENT');

-- CreateTable
CREATE TABLE "Vehicule" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "typeVehicule" "TypeVehicule" NOT NULL,
    "capacite" INTEGER NOT NULL,
    "marque" TEXT,
    "modele" TEXT,
    "annee" INTEGER,
    "statut" "StatutVehicule" NOT NULL DEFAULT 'ACTIF',
    "derniereRevision" TIMESTAMP(3),
    "prochaineRevision" TIMESTAMP(3),
    "kilometrage" INTEGER,
    "numeroAssurance" TEXT,
    "dateExpirationAssurance" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chauffeur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "numeroPermis" TEXT NOT NULL,
    "typePermis" TEXT NOT NULL,
    "dateExpirationPermis" TIMESTAMP(3),
    "statut" "StatutChauffeur" NOT NULL DEFAULT 'ACTIF',
    "adresse" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "dateEmbauche" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chauffeur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "typeRoute" "TypeRoute" NOT NULL,
    "statut" "StatutRoute" NOT NULL DEFAULT 'ACTIVE',
    "heureDepart" TIME NOT NULL,
    "heureArrivee" TIME,
    "vehiculeId" TEXT NOT NULL,
    "chauffeurId" TEXT NOT NULL,
    "joursActifs" TEXT NOT NULL,
    "arrets" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffectationTransport" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "arretMontee" TEXT,
    "arretDescente" TEXT,
    "statut" "StatutAffectation" NOT NULL DEFAULT 'ACTIVE',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffectationTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SortieScolaire" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" "TypeSortie" NOT NULL,
    "statut" "StatutSortie" NOT NULL DEFAULT 'PLANIFIEE',
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "lieu" TEXT NOT NULL,
    "adresseLieu" TEXT,
    "classeId" TEXT,
    "organisateurId" TEXT NOT NULL,
    "coutParEleve" DECIMAL(10,2),
    "budgetTotal" DECIMAL(10,2),
    "moyenTransport" TEXT,
    "equipementRequis" TEXT,
    "consignes" TEXT,
    "dateLimiteInscription" TIMESTAMP(3),
    "dateLimiteAutorisationParents" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SortieScolaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantSortie" (
    "id" TEXT NOT NULL,
    "sortieId" TEXT NOT NULL,
    "typeParticipant" "TypeParticipant" NOT NULL,
    "eleveId" TEXT,
    "accompagnateurId" TEXT,
    "statut" "StatutParticipant" NOT NULL DEFAULT 'INSCRIT',
    "montantPaye" DECIMAL(10,2),
    "datePaiement" TIMESTAMP(3),
    "observations" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantSortie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutorisationParent" (
    "id" TEXT NOT NULL,
    "sortieId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "autorise" BOOLEAN NOT NULL,
    "dateAutorisation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observation" TEXT,
    "signatureUrl" TEXT,
    "contactUrgence" TEXT,
    "telUrgence" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutorisationParent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vehicule_schoolId_idx" ON "Vehicule"("schoolId");

-- CreateIndex
CREATE INDEX "Vehicule_statut_idx" ON "Vehicule"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Chauffeur_numeroPermis_key" ON "Chauffeur"("numeroPermis");

-- CreateIndex
CREATE INDEX "Chauffeur_schoolId_idx" ON "Chauffeur"("schoolId");

-- CreateIndex
CREATE INDEX "Chauffeur_statut_idx" ON "Chauffeur"("statut");

-- CreateIndex
CREATE INDEX "Route_schoolId_idx" ON "Route"("schoolId");

-- CreateIndex
CREATE INDEX "Route_statut_idx" ON "Route"("statut");

-- CreateIndex
CREATE INDEX "Route_vehiculeId_idx" ON "Route"("vehiculeId");

-- CreateIndex
CREATE INDEX "Route_chauffeurId_idx" ON "Route"("chauffeurId");

-- CreateIndex
CREATE INDEX "AffectationTransport_schoolId_idx" ON "AffectationTransport"("schoolId");

-- CreateIndex
CREATE INDEX "AffectationTransport_routeId_idx" ON "AffectationTransport"("routeId");

-- CreateIndex
CREATE INDEX "AffectationTransport_eleveId_idx" ON "AffectationTransport"("eleveId");

-- CreateIndex
CREATE INDEX "AffectationTransport_statut_idx" ON "AffectationTransport"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "AffectationTransport_eleveId_routeId_key" ON "AffectationTransport"("eleveId", "routeId");

-- CreateIndex
CREATE INDEX "SortieScolaire_schoolId_idx" ON "SortieScolaire"("schoolId");

-- CreateIndex
CREATE INDEX "SortieScolaire_classeId_idx" ON "SortieScolaire"("classeId");

-- CreateIndex
CREATE INDEX "SortieScolaire_dateDebut_idx" ON "SortieScolaire"("dateDebut");

-- CreateIndex
CREATE INDEX "SortieScolaire_statut_idx" ON "SortieScolaire"("statut");

-- CreateIndex
CREATE INDEX "ParticipantSortie_schoolId_idx" ON "ParticipantSortie"("schoolId");

-- CreateIndex
CREATE INDEX "ParticipantSortie_sortieId_idx" ON "ParticipantSortie"("sortieId");

-- CreateIndex
CREATE INDEX "ParticipantSortie_eleveId_idx" ON "ParticipantSortie"("eleveId");

-- CreateIndex
CREATE INDEX "ParticipantSortie_statut_idx" ON "ParticipantSortie"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantSortie_sortieId_eleveId_key" ON "ParticipantSortie"("sortieId", "eleveId");

-- CreateIndex
CREATE INDEX "AutorisationParent_schoolId_idx" ON "AutorisationParent"("schoolId");

-- CreateIndex
CREATE INDEX "AutorisationParent_sortieId_idx" ON "AutorisationParent"("sortieId");

-- CreateIndex
CREATE INDEX "AutorisationParent_eleveId_idx" ON "AutorisationParent"("eleveId");

-- CreateIndex
CREATE INDEX "AutorisationParent_parentId_idx" ON "AutorisationParent"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "AutorisationParent_sortieId_eleveId_parentId_key" ON "AutorisationParent"("sortieId", "eleveId", "parentId");

-- AddForeignKey
ALTER TABLE "Vehicule" ADD CONSTRAINT "Vehicule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chauffeur" ADD CONSTRAINT "Chauffeur_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "Vehicule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "Chauffeur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationTransport" ADD CONSTRAINT "AffectationTransport_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationTransport" ADD CONSTRAINT "AffectationTransport_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationTransport" ADD CONSTRAINT "AffectationTransport_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SortieScolaire" ADD CONSTRAINT "SortieScolaire_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SortieScolaire" ADD CONSTRAINT "SortieScolaire_organisateurId_fkey" FOREIGN KEY ("organisateurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SortieScolaire" ADD CONSTRAINT "SortieScolaire_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSortie" ADD CONSTRAINT "ParticipantSortie_sortieId_fkey" FOREIGN KEY ("sortieId") REFERENCES "SortieScolaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSortie" ADD CONSTRAINT "ParticipantSortie_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSortie" ADD CONSTRAINT "ParticipantSortie_accompagnateurId_fkey" FOREIGN KEY ("accompagnateurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSortie" ADD CONSTRAINT "ParticipantSortie_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorisationParent" ADD CONSTRAINT "AutorisationParent_sortieId_fkey" FOREIGN KEY ("sortieId") REFERENCES "SortieScolaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorisationParent" ADD CONSTRAINT "AutorisationParent_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorisationParent" ADD CONSTRAINT "AutorisationParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorisationParent" ADD CONSTRAINT "AutorisationParent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
