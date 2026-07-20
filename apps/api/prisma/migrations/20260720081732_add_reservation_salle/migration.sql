-- CreateEnum
CREATE TYPE "StatutReservation" AS ENUM ('EN_ATTENTE', 'APPROUVEE', 'REFUSEE', 'ANNULEE');

-- CreateTable
CREATE TABLE "ReservationSalle" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "statut" "StatutReservation" NOT NULL DEFAULT 'EN_ATTENTE',
    "salleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "motifRefus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationSalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationSalle_schoolId_idx" ON "ReservationSalle"("schoolId");

-- CreateIndex
CREATE INDEX "ReservationSalle_schoolId_salleId_idx" ON "ReservationSalle"("schoolId", "salleId");

-- CreateIndex
CREATE INDEX "ReservationSalle_schoolId_userId_idx" ON "ReservationSalle"("schoolId", "userId");

-- CreateIndex
CREATE INDEX "ReservationSalle_schoolId_dateDebut_dateFin_idx" ON "ReservationSalle"("schoolId", "dateDebut", "dateFin");

-- CreateIndex
CREATE INDEX "ReservationSalle_schoolId_statut_idx" ON "ReservationSalle"("schoolId", "statut");

-- AddForeignKey
ALTER TABLE "ReservationSalle" ADD CONSTRAINT "ReservationSalle_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "Salle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSalle" ADD CONSTRAINT "ReservationSalle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSalle" ADD CONSTRAINT "ReservationSalle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
