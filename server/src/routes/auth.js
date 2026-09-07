import express from 'express';
import rateLimit from 'express-rate-limit';

import { findUserByUsername, findUserByEmail, findUserByLogin, findUserById, insertUser } from '../db.js';
import { hashPassword, verifyPassword } from '../password.js';
import { issueCaptcha, verifyCaptcha } from '../captcha.js';
import { validateRegistration } from '../validators.js';

export const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { errors: { form: 'Слишком много попыток. Попробуйте позже.' } },
});

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  createdAt: user.created_at,
  role: 'Пользователь',
});

router.get('/captcha', (req, res) => {
  res.json(issueCaptcha(req.session));
});

router.post('/register', authLimiter, (req, res) => {
  const username = String(req.body.username ?? '').trim();
  const email = String(req.body.email ?? '').trim();
  const password = String(req.body.password ?? '');
  const confirmPassword = String(req.body.confirmPassword ?? '');
  const captchaAnswer = req.body.captcha;

  const errors = validateRegistration({ username, email, password, confirmPassword });

  if (!verifyCaptcha(req.session, captchaAnswer)) {
    errors.captcha = 'Неверный ответ капчи';
  }

  if (!errors.username && findUserByUsername.get(username)) {
    errors.username = 'Пользователь с таким именем уже существует';
  }
  if (!errors.email && findUserByEmail.get(email)) {
    errors.email = 'Пользователь с таким email уже зарегистрирован';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors, captcha: issueCaptcha(req.session) });
  }

  try {
    insertUser.run(username, email, hashPassword(password));
  } catch (err) {

    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({
        errors: { form: 'Пользователь с такими данными уже существует' },
        captcha: issueCaptcha(req.session),
      });
    }
    throw err;
  }

  res.status(201).json({
    ok: true,
    message: 'Регистрация успешна! Войдите в систему.',
  });
});

router.post('/login', authLimiter, (req, res) => {
  const login = String(req.body.login ?? '').trim();
  const password = String(req.body.password ?? '');
  const captchaAnswer = req.body.captcha;

  const captchaOk = verifyCaptcha(req.session, captchaAnswer);
  const fail = (errors, status = 400) =>
    res.status(status).json({ errors, captcha: issueCaptcha(req.session) });

  if (!captchaOk) {
    return fail({ captcha: 'Неверный ответ капчи' });
  }
  if (!login || !password) {
    return fail({ form: 'Неверный логин или пароль' });
  }

  const user = findUserByLogin.get(login, login);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return fail({ form: 'Неверный логин или пароль' }, 401);
  }

  req.session.regenerate((err) => {
    if (err) return fail({ form: 'Не удалось создать сессию' }, 500);

    req.session.userId = user.id;
    req.session.username = user.username;

    req.session.save((saveErr) => {
      if (saveErr) return fail({ form: 'Не удалось создать сессию' }, 500);
      res.json({ ok: true, user: publicUser(user) });
    });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ errors: { form: 'Требуется авторизация' } });
  }

  const user = findUserById.get(req.session.userId);
  if (!user) {
    return req.session.destroy(() =>
      res.status(401).json({ errors: { form: 'Требуется авторизация' } })
    );
  }

  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.json({ ok: true });
  });
});
