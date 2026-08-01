/*
  Warnings:

  - You are about to drop the column `emprunterId` on the `PretEquipement` table. All the data in the column will be lost.
  - You are about to drop the column `emprunterNom` on the `PretEquipement` table. All the data in the column will be lost.
  - You are about to drop the column `emprunterType` on the `PretEquipement` table. All the data in the column will be lost.
  - Added the required column `emprunteurNom` to the `PretEquipement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emprunteurType` to the `PretEquipement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PretEquipement" RENAME COLUMN "emprunterId" TO "emprunteurId";
ALTER TABLE "PretEquipement" RENAME COLUMN "emprunterNom" TO "emprunteurNom";
ALTER TABLE "PretEquipement" RENAME COLUMN "emprunterType" TO "emprunteurType";
