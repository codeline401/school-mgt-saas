-- DropForeignKey
ALTER TABLE "BilletEntree" DROP CONSTRAINT "BilletEntree_createdById_fkey";

-- DropForeignKey
ALTER TABLE "JustificationAbsence" DROP CONSTRAINT "JustificationAbsence_createdById_fkey";

-- AddForeignKey
ALTER TABLE "JustificationAbsence" ADD CONSTRAINT "JustificationAbsence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilletEntree" ADD CONSTRAINT "BilletEntree_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
