-- AlterTable
ALTER TABLE "Classe" ADD COLUMN     "professeurPrincipalId" TEXT;

-- CreateIndex
CREATE INDEX "Classe_professeurPrincipalId_idx" ON "Classe"("professeurPrincipalId");

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_professeurPrincipalId_fkey" FOREIGN KEY ("professeurPrincipalId") REFERENCES "Professeur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
