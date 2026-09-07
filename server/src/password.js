import crypto from 'node:crypto';

const ITERATIONS = 210000;
const KEYLEN = 32;
const DIGEST = 'sha512';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST);

  return `pbkdf2$${DIGEST}$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, digest, iterations, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'pbkdf2') return false;

    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const actual = crypto.pbkdf2Sync(password, salt, Number(iterations), expected.length, digest);

    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
