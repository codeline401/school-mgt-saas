/*
  Warnings:

  - You are about to drop the column `defaultWatermark` on the `BulletinTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `primaryColor` on the `BulletinTemplate` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "TypePeriode" ADD VALUE 'AUTRE';

-- AlterTable
ALTER TABLE "BulletinTemplate" DROP COLUMN "defaultWatermark",
DROP COLUMN "primaryColor";

-- AlterTable
ALTER TABLE "Periode" ALTER COLUMN "type" SET DEFAULT 'TRIMESTRE',
ALTER COLUMN "dateDebut" DROP NOT NULL,
ALTER COLUMN "dateFin" DROP NOT NULL;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "telephone" TEXT;
