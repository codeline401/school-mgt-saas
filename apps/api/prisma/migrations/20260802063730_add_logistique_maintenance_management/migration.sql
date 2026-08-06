/*
  Warnings:

  - A unique constraint covering the columns `[numeroSerie]` on the table `Equipement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TypeTicket" AS ENUM ('EQUIPEMENT', 'BATIMENT', 'SALLE', 'RESEAU', 'PLOMBERIE', 'ELECTRICITE', 'MOBILIER', 'AUTRE');

-- CreateEnum
CREATE TYPE "PrioriteTicket" AS ENUM ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatutTicket" AS ENUM ('OUVERT', 'EN_COURS', 'RESOLU', 'FERME', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeLocalisation" AS ENUM ('SALLE', 'BATIMENT', 'EQUIPEMENT');

-- CreateEnum
CREATE TYPE "StatutIntervention" AS ENUM ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- DropIndex
DROP INDEX "Equipement_schoolId_numeroSerie_key";

-- CreateTable
CREATE TABLE "TicketMaintenance" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" "TypeTicket" NOT NULL DEFAULT 'AUTRE',
    "priorite" "PrioriteTicket" NOT NULL DEFAULT 'NORMALE',
    "statut" "StatutTicket" NOT NULL DEFAULT 'OUVERT',
    "localisationId" TEXT,
    "typeLocalisation" "TypeLocalisation",
    "localisationNom" TEXT,
    "dateOuverture" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateResolution" TIMESTAMP(3),
    "creeParId" TEXT NOT NULL,
    "assigneAId" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionMaintenance" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "technicienId" TEXT NOT NULL,
    "description" TEXT,
    "observations" TEXT,
    "statut" "StatutIntervention" NOT NULL DEFAULT 'PLANIFIEE',
    "cout" DECIMAL(10,2),
    "piecesUtilisees" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "InterventionMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketMaintenance_schoolId_idx" ON "TicketMaintenance"("schoolId");

-- CreateIndex
CREATE INDEX "TicketMaintenance_schoolId_statut_idx" ON "TicketMaintenance"("schoolId", "statut");

-- CreateIndex
CREATE INDEX "TicketMaintenance_schoolId_priorite_idx" ON "TicketMaintenance"("schoolId", "priorite");

-- CreateIndex
CREATE INDEX "TicketMaintenance_creeParId_idx" ON "TicketMaintenance"("creeParId");

-- CreateIndex
CREATE INDEX "TicketMaintenance_assigneAId_idx" ON "TicketMaintenance"("assigneAId");

-- CreateIndex
CREATE INDEX "InterventionMaintenance_schoolId_idx" ON "InterventionMaintenance"("schoolId");

-- CreateIndex
CREATE INDEX "InterventionMaintenance_ticketId_idx" ON "InterventionMaintenance"("ticketId");

-- CreateIndex
CREATE INDEX "InterventionMaintenance_technicienId_idx" ON "InterventionMaintenance"("technicienId");

-- CreateIndex
CREATE INDEX "InterventionMaintenance_statut_idx" ON "InterventionMaintenance"("statut");

-- CreateIndex
CREATE INDEX "InterventionMaintenance_dateDebut_idx" ON "InterventionMaintenance"("dateDebut");

-- CreateIndex
CREATE UNIQUE INDEX "Equipement_numeroSerie_key" ON "Equipement"("numeroSerie");

-- AddForeignKey
ALTER TABLE "TicketMaintenance" ADD CONSTRAINT "TicketMaintenance_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMaintenance" ADD CONSTRAINT "TicketMaintenance_assigneAId_fkey" FOREIGN KEY ("assigneAId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMaintenance" ADD CONSTRAINT "TicketMaintenance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionMaintenance" ADD CONSTRAINT "InterventionMaintenance_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketMaintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionMaintenance" ADD CONSTRAINT "InterventionMaintenance_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionMaintenance" ADD CONSTRAINT "InterventionMaintenance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionMaintenance" ADD CONSTRAINT "InterventionMaintenance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
