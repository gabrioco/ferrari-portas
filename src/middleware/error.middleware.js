export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Já existe um registro com este valor'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro não encontrado'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message
  });
}
