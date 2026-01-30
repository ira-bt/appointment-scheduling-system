-- This migration is already applied to the database
-- Added unique constraint to prevent double booking

CREATE UNIQUE INDEX IF NOT EXISTS
"Appointment_doctorId_appointmentStart_key"
ON "Appointment"("doctorId", "appointmentStart");
