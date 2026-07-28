/*
  Warnings:

  - The values [FOURNITURES_SCLOLAIRES] on the enum `CategorieArticle` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CategorieArticle_new" AS ENUM ('FOURNITURES_SCOLAIRES', 'MATERIEL_PEDAGOGIQUE', 'MATERIEL_INFORMATIQUE', 'EQUIPEMENT_SPORTIF', 'CONSOMMABLES', 'IMMOBILIERS', 'AUTRE');
ALTER TABLE "public"."ArticleStock" ALTER COLUMN "categorie" DROP DEFAULT;
ALTER TABLE "ArticleStock" ALTER COLUMN "categorie" TYPE "CategorieArticle_new" USING ("categorie"::text::"CategorieArticle_new");
ALTER TYPE "CategorieArticle" RENAME TO "CategorieArticle_old";
ALTER TYPE "CategorieArticle_new" RENAME TO "CategorieArticle";
DROP TYPE "public"."CategorieArticle_old";
ALTER TABLE "ArticleStock" ALTER COLUMN "categorie" SET DEFAULT 'FOURNITURES_SCOLAIRES';
COMMIT;

-- AlterTable
ALTER TABLE "ArticleStock" ALTER COLUMN "categorie" SET DEFAULT 'FOURNITURES_SCOLAIRES';
