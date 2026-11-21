-- CreateTable
CREATE TABLE "OffreCantine" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "anneeScolaire" TEXT NOT NULL,
    "tarifMensuel" DECIMAL(10,2) NOT NULL,
    "joursSemaine" "JourSemaine"[],
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffreCantine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OffreCantine_schoolId_actif_idx" ON "OffreCantine"("schoolId", "actif");

-- CreateIndex
CREATE UNIQUE INDEX "OffreCantine_schoolId_nom_anneeScolaire_key" ON "OffreCantine"("schoolId", "nom", "anneeScolaire");

-- AddForeignKey
ALTER TABLE "OffreCantine" ADD CONSTRAINT "OffreCantine_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
