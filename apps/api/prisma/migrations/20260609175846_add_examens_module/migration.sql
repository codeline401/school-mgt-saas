-- CreateEnum
CREATE TYPE "ExamenStatut" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE', 'REPORTE', 'ANNULE');

-- CreateTable
CREATE TABLE "ExamenSalle" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "capacite" INTEGER,
    "location" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamenSalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamenSession" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT,
    "salleId" TEXT,
    "schoolId" TEXT NOT NULL,
    "dateExamen" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "statut" "ExamenStatut" NOT NULL DEFAULT 'PLANIFIE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamenSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamenSurveillance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamenSurveillance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamenIncident" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamenIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamenSalle_schoolId_idx" ON "ExamenSalle"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamenSalle_schoolId_nom_key" ON "ExamenSalle"("schoolId", "nom");

-- CreateIndex
CREATE INDEX "ExamenSession_schoolId_idx" ON "ExamenSession"("schoolId");

-- CreateIndex
CREATE INDEX "ExamenSession_classeId_dateExamen_idx" ON "ExamenSession"("classeId", "dateExamen");

-- CreateIndex
CREATE INDEX "ExamenSession_statut_idx" ON "ExamenSession"("statut");

-- CreateIndex
CREATE INDEX "ExamenSurveillance_userId_idx" ON "ExamenSurveillance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamenSurveillance_sessionId_userId_key" ON "ExamenSurveillance"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "ExamenIncident_sessionId_createdAt_idx" ON "ExamenIncident"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "ExamenSalle" ADD CONSTRAINT "ExamenSalle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenSession" ADD CONSTRAINT "ExamenSession_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenSession" ADD CONSTRAINT "ExamenSession_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenSession" ADD CONSTRAINT "ExamenSession_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "ExamenSalle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenSession" ADD CONSTRAINT "ExamenSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenSession" ADD CONSTRAINT "ExamenSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenSurveillance" ADD CONSTRAINT "ExamenSurveillance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamenSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenSurveillance" ADD CONSTRAINT "ExamenSurveillance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenIncident" ADD CONSTRAINT "ExamenIncident_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamenSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenIncident" ADD CONSTRAINT "ExamenIncident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
