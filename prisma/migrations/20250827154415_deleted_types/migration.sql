/*
  Warnings:

  - You are about to drop the column `type` on the `PickupMethods` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ShippingMethod` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PickupMethods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "PickupMethods_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PickupMethods" ("description", "id", "locationId", "name", "sessionId") SELECT "description", "id", "locationId", "name", "sessionId" FROM "PickupMethods";
DROP TABLE "PickupMethods";
ALTER TABLE "new_PickupMethods" RENAME TO "PickupMethods";
CREATE TABLE "new_ShippingMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "ShippingMethod_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ShippingMethod" ("description", "id", "name", "sessionId") SELECT "description", "id", "name", "sessionId" FROM "ShippingMethod";
DROP TABLE "ShippingMethod";
ALTER TABLE "new_ShippingMethod" RENAME TO "ShippingMethod";
CREATE UNIQUE INDEX "ShippingMethod_sessionId_key" ON "ShippingMethod"("sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
