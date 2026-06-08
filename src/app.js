import express from 'express';
import 'dotenv/config';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import router from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Arquivos estáticos da landing page pública
app.use(express.static(join(__dirname, '..', 'public')));

// View engine para o painel privado
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use('/', router);

app.use(notFound);
app.use(errorHandler);

export default app;
