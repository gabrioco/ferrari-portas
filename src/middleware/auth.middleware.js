import { verifyToken } from '../lib/jwt.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    if (req.accepts('html')) return res.redirect('/painel/login');
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.clearCookie('token');
    if (req.accepts('html')) return res.redirect('/painel/login');
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    next();
  };
}
