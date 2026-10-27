ALTER TABLE "employee_directory"
ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '$2b$12$KQ16oKQPa12h4AJJ6.sKrOztqBb7Pfn3a2ZXAl3CB4KOZ3XzLnha.';

ALTER TABLE "employee_directory"
ALTER COLUMN "passwordHash" DROP DEFAULT;
