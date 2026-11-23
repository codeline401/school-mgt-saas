-- AlterTable
ALTER TABLE "EleveAttachement" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "EleveAttachement_schoolId_eleveId_archivedAt_idx" ON "EleveAttachement"("schoolId", "eleveId", "archivedAt");
