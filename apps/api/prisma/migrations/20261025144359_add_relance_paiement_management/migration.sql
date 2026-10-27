-- CreateEnum
CREATE TYPE "TypeRelance" AS ENUM ('MANUELLE', 'AUTOMATIQUE');

-- CreateEnum
CREATE TYPE "CanalRelance" AS ENUM ('NOTIFICATION', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CiblageRelance" AS ENUM ('ELEVES', 'CLASSE', 'TOUS_RETARDS');

-- CreateEnum
CREATE TYPE "StatutRelance" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'ENVOYE', 'ECHOUE', 'ANNULEE');

-- CreateTable
CREATE TABLE "RelancePaiement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" "TypeRelance" NOT NULL,
    "canal" "CanalRelance" NOT NULL,
    "ciblage" "CiblageRelance" NOT NULL,
    "cibleIds" TEXT[],
    "message" TEXT NOT NULL,
    "statut" "StatutRelance" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateProgrammee" TIMESTAMP(3),
    "dateExecution" TIMESTAMP(3),
    "recurrent" BOOLEAN NOT NULL DEFAULT false,
    "jourMois" INTEGER,
    "nbDestinataires" INTEGER NOT NULL DEFAULT 0,
    "nbEchecs" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelancePaiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelancePaiement_schoolId_statut_idx" ON "RelancePaiement"("schoolId", "statut");

-- CreateIndex
CREATE INDEX "RelancePaiement_statut_dateProgrammee_idx" ON "RelancePaiement"("statut", "dateProgrammee");

-- AddForeignKey
ALTER TABLE "RelancePaiement" ADD CONSTRAINT "RelancePaiement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelancePaiement" ADD CONSTRAINT "RelancePaiement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
