CREATE TABLE "employee_directory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_directory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_directory_employeeId_key" ON "employee_directory"("employeeId");
CREATE UNIQUE INDEX "employee_directory_email_key" ON "employee_directory"("email");