import prisma from '../lib/prisma.js';
import { contatoSchema } from '../schemas/contato.schema.js';

export async function listaProdutosPublicos(req, res, next) {
  try {
    const produtoSelect = { id: true, name: true, description: true, price: true, imageUrl: true };

    const [categorias, semCategoria] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        include: {
          products: {
            where:   { active: true },
            orderBy: { createdAt: 'asc' },
            select:  produtoSelect,
          },
        },
      }),
      prisma.product.findMany({
        where:   { active: true, categoryId: null },
        orderBy: { createdAt: 'asc' },
        select:  produtoSelect,
      }),
    ]);

    const data = [
      ...categorias
        .filter(c => c.products.length > 0)
        .map(c => ({ id: c.id, nome: c.name, produtos: c.products })),
      ...(semCategoria.length > 0
        ? [{ id: null, nome: 'Outros', produtos: semCategoria }]
        : []),
    ];

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function criaLead(req, res, next) {
  try {
    const result = contatoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors:  result.error.flatten().fieldErrors,
      });
    }

    await prisma.lead.create({ data: result.data });

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
}
