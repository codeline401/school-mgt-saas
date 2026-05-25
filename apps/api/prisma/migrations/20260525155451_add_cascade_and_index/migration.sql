-- DropForeignKey
ALTER TABLE "CahierTexte" DROP CONSTRAINT "CahierTexte_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_schoolId_fkey";

-- CreateIndex
CREATE INDEX "Question_quizId_idx" ON "Question"("quizId");

-- AddForeignKey
ALTER TABLE "CahierTexte" ADD CONSTRAINT "CahierTexte_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
