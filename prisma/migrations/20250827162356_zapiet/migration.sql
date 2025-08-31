/*
  Warnings:

  - You are about to drop the column `zepietId` on the `PickupMethods` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PickupMethods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "zapietId" TEXT,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "PickupMethods_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PickupMethods" ("description", "id", "locationId", "name", "sessionId") SELECT "description", "id", "locationId", "name", "sessionId" FROM "PickupMethods";
DROP TABLE "PickupMethods";
ALTER TABLE "new_PickupMethods" RENAME TO "PickupMethods";
CREATE UNIQUE INDEX "PickupMethods_locationId_key" ON "PickupMethods"("locationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
