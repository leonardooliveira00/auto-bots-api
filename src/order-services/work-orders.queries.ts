import { Prisma } from '../../generated/prisma/client';

export const osListSelect = {
  workOrderId: true,
  protocol: true,
  status: true,
  totalAmount: true,
  createdAt: true,
  vehicle: {
    select: {
      brand: true,
      model: true,
      plate: true,
    },
  },
  employee: {
    select: {
      firstName: true,
      lastName: true,
      role: true,
    },
  },
} satisfies Prisma.WorkOrderSelect;

export const osDetailSelect = {
  workOrderId: true,
  protocol: true,
  description: true,
  status: true,
  estimatedDelivery: true,
  totalProducts: true,
  totalLabors: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true,
  vehicle: {
    select: {
      vehicleId: true,
      brand: true,
      model: true,
      year: true,
      plate: true,
      vin: true,
      customer: {
        select: { name: true, lastName: true, phone: true },
      },
    },
  },
  employee: {
    select: {
      employeeId: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  },
  products: {
    select: {
      productId: true,
      workOrderProductId: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
    },
  },
  labors: {
    select: {
      workOrderLaborId: true,
      description: true,
      hours: true,
      hourlyRate: true,
    },
  },
} satisfies Prisma.WorkOrderSelect;
