-- CreateEnum
CREATE TYPE "DeliberationStatut" AS ENUM ('BROUILLON', 'VALIDEE');

-- CreateEnum
CREATE TYPE "DecisionPassage" AS ENUM ('PASSE', 'REDOUBLE', 'ORIENTE', 'EXCLU');

-- CreateEnum
CREATE TYPE "MentionDeliberation" AS ENUM ('AUCUNE', 'ENCOURAGEMENT', 'TABLEAU_HONNEUR', 'FELICITATIONS');

-- CreateEnum
CREATE TYPE "AvertissementDeliberation" AS ENUM ('AUCUN', 'TRAVAIL', 'CONDUITE', 'RETARDS', 'DISCIPLINE', 'GENERAL');

-- CreateTable
CREATE TABLE "DeliberationSession" (
    "id" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "periodeLabel" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "statut" "DeliberationStatut" NOT NULL DEFAULT 'BROUILLON',
    "compteRendu" TEXT,
    "createdById" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "validatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliberationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliberationDecision" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "decision" "DecisionPassage" NOT NULL,
    "mention" "MentionDeliberation" NOT NULL DEFAULT 'AUCUNE',
    "avertissement" "AvertissementDeliberation" NOT NULL DEFAULT 'AUCUN',
    "commetaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliberationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliberationSession_schoolId_idx" ON "DeliberationSession"("schoolId");

-- CreateIndex
CREATE INDEX "DeliberationSession_classeId_idx" ON "DeliberationSession"("classeId");

-- CreateIndex
CREATE INDEX "DeliberationSession_statut_idx" ON "DeliberationSession"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "DeliberationSession_classeId_periodeLabel_anneeScolaire_key" ON "DeliberationSession"("classeId", "periodeLabel", "anneeScolaire");

-- CreateIndex
CREATE INDEX "DeliberationDecision_sessionId_idx" ON "DeliberationDecision"("sessionId");

-- CreateIndex
CREATE INDEX "DeliberationDecision_eleveId_idx" ON "DeliberationDecision"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliberationDecision_sessionId_eleveId_key" ON "DeliberationDecision"("sessionId", "eleveId");

-- AddForeignKey
ALTER TABLE "DeliberationSession" ADD CONSTRAINT "DeliberationSession_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationSession" ADD CONSTRAINT "DeliberationSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationSession" ADD CONSTRAINT "DeliberationSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationSession" ADD CONSTRAINT "DeliberationSession_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationDecision" ADD CONSTRAINT "DeliberationDecision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DeliberationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationDecision" ADD CONSTRAINT "DeliberationDecision_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;
