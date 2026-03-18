import { z } from "zod";

import { addressSchema } from "./address-schema";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome precisa conter no mínimo 2 caracteres"),
  lastname: z
    .string()
    .min(2, "Sobrenome precisa conter no mínimo 2 caracteres"),
  email: z.email("Email inválido."),
  phoneNumber: z.string().max(11),
  cpf: z.string().max(11),
  password: z.string().min(8, "Senha deve conter no mínimo 8 caracteres."),
  address: addressSchema,
});
