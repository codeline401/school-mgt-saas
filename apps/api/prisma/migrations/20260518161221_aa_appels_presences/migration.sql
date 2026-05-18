-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('PRESENT', 'ABSENT', 'RETARD');

-- CreateTable
CREATE TABLE "Appel" (
    "id" TEXT NOT NULL,
    "creneauId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "appelId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "statut" "StatutPresence" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appel_schoolId_idx" ON "Appel"("schoolId");

-- CreateIndex
CREATE INDEX "Appel_classeId_idx" ON "Appel"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "Appel_creneauId_date_key" ON "Appel"("creneauId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_appelId_eleveId_key" ON "Presence"("appelId", "eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_appelId_key" ON "Presence"("appelId");

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_creneauId_fkey" FOREIGN KEY ("creneauId") REFERENCES "CreneauHoraire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_appelId_fkey" FOREIGN KEY ("appelId") REFERENCES "Appel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;
