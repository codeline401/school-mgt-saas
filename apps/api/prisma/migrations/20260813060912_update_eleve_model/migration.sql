/*
  Warnings:

  - You are about to drop the column `adresse` on the `Eleve` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolId,matricule]` on the table `Eleve` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,nom,prenom,dateNaissance]` on the table `Eleve` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatutEleve" AS ENUM ('ACTIF', 'INACTIF', 'INSCRIT', 'SUSPENDU', 'DIPLOME', 'ABANDON');

-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('MASCULIN', 'FEMININ');

-- CreateEnum
CREATE TYPE "StatutFinAnnee" AS ENUM ('EN_COURS', 'ADMIS', 'REDOUBLE', 'RENVOYE', 'REORIENTE', 'QUITTE');

-- CreateEnum
CREATE TYPE "SituationFamiliale" AS ENUM ('CELIBATAIRE', 'MARIE', 'DIVORCE', 'AUTRE');

-- DropForeignKey
ALTER TABLE "Eleve" DROP CONSTRAINT "Eleve_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Eleve" DROP CONSTRAINT "Eleve_schoolId_fkey";

-- DropIndex
DROP INDEX "Eleve_schoolId_nom_prenom_key";

-- AlterTable
ALTER TABLE "Eleve" DROP COLUMN "adresse",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "genre" "Genre",
ADD COLUMN     "isRelationContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lieuNaissance" TEXT,
ADD COLUMN     "matricule" SERIAL NOT NULL,
ADD COLUMN     "nationalite" TEXT,
ADD COLUMN     "relationName" TEXT,
ADD COLUMN     "relationTelephone" TEXT,
ADD COLUMN     "remarque" TEXT,
ADD COLUMN     "responsableId" TEXT,
ADD COLUMN     "situationFamiliale" "SituationFamiliale",
ADD COLUMN     "situationFinAnnee" "StatutFinAnnee" DEFAULT 'EN_COURS',
ADD COLUMN     "statut" "StatutEleve" NOT NULL DEFAULT 'ACTIF',
ALTER COLUMN "classeId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "HistoriqueClasse" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "statutFinAnnee" "StatutFinAnnee" DEFAULT 'EN_COURS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoriqueClasse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adresse" (
    "id" TEXT NOT NULL,
    "fokontany" TEXT,
    "logement" TEXT,
    "ville" TEXT,
    "region" TEXT,
    "pays" TEXT,
    "eleveId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adresse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionEleve" (
    "id" TEXT NOT NULL,
    "titre" TEXT,
    "lieu" TEXT,
    "secteur" TEXT,
    "eleveId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionEleve_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoriqueClasse_eleveId_idx" ON "HistoriqueClasse"("eleveId");

-- CreateIndex
CREATE INDEX "HistoriqueClasse_classeId_idx" ON "HistoriqueClasse"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoriqueClasse_eleveId_anneeScolaire_key" ON "HistoriqueClasse"("eleveId", "anneeScolaire");

-- CreateIndex
CREATE UNIQUE INDEX "Adresse_eleveId_key" ON "Adresse"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "Adresse_parentId_key" ON "Adresse"("parentId");

-- CreateIndex
CREATE INDEX "Adresse_eleveId_idx" ON "Adresse"("eleveId");

-- CreateIndex
CREATE INDEX "Adresse_parentId_idx" ON "Adresse"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionEleve_eleveId_key" ON "ProfessionEleve"("eleveId");

-- CreateIndex
CREATE INDEX "Eleve_statut_idx" ON "Eleve"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_schoolId_matricule_key" ON "Eleve"("schoolId", "matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_schoolId_nom_prenom_dateNaissance_key" ON "Eleve"("schoolId", "nom", "prenom", "dateNaissance");

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueClasse" ADD CONSTRAINT "HistoriqueClasse_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueClasse" ADD CONSTRAINT "HistoriqueClasse_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adresse" ADD CONSTRAINT "Adresse_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adresse" ADD CONSTRAINT "Adresse_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionEleve" ADD CONSTRAINT "ProfessionEleve_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;
