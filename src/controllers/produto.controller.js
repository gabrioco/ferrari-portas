import prisma from '../lib/prisma.js';
import { produtoSchema } from '../schemas/produto.schema.js';

async function getCategorias() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function listaProdutos(req, res, next) {
  try {
    const produtos = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } } },
    });
    res.render('pages/painel/produtos/index', { user: req.user, produtos });
  } catch (error) {
    next(error);
  }
}

export async function novoProdutoPage(req, res, next) {
  try {
    const categorias = await getCategorias();
    res.render('pages/painel/produtos/novo', {
      user: req.user, categorias, errors: {}, values: {},
    });
  } catch (error) {
    next(error);
  }
}

export async function criaProduto(req, res, next) {
  try {
    const result = produtoSchema.safeParse(req.body);
    if (!result.success) {
      const categorias = await getCategorias();
      return res.render('pages/painel/produtos/novo', {
        user: req.user, categorias,
        errors: result.error.flatten().fieldErrors,
        values: req.body,
      });
    }

    const { imageUrl, categoryId, ...rest } = result.data;
    await prisma.product.create({
      data: { ...rest, imageUrl: imageUrl || null, categoryId: categoryId ?? null },
    });

    res.redirect('/painel/produtos');
  } catch (error) {
    next(error);
  }
}

export async function editaProdutoPage(req, res, next) {
  try {
    const [produto, categorias] = await Promise.all([
      prisma.product.findUnique({ where: { id: parseInt(req.params.id) } }),
      getCategorias(),
    ]);

    if (!produto) return res.redirect('/painel/produtos');

    res.render('pages/painel/produtos/editar', {
      user: req.user, produto, categorias, errors: {},
    });
  } catch (error) {
    next(error);
  }
}

export async function atualizaProduto(req, res, next) {
  try {
    const id     = parseInt(req.params.id);
    const result = produtoSchema.safeParse(req.body);

    if (!result.success) {
      const [produto, categorias] = await Promise.all([
        prisma.product.findUnique({ where: { id } }),
        getCategorias(),
      ]);
      return res.render('pages/painel/produtos/editar', {
        user: req.user, categorias,
        produto: { ...produto, ...req.body, id },
        errors:  result.error.flatten().fieldErrors,
      });
    }

    const { imageUrl, categoryId, ...rest } = result.data;
    await prisma.product.update({
      where: { id },
      data:  { ...rest, imageUrl: imageUrl || null, categoryId: categoryId ?? null },
    });

    res.redirect('/painel/produtos');
  } catch (error) {
    next(error);
  }
}

export async function toggleAtivo(req, res, next) {
  try {
    const id      = parseInt(req.params.id);
    const produto = await prisma.product.findUnique({ where: { id } });
    if (!produto) return res.redirect('/painel/produtos');

    await prisma.product.update({ where: { id }, data: { active: !produto.active } });
    res.redirect('/painel/produtos');
  } catch (error) {
    next(error);
  }
}
