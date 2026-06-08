import { z } from 'zod';

export const contatoSchema = z.object({
  name:    z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email:   z.string().email('Email inválido'),
  phone:   z.string().min(8, 'Informe seu WhatsApp'),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});
