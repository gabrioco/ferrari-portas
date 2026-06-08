import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';

export function loginPage(req, res) {
  if (req.cookies?.token) return res.redirect('/painel');
  res.render('pages/painel/login', { error: null });
}

export async function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.render('pages/painel/login', { error: 'Credenciais inválidas' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect('/painel');
  } catch (error) {
    next(error);
  }
}

export function handleLogout(req, res) {
  res.clearCookie('token');
  res.redirect('/painel/login');
}

export async function dashboard(req, res, next) {
  try {
    const [totalProdutos, produtosAtivos] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
    ]);

    res.render('pages/painel/dashboard', {
      user: req.user,
      stats: { totalProdutos, produtosAtivos, produtosInativos: totalProdutos - produtosAtivos },
    });
  } catch (error) {
    next(error);
  }
}
