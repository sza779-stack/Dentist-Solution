-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "assignedDoctorId" TEXT;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
