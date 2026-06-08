/*
  Warnings:

  - You are about to drop the column `user_id` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `cpf_encrypted` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `cpf_hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastname` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id]` on the table `addresses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `district` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_id` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Mechanic', 'Attendant', 'Admin', 'Manager');

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_user_id_fkey";

-- DropIndex
DROP INDEX "addresses_user_id_key";

-- DropIndex
DROP INDEX "users_cpf_hash_key";

-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "user_id",
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "employee_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "cpf_encrypted",
DROP COLUMN "cpf_hash",
DROP COLUMN "lastname",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "employees" (
    "employee_id" UUID NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(11) NOT NULL,
    "cpf_hash" TEXT NOT NULL,
    "cpf_encrypted" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "salary" DECIMAL(10,2) NOT NULL,
    "admission_date" TIMESTAMP(3) NOT NULL,
    "resignation_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "user_id" UUID,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_phone_key" ON "employees"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_hash_key" ON "employees"("cpf_hash");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_employee_id_key" ON "addresses"("employee_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;
