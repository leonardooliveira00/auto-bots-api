-- CreateEnum
CREATE TYPE "OsStatus" AS ENUM ('BUDGET', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELED');

-- CreateTable
CREATE TABLE "orders_of_service" (
    "os_id" UUID NOT NULL,
    "protocol" TEXT NOT NULL,
    "description" TEXT,
    "status" "OsStatus" NOT NULL DEFAULT 'BUDGET',
    "totalProducts" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalLabors" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "vehicle_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_of_service_pkey" PRIMARY KEY ("os_id")
);

-- CreateTable
CREATE TABLE "os_products" (
    "os_product_id" UUID NOT NULL,
    "os_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "os_products_pkey" PRIMARY KEY ("os_product_id")
);

-- CreateTable
CREATE TABLE "os_labors" (
    "os_labor_id" UUID NOT NULL,
    "os_id" UUID NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "hourly_rate" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "os_labors_pkey" PRIMARY KEY ("os_labor_id")
);

-- AddForeignKey
ALTER TABLE "orders_of_service" ADD CONSTRAINT "orders_of_service_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders_of_service" ADD CONSTRAINT "orders_of_service_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_products" ADD CONSTRAINT "os_products_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "orders_of_service"("os_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_products" ADD CONSTRAINT "os_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_labors" ADD CONSTRAINT "os_labors_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "orders_of_service"("os_id") ON DELETE CASCADE ON UPDATE CASCADE;
