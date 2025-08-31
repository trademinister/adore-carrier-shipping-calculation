/*
  Warnings:

  - A unique constraint covering the columns `[locationId]` on the table `PickupMethods` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PickupMethods_locationId_key" ON "PickupMethods"("locationId");
