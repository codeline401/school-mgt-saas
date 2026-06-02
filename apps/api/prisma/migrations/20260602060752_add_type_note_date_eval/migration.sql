-- CreateEnum
CREATE TYPE "TypeNote" AS ENUM ('INTERROGATION', 'DS', 'EXAMEN', 'AUTRE');

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "dateEval" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "typeNote" "TypeNote" NOT NULL DEFAULT 'AUTRE';

-- CreateIndex
CREATE INDEX "Note_typeNote_idx" ON "Note"("typeNote");

-- CreateIndex
CREATE INDEX "Note_dateEval_idx" ON "Note"("dateEval");
