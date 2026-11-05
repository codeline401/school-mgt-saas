-- CreateEnum
CREATE TYPE "TypesSanction" AS ENUM ('AVERTISSEMENT', 'BLAME', 'RETENUE', 'EXCLUSION_TEMPORAIRE', 'CONVOCATION_PARENT', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutSanction" AS ENUM ('EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateTable
CREATE TABLE "SanctionEleve" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" "TypesSanction" NOT NULL,
    "motif" TEXT NOT NULL,
    "details" TEXT,
    "dateSanction" DATE NOT NULL,
    "dateFin" DATE,
    "statut" "StatutSanction" NOT NULL DEFAULT 'EN_COURS',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanctionEleve_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SanctionEleve_schoolId_dateSanction_idx" ON "SanctionEleve"("schoolId", "dateSanction");

-- CreateIndex
CREATE INDEX "SanctionEleve_eleveId_statut_idx" ON "SanctionEleve"("eleveId", "statut");

-- AddForeignKey
ALTER TABLE "SanctionEleve" ADD CONSTRAINT "SanctionEleve_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanctionEleve" ADD CONSTRAINT "SanctionEleve_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanctionEleve" ADD CONSTRAINT "SanctionEleve_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
