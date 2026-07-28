-- CreateEnum
CREATE TYPE "CourierStatus" AS ENUM ('OFFLINE', 'AVAILABLE', 'ON_DELIVERY');

-- CreateTable
CREATE TABLE "Courier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "status" "CourierStatus" NOT NULL DEFAULT 'OFFLINE',
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "courierId" TEXT;
ALTER TABLE "Order" ADD COLUMN "assignedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "pickedUpAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "failureReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Courier_phone_key" ON "Courier"("phone");

-- AddForeignKey
ALTER TABLE "Courier" ADD CONSTRAINT "Courier_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
