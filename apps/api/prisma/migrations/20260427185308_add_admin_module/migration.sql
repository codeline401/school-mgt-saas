/*
  Warnings:

  - Made the column `nom` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prenom` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "StatutAdmission" AS ENUM ('EN_ATTENTE', 'EN_LISTE_ATTENTE', 'ADMIS', 'REFUSE');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('CDI', 'CDD', 'VACATAIRE', 'STAGIAIRE');

-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "dateNaissance" TIMESTAMP(3),
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "telephone" TEXT;

-- AlterTable
ALTER TABLE "Professeur" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "dateNaissance" TIMESTAMP(3),
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "specialites" TEXT,
ADD COLUMN     "telephone" TEXT;

-- AlterTable
-- Backfill NULL values before applying NOT NULL constraints
UPDATE "User" SET "nom" = '' WHERE "nom" IS NULL;
UPDATE "User" SET "prenom" = '' WHERE "prenom" IS NULL;

ALTER TABLE "User" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "dateNaissance" TIMESTAMP(3),
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "telephone" TEXT,
ALTER COLUMN "nom" SET NOT NULL,
ALTER COLUMN "prenom" SET NOT NULL;

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierAdmission" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nomEleve" TEXT NOT NULL,
    "prenomEleve" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "classeVisee" TEXT NOT NULL,
    "adresse" TEXT,
    "nomParent" TEXT NOT NULL,
    "prenomParent" TEXT NOT NULL,
    "telephoneParent" TEXT NOT NULL,
    "emailParent" TEXT,
    "statut" "StatutAdmission" NOT NULL DEFAULT 'EN_ATTENTE',
    "eleveId" TEXT,
    "notesAdmin" TEXT,

    CONSTRAINT "DossierAdmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrat" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "typeContrat" "TypeContrat" NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "poste" TEXT NOT NULL,
    "salaire" DOUBLE PRECISION,
    "professeurId" TEXT,
    "userId" TEXT,

    CONSTRAINT "Contrat_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Contrat_person_check" CHECK ("professeurId" IS NOT NULL OR "userId" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "Remplacement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,
    "professeurAbsentId" TEXT NOT NULL,
    "remplacantUserId" TEXT,
    "classeNom" TEXT,

    CONSTRAINT "Remplacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DossierAdmission_eleveId_key" ON "DossierAdmission"("eleveId");

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierAdmission" ADD CONSTRAINT "DossierAdmission_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierAdmission" ADD CONSTRAINT "DossierAdmission_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "Professeur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remplacement" ADD CONSTRAINT "Remplacement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remplacement" ADD CONSTRAINT "Remplacement_professeurAbsentId_fkey" FOREIGN KEY ("professeurAbsentId") REFERENCES "Professeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remplacement" ADD CONSTRAINT "Remplacement_remplacantUserId_fkey" FOREIGN KEY ("remplacantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
