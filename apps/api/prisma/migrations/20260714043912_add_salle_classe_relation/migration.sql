-- AlterTable
ALTER TABLE "Salle" ADD COLUMN     "classeId" TEXT;

-- AddForeignKey
ALTER TABLE "Salle" ADD CONSTRAINT "Salle_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
