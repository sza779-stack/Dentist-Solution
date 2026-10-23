-- CreateEnum
CREATE TYPE "ToothNotation" AS ENUM ('UNIVERSAL', 'FDI');

-- CreateEnum
CREATE TYPE "ToothTreatmentStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "tooth_treatments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "toothNumber" TEXT NOT NULL,
    "notation" "ToothNotation" NOT NULL DEFAULT 'UNIVERSAL',
    "surfaces" TEXT[],
    "diagnosis" TEXT,
    "treatmentType" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ToothTreatmentStatus" NOT NULL DEFAULT 'PLANNED',
    "cost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tooth_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tooth_treatment_attachments" (
    "id" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tooth_treatment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tooth_treatments_patientId_idx" ON "tooth_treatments"("patientId");

-- CreateIndex
CREATE INDEX "tooth_treatments_doctorId_idx" ON "tooth_treatments"("doctorId");

-- CreateIndex
CREATE INDEX "tooth_treatments_appointmentId_idx" ON "tooth_treatments"("appointmentId");

-- CreateIndex
CREATE INDEX "tooth_treatment_attachments_treatmentId_idx" ON "tooth_treatment_attachments"("treatmentId");

-- AddForeignKey
ALTER TABLE "tooth_treatments" ADD CONSTRAINT "tooth_treatments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooth_treatments" ADD CONSTRAINT "tooth_treatments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooth_treatments" ADD CONSTRAINT "tooth_treatments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tooth_treatment_attachments" ADD CONSTRAINT "tooth_treatment_attachments_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "tooth_treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
