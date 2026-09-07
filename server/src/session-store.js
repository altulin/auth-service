import session from 'express-session';
import { db } from './db.js';

const Store = session.Store;

export class SqliteStore extends Store {
  constructor({ ttlMs = 24 * 60 * 60 * 1000, cleanupIntervalMs = 15 * 60 * 1000 } = {}) {
    super();
    this.ttlMs = ttlMs;

    this.stmtGet = db.prepare('SELECT data, expires_at FROM sessions WHERE sid = ?');
    this.stmtSet = db.prepare(
      'INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?) ' +
        'ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at'
    );
    this.stmtDestroy = db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.stmtClear = db.prepare('DELETE FROM sessions');
    this.stmtLength = db.prepare('SELECT count(*) AS n FROM sessions WHERE expires_at > ?');
    this.stmtCleanup = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');

    this.cleanup();
    this.timer = setInterval(() => this.cleanup(), cleanupIntervalMs);
    this.timer.unref?.();
  }

  cleanup() {
    try {
      this.stmtCleanup.run(Date.now());
    } catch {

    }
  }

  expiresAt(sess) {
    const cookieExpires = sess?.cookie?.expires;
    if (cookieExpires) return new Date(cookieExpires).getTime();
    return Date.now() + this.ttlMs;
  }

  get(sid, callback) {
    try {
      const row = this.stmtGet.get(sid);
      if (!row) return callback(null, null);
      if (row.expires_at <= Date.now()) {
        this.stmtDestroy.run(sid);
        return callback(null, null);
      }
      return callback(null, JSON.parse(row.data));
    } catch (err) {
      return callback(err);
    }
  }

  set(sid, sess, callback = () => {}) {
    try {
      this.stmtSet.run(sid, JSON.stringify(sess), this.expiresAt(sess));
      return callback(null);
    } catch (err) {
      return callback(err);
    }
  }

  touch(sid, sess, callback = () => {}) {
    return this.set(sid, sess, callback);
  }

  destroy(sid, callback = () => {}) {
    try {
      this.stmtDestroy.run(sid);
      return callback(null);
    } catch (err) {
      return callback(err);
    }
  }

  clear(callback = () => {}) {
    try {
      this.stmtClear.run();
      return callback(null);
    } catch (err) {
      return callback(err);
    }
  }

  length(callback = () => {}) {
    try {
      return callback(null, this.stmtLength.get(Date.now()).n);
    } catch (err) {
      return callback(err);
    }
  }
}
