import { z } from 'zod';

const precoField = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : Number(v)),
  z.number({ invalid_type_error: 'Preço deve ser um número' }).positive('Preço deve ser positivo').optional()
);

export const produtoSchema = z.object({
  name:        z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  price:       precoField,
  imageUrl:    z.string().url('URL de imagem inválida').optional().or(z.literal('')),
  categoryId:  z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().positive().optional()
  ),
});

export const toggleSchema = z.object({
  active: z.preprocess((v) => v === 'true', z.boolean()),
});
