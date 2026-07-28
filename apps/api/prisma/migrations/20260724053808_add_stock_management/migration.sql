-- CreateEnum
CREATE TYPE "CategorieArticle" AS ENUM ('FOURNITURES_SCLOLAIRES', 'MATERIEL_PEDAGOGIQUE', 'MATERIEL_INFORMATIQUE', 'EQUIPEMENT_SPORTIF', 'CONSOMMABLES', 'IMMOBILIERS', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeMouvement" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT', 'TRANSFERT');

-- CreateTable
CREATE TABLE "ArticleStock" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "categorie" "CategorieArticle" NOT NULL DEFAULT 'FOURNITURES_SCLOLAIRES',
    "quantite" INTEGER NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'unité',
    "seuilMinimal" INTEGER NOT NULL,
    "seuilOptimal" INTEGER NOT NULL,
    "prixUnitaire" DECIMAL(65,30),
    "emplacement" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementStock" (
    "id" TEXT NOT NULL,
    "type" "TypeMouvement" NOT NULL,
    "quantite" INTEGER NOT NULL,
    "articleId" TEXT NOT NULL,
    "motif" TEXT,
    "reference" TEXT,
    "cout" DECIMAL(10,2),
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleStock_schoolId_idx" ON "ArticleStock"("schoolId");

-- CreateIndex
CREATE INDEX "ArticleStock_schoolId_categorie_idx" ON "ArticleStock"("schoolId", "categorie");

-- CreateIndex
CREATE INDEX "ArticleStock_schoolId_quantite_idx" ON "ArticleStock"("schoolId", "quantite");

-- CreateIndex
CREATE INDEX "MouvementStock_schoolId_idx" ON "MouvementStock"("schoolId");

-- CreateIndex
CREATE INDEX "MouvementStock_articleId_idx" ON "MouvementStock"("articleId");

-- CreateIndex
CREATE INDEX "MouvementStock_schoolId_type_idx" ON "MouvementStock"("schoolId", "type");

-- CreateIndex
CREATE INDEX "MouvementStock_schoolId_createdAt_idx" ON "MouvementStock"("schoolId", "createdAt");

-- AddForeignKey
ALTER TABLE "ArticleStock" ADD CONSTRAINT "ArticleStock_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ArticleStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
