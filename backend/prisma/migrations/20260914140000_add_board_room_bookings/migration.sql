CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');

CREATE TABLE "board_room_bookings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "attendees" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_room_bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "board_room_bookings_date_idx" ON "board_room_bookings"("date");
CREATE INDEX "board_room_bookings_status_idx" ON "board_room_bookings"("status");