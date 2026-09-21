-- CreateTable
CREATE TABLE "EcolageConfig" (
    "id" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "montantMensuel" DECIMAL(10,2) NOT NULL,
    "jourEcheance" INTEGER NOT NULL DEFAULT 10,
    "penaliteRetard" DECIMAL(10,2),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "EcolageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcolageEcheance" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcolageEcheance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EcolageConfig_schoolId_idx" ON "EcolageConfig"("schoolId");

-- CreateIndex
CREATE INDEX "EcolageConfig_classeId_idx" ON "EcolageConfig"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "EcolageConfig_classeId_anneeScolaire_key" ON "EcolageConfig"("classeId", "anneeScolaire");

-- CreateIndex
CREATE INDEX "EcolageEcheance_configId_idx" ON "EcolageEcheance"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "EcolageEcheance_configId_mois_key" ON "EcolageEcheance"("configId", "mois");

-- AddForeignKey
ALTER TABLE "EcolageConfig" ADD CONSTRAINT "EcolageConfig_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcolageConfig" ADD CONSTRAINT "EcolageConfig_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcolageConfig" ADD CONSTRAINT "EcolageConfig_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcolageConfig" ADD CONSTRAINT "EcolageConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcolageEcheance" ADD CONSTRAINT "EcolageEcheance_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EcolageConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
