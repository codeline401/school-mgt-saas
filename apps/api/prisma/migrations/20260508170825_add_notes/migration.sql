-- DropForeignKey
ALTER TABLE "Matiere" DROP CONSTRAINT "Matiere_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Matiere" DROP CONSTRAINT "Matiere_schoolId_fkey";

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "note" DECIMAL(65,30) NOT NULL,
    "noteMax" DECIMAL(65,30) NOT NULL DEFAULT 20,
    "coefficient" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "commentaire" TEXT,
    "feuillePath" TEXT,
    "eleveId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_classeId_idx" ON "Note"("classeId");

-- CreateIndex
CREATE INDEX "Note_matiereId_idx" ON "Note"("matiereId");

-- CreateIndex
CREATE INDEX "Note_schoolId_idx" ON "Note"("schoolId");

-- CreateIndex
CREATE INDEX "Note_eleveId_idx" ON "Note"("eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_eleveId_matiereId_titre_key" ON "Note"("eleveId", "matiereId", "titre");

-- AddForeignKey
ALTER TABLE "Matiere" ADD CONSTRAINT "Matiere_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matiere" ADD CONSTRAINT "Matiere_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
