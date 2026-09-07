import 'dotenv/config';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import session from 'express-session';

import { SqliteStore } from './session-store.js';
import { router as authRouter } from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');

const PORT = Number(process.env.PORT || 3000);

const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';
const BEHIND_PROXY = process.env.TRUST_PROXY === '1';

const COOKIE_SECURE =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === '1'
    : IS_PROD && BEHIND_PROXY;

const app = express();

if (BEHIND_PROXY) {
  app.set('trust proxy', 1);
}
app.disable('x-powered-by');

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    store: new SqliteStore(),
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use('/api', authRouter);

const page = (name) => (req, res) => res.sendFile(path.join(PUBLIC_DIR, name));

const requireAuthPage = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
};

const redirectIfAuthed = (req, res, next) => {
  if (req.session.userId) return res.redirect('/profile');
  next();
};

app.get('/', (req, res) => res.redirect(req.session.userId ? '/profile' : '/login'));

app.get(['/login', '/login.html'], redirectIfAuthed, page('login.html'));
app.get(['/register', '/register.html'], redirectIfAuthed, page('register.html'));

app.get(['/profile', '/profile.html'], requireAuthPage, page('profile.html'));

app.use(express.static(PUBLIC_DIR, { index: false, extensions: false }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ errors: { form: 'Не найдено' } });
  }
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ errors: { form: 'Внутренняя ошибка сервера' } });
  }
  res.status(500).send('Внутренняя ошибка сервера');
});

app.listen(PORT, HOST, () => {
  console.log(
    `Сервер запущен: http://${HOST}:${PORT} (${IS_PROD ? 'production' : 'development'}` +
      `${COOKIE_SECURE ? ', secure cookie' : ''})`
  );
});
