import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dbFile = process.env.DB_FILE || './data/app.db';
fs.mkdirSync(path.dirname(path.resolve(dbFile)), { recursive: true });

export const db = new DatabaseSync(path.resolve(dbFile));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username))');
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email))');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid        TEXT PRIMARY KEY,
    data       TEXT    NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

export const findUserByUsername = db.prepare(
  'SELECT * FROM users WHERE lower(username) = lower(?)'
);
export const findUserByEmail = db.prepare(
  'SELECT * FROM users WHERE lower(email) = lower(?)'
);
export const findUserByLogin = db.prepare(
  'SELECT * FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?)'
);
export const findUserById = db.prepare('SELECT * FROM users WHERE id = ?');
export const insertUser = db.prepare(
  'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
);
