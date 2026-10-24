ALTER TABLE "Ecolage"
ADD COLUMN "dateEcheanceAJournee" TIMESTAMP(3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "AjournementLigne"
    WHERE "estActive" = true
    GROUP BY "ecolageId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate active AjournementLigne rows exist for an ecolage';
  END IF;
END $$;

CREATE UNIQUE INDEX "AjournementLigne_ecolageId_estActive_key"
ON "AjournementLigne"("ecolageId")
WHERE "estActive" = true;