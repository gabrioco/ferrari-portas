import { Router } from 'express';
import { loginPage, handleLogin, handleLogout, dashboard } from '../controllers/painel.controller.js';
import { listaProdutos, novoProdutoPage, criaProduto, editaProdutoPage, atualizaProduto, toggleAtivo } from '../controllers/produto.controller.js';
import { listaCategorias, criaCategoria, editaCategoria, deletaCategoria, reordenaCategoria } from '../controllers/categoria.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/login',  loginPage);
router.post('/login', handleLogin);
router.post('/logout', requireAuth, handleLogout);

router.get('/',  requireAuth, dashboard);
router.get('',   requireAuth, dashboard);

router.get('/produtos',              requireAuth, listaProdutos);
router.get('/produtos/novo',         requireAuth, novoProdutoPage);
router.post('/produtos',             requireAuth, criaProduto);
router.get('/produtos/:id/editar',   requireAuth, editaProdutoPage);
router.post('/produtos/:id',         requireAuth, atualizaProduto);
router.post('/produtos/:id/toggle',  requireAuth, toggleAtivo);

router.get('/categorias',              requireAuth, listaCategorias);
router.post('/categorias',             requireAuth, criaCategoria);
router.post('/categorias/reorder',     requireAuth, reordenaCategoria);
router.post('/categorias/:id',         requireAuth, editaCategoria);
router.post('/categorias/:id/delete',  requireAuth, deletaCategoria);

export default router;
