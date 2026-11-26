-- CreateEnum
CREATE TYPE "EleveAttachementType" AS ENUM ('CERTIFICAT_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'CERTIFICAT_MEDICAL', 'PIECE_IDENTITE_TUTEUR', 'AUTRE');

-- CreateEnum
CREATE TYPE "EleveAttachementStatus" AS ENUM ('PENDING_UPLOAD', 'READY');

-- CreateTable
CREATE TABLE "EleveAttachement" (
    "id" TEXT NOT NULL,
    "type" "EleveAttachementType" NOT NULL,
    "status" "EleveAttachementStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "objectKey" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EleveAttachement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EleveAttachement_objectKey_key" ON "EleveAttachement"("objectKey");

-- CreateIndex
CREATE INDEX "EleveAttachement_schoolId_eleveId_createdAt_idx" ON "EleveAttachement"("schoolId", "eleveId", "createdAt");

-- CreateIndex
CREATE INDEX "EleveAttachement_eleveId_status_idx" ON "EleveAttachement"("eleveId", "status");

-- AddForeignKey
ALTER TABLE "EleveAttachement" ADD CONSTRAINT "EleveAttachement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EleveAttachement" ADD CONSTRAINT "EleveAttachement_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EleveAttachement" ADD CONSTRAINT "EleveAttachement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
