/*
  Warnings:

  - You are about to alter the column `salaire` on the `Contrat` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - Added the required column `updatedAt` to the `Classe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Eleve` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Professeur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Classe" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Contrat" ALTER COLUMN "salaire" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Professeur" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Matiere" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "classeId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matiere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Matiere_schoolId_idx" ON "Matiere"("schoolId");

-- CreateIndex
CREATE INDEX "Matiere_classeId_idx" ON "Matiere"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "Matiere_schoolId_nom_key" ON "Matiere"("schoolId", "nom");

-- CreateIndex
CREATE INDEX "Contrat_schoolId_idx" ON "Contrat"("schoolId");

-- CreateIndex
CREATE INDEX "Contrat_professeurId_idx" ON "Contrat"("professeurId");

-- CreateIndex
CREATE INDEX "Contrat_userId_idx" ON "Contrat"("userId");

-- CreateIndex
CREATE INDEX "DossierAdmission_schoolId_idx" ON "DossierAdmission"("schoolId");

-- CreateIndex
CREATE INDEX "DossierAdmission_statut_idx" ON "DossierAdmission"("statut");

-- CreateIndex
CREATE INDEX "Eleve_schoolId_idx" ON "Eleve"("schoolId");

-- CreateIndex
CREATE INDEX "Eleve_classeId_idx" ON "Eleve"("classeId");

-- CreateIndex
CREATE INDEX "Eleve_parentId_idx" ON "Eleve"("parentId");

-- CreateIndex
CREATE INDEX "Parent_schoolId_idx" ON "Parent"("schoolId");

-- CreateIndex
CREATE INDEX "Professeur_schoolId_idx" ON "Professeur"("schoolId");

-- CreateIndex
CREATE INDEX "Remplacement_schoolId_idx" ON "Remplacement"("schoolId");

-- CreateIndex
CREATE INDEX "Remplacement_professeurAbsentId_idx" ON "Remplacement"("professeurAbsentId");

-- CreateIndex
CREATE INDEX "Remplacement_date_idx" ON "Remplacement"("date");

-- AddForeignKey
ALTER TABLE "Matiere" ADD CONSTRAINT "Matiere_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matiere" ADD CONSTRAINT "Matiere_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
