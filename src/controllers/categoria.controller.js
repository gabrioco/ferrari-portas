import prisma from '../lib/prisma.js';
import { categoriaSchema } from '../schemas/categoria.schema.js';

async function listarCom_count() {
  return prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    include: { _count: { select: { products: true } } },
  });
}

export async function listaCategorias(req, res, next) {
  try {
    const categorias = await listarCom_count();
    res.render('pages/painel/categorias/index', { user: req.user, categorias, error: null });
  } catch (error) {
    next(error);
  }
}

export async function criaCategoria(req, res, next) {
  try {
    const result = categoriaSchema.safeParse(req.body);

    if (!result.success) {
      const categorias = await listarCom_count();
      return res.render('pages/painel/categorias/index', {
        user: req.user,
        categorias,
        error: result.error.flatten().fieldErrors.name?.[0] ?? 'Erro de validação',
        values: req.body,
      });
    }

    const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
    const newOrder = (maxOrder._max.order ?? -1) + 1;
    await prisma.category.create({ data: { ...result.data, order: newOrder } });
    res.redirect('/painel/categorias');
  } catch (error) {
    if (error.code === 'P2002') {
      const categorias = await listarCom_count();
      return res.render('pages/painel/categorias/index', {
        user: req.user,
        categorias,
        error: 'Já existe uma categoria com esse nome',
        values: req.body,
      });
    }
    next(error);
  }
}

export async function editaCategoria(req, res, next) {
  try {
    const id     = parseInt(req.params.id);
    const result = categoriaSchema.safeParse(req.body);
    if (!result.success) return res.redirect('/painel/categorias');

    await prisma.category.update({ where: { id }, data: result.data });
    res.redirect('/painel/categorias');
  } catch (error) {
    next(error);
  }
}

export async function deletaCategoria(req, res, next) {
  try {
    const id    = parseInt(req.params.id);
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) return res.redirect('/painel/categorias');

    await prisma.category.delete({ where: { id } });
    res.redirect('/painel/categorias');
  } catch (error) {
    next(error);
  }
}

export async function reordenaCategoria(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids inválido' });
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.category.update({ where: { id: Number(id) }, data: { order: index } })
      )
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
