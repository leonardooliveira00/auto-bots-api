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
    include: { customer: true },
  },
  employee: true,
  products: {
    include: { product: true },
  },
  labors: true,
} satisfies Prisma.WorkOrderSelect;
