-- ============================================================
-- Corrective migration for admin module
-- ============================================================

-- 1. Add missing timestamp columns to Parent (added in schema but missing from initial migration)
--    updatedAt has no DB default — Prisma's @updatedAt manages it at the application layer
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Drop the spurious DB default so only Prisma controls the value going forward
ALTER TABLE "Parent" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- 3. Add CHECK constraint to Contrat: exactly one of professeurId or userId must be set
--    Consolidated: drop any weak existing constraint and add the strict XOR version atomically.
DO $$
BEGIN
  ALTER TABLE "Contrat" DROP CONSTRAINT IF EXISTS "Contrat_person_check";
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Contrat_exactly_one_target_chk'
  ) THEN
    ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_exactly_one_target_chk"
      CHECK (
        (CASE WHEN "professeurId" IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 0 END) = 1
      );
  END IF;
END $$;

-- 2. Add missing updatedAt column to Remplacement (omitted from initial migration)
ALTER TABLE "Remplacement" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Remplacement" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- 4. Backfill stray userId into remplacantUserId where it is not yet set,
--    then drop the column that was added by mistake in migration 20260428043030.
--    Guard: only run the UPDATE if the column actually exists (it may have already been removed).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Remplacement' AND column_name = 'userId'
  ) THEN
    UPDATE "Remplacement"
       SET "remplacantUserId" = "userId"
     WHERE "remplacantUserId" IS NULL
       AND "userId" IS NOT NULL;
  END IF;
END $$;
ALTER TABLE "Remplacement" DROP COLUMN IF EXISTS "userId";

-- 5. Preflight duplicate detection: raise an exception listing offending rows if any
--    column group contains duplicates that would violate the indexes about to be created.
DO $$
DECLARE dup_info TEXT;
BEGIN
  SELECT string_agg('"schoolId"=' || "schoolId" || ' nom=' || nom, ', ') INTO dup_info
    FROM (SELECT "schoolId", nom FROM "Classe" GROUP BY "schoolId", nom HAVING COUNT(*) > 1) t;
  IF dup_info IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot create Classe_schoolId_nom_key: duplicate (schoolId,nom) groups found [%]. Resolve duplicates before running this migration.', dup_info;
  END IF;
END $$;

DO $$
DECLARE dup_info TEXT;
BEGIN
  SELECT string_agg('"schoolId"=' || "schoolId" || ' nom=' || nom || ' prenom=' || prenom, ', ') INTO dup_info
    FROM (SELECT "schoolId", nom, prenom FROM "Eleve" GROUP BY "schoolId", nom, prenom HAVING COUNT(*) > 1) t;
  IF dup_info IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot create Eleve_schoolId_nom_prenom_key: duplicate (schoolId,nom,prenom) groups found [%]. Resolve duplicates before running this migration.', dup_info;
  END IF;
END $$;

DO $$
DECLARE dup_info TEXT;
BEGIN
  SELECT string_agg('"schoolId"=' || "schoolId" || ' nom=' || nom || ' prenom=' || prenom, ', ') INTO dup_info
    FROM (SELECT "schoolId", nom, prenom FROM "Professeur" GROUP BY "schoolId", nom, prenom HAVING COUNT(*) > 1) t;
  IF dup_info IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot create Professeur_schoolId_nom_prenom_key: duplicate (schoolId,nom,prenom) groups found [%]. Resolve duplicates before running this migration.', dup_info;
  END IF;
END $$;

-- Add tenantKey to School: stable technical identifier, distinct from the display name.
-- Existing rows receive a generated UUID; new rows use Prisma's @default(cuid()) value.
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "tenantKey" TEXT;
UPDATE "School" SET "tenantKey" = gen_random_uuid()::TEXT WHERE "tenantKey" IS NULL;
ALTER TABLE "School" ALTER COLUMN "tenantKey" SET NOT NULL;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "School_tenantKey_key"              ON "School"("tenantKey");
CREATE UNIQUE INDEX IF NOT EXISTS "Classe_schoolId_nom_key"            ON "Classe"("schoolId", "nom");
CREATE UNIQUE INDEX IF NOT EXISTS "Eleve_schoolId_nom_prenom_key"      ON "Eleve"("schoolId", "nom", "prenom");
CREATE UNIQUE INDEX IF NOT EXISTS "Professeur_schoolId_nom_prenom_key" ON "Professeur"("schoolId", "nom", "prenom");
