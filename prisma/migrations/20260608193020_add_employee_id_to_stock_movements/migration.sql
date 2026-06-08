/*
  Warnings:

  - You are about to drop the column `user_id` on the `stock_movements` table. All the data in the column will be lost.
  - Added the required column `employee_id` to the `stock_movements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stock_movements" DROP COLUMN "user_id",
ADD COLUMN     "employee_id" UUID NOT NULL;
