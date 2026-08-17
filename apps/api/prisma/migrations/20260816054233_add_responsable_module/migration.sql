/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,nom,prenom]` on the table `Eleve` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TypeResponsable" AS ENUM ('PARENT', 'TUTEUR');

-- DropIndex
DROP INDEX "Eleve_schoolId_nom_prenom_dateNaissance_null_partial_key";

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "type" "TypeResponsable" NOT NULL DEFAULT 'PARENT';

-- CreateTable
CREATE TABLE "ResponsableEleve" (
    "id" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponsableEleve_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResponsableEleve_responsableId_idx" ON "ResponsableEleve"("responsableId");

-- CreateIndex
CREATE INDEX "ResponsableEleve_eleveId_idx" ON "ResponsableEleve"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsableEleve_responsableId_eleveId_key" ON "ResponsableEleve"("responsableId", "eleveId");

-- CreateIndex
CREATE INDEX "Eleve_schoolId_deletedAt_idx" ON "Eleve"("schoolId", "deletedAt");

-- AddForeignKey
ALTER TABLE "ResponsableEleve" ADD CONSTRAINT "ResponsableEleve_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsableEleve" ADD CONSTRAINT "ResponsableEleve_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;
