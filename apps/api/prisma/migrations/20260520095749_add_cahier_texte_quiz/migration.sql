-- CreateEnum
CREATE TYPE "StatutQuiz" AS ENUM ('BROUILLON', 'PUBLIE', 'FERME');

-- CreateEnum
CREATE TYPE "TypeQuestion" AS ENUM ('QCM', 'VRAI_FAUX', 'REPONSE_COURTE');

-- CreateTable
CREATE TABLE "CahierTexte" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "detail" TEXT,
    "date" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT,
    "professeurId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CahierTexte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devoir" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateRendu" TEXT NOT NULL,
    "cahierTexteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devoir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT,
    "professeurId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "statut" "StatutQuiz" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "enonce" TEXT NOT NULL,
    "type" "TypeQuestion" NOT NULL,
    "options" TEXT[],
    "bonneReponse" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soumission" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "total" INTEGER NOT NULL,
    "soumisAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Soumission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reponse" (
    "id" TEXT NOT NULL,
    "soumissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "correcte" BOOLEAN,

    CONSTRAINT "Reponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CahierTexte_classeId_date_idx" ON "CahierTexte"("classeId", "date");

-- CreateIndex
CREATE INDEX "CahierTexte_professeurId_idx" ON "CahierTexte"("professeurId");

-- CreateIndex
CREATE INDEX "Devoir_cahierTexteId_idx" ON "Devoir"("cahierTexteId");

-- CreateIndex
CREATE INDEX "Quiz_classeId_idx" ON "Quiz"("classeId");

-- CreateIndex
CREATE INDEX "Quiz_professeurId_idx" ON "Quiz"("professeurId");

-- CreateIndex
CREATE UNIQUE INDEX "Soumission_quizId_eleveId_key" ON "Soumission"("quizId", "eleveId");

-- CreateIndex
CREATE UNIQUE INDEX "Reponse_soumissionId_questionId_key" ON "Reponse"("soumissionId", "questionId");

-- AddForeignKey
ALTER TABLE "CahierTexte" ADD CONSTRAINT "CahierTexte_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CahierTexte" ADD CONSTRAINT "CahierTexte_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CahierTexte" ADD CONSTRAINT "CahierTexte_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "Professeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CahierTexte" ADD CONSTRAINT "CahierTexte_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devoir" ADD CONSTRAINT "Devoir_cahierTexteId_fkey" FOREIGN KEY ("cahierTexteId") REFERENCES "CahierTexte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "Professeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Soumission" ADD CONSTRAINT "Soumission_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Soumission" ADD CONSTRAINT "Soumission_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reponse" ADD CONSTRAINT "Reponse_soumissionId_fkey" FOREIGN KEY ("soumissionId") REFERENCES "Soumission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reponse" ADD CONSTRAINT "Reponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
