import crypto from 'node:crypto';

const rand = (min, max) => min + crypto.randomInt(max - min + 1);

export function issueCaptcha(session) {
  const ops = ['+', '-', '*'];
  const op = ops[crypto.randomInt(ops.length)];

  let a;
  let b;
  let answer;

  if (op === '+') {
    a = rand(1, 20);
    b = rand(1, 20);
    answer = a + b;
  } else if (op === '-') {
    a = rand(10, 30);
    b = rand(1, 9);
    answer = a - b;
  } else {
    a = rand(2, 9);
    b = rand(2, 9);
    answer = a * b;
  }

  session.captcha = { answer, issuedAt: Date.now() };

  return { question: `Сколько будет ${a} ${op} ${b}?` };
}

const CAPTCHA_TTL_MS = 10 * 60 * 1000;

export function verifyCaptcha(session, userAnswer) {
  const captcha = session.captcha;
  delete session.captcha;

  if (!captcha) return false;
  if (Date.now() - captcha.issuedAt > CAPTCHA_TTL_MS) return false;

  const value = String(userAnswer ?? '').trim();
  if (!/^-?\d{1,4}$/.test(value)) return false;

  return Number(value) === captcha.answer;
}
