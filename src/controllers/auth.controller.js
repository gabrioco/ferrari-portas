import bcrypt from 'bcryptjs';

import prisma from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    // httpOnly cookie — não acessível via JS, protegido contra XSS
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie('token');
  res.json({ success: true });
}

// GET /api/auth/me
export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
