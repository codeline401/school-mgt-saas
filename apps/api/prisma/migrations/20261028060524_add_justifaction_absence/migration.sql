-- AlterTable
ALTER TABLE "Presence" ADD COLUMN     "justificationAbsenceId" TEXT;

-- CreateTable
CREATE TABLE "JustificationAbsence" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "fichierNom" TEXT NOT NULL,
    "fichierPath" TEXT NOT NULL,
    "fichierMime" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JustificationAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BilletEntree" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "justificationId" TEXT NOT NULL,
    "creneauId" TEXT NOT NULL,
    "dateValidite" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BilletEntree_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JustificationAbsence_schoolId_eleveId_idx" ON "JustificationAbsence"("schoolId", "eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "BilletEntree_numero_key" ON "BilletEntree"("numero");

-- CreateIndex
CREATE INDEX "BilletEntree_justificationId_idx" ON "BilletEntree"("justificationId");

-- CreateIndex
CREATE UNIQUE INDEX "BilletEntree_eleveId_creneauId_dateValidite_key" ON "BilletEntree"("eleveId", "creneauId", "dateValidite");

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_justificationAbsenceId_fkey" FOREIGN KEY ("justificationAbsenceId") REFERENCES "JustificationAbsence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JustificationAbsence" ADD CONSTRAINT "JustificationAbsence_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JustificationAbsence" ADD CONSTRAINT "JustificationAbsence_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JustificationAbsence" ADD CONSTRAINT "JustificationAbsence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilletEntree" ADD CONSTRAINT "BilletEntree_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilletEntree" ADD CONSTRAINT "BilletEntree_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilletEntree" ADD CONSTRAINT "BilletEntree_justificationId_fkey" FOREIGN KEY ("justificationId") REFERENCES "JustificationAbsence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilletEntree" ADD CONSTRAINT "BilletEntree_creneauId_fkey" FOREIGN KEY ("creneauId") REFERENCES "CreneauHoraire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilletEntree" ADD CONSTRAINT "BilletEntree_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
