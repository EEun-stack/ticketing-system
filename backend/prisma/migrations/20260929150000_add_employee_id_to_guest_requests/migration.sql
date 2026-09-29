ALTER TABLE "support_requests" ADD COLUMN "employeeId" TEXT;
ALTER TABLE "board_room_bookings" ADD COLUMN "employeeId" TEXT;

CREATE INDEX "support_requests_employeeId_idx" ON "support_requests"("employeeId");
CREATE INDEX "board_room_bookings_employeeId_idx" ON "board_room_bookings"("employeeId");