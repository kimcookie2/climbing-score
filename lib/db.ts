// SQLite 연결 + 마이그레이션 + 시드. 서버 전용 모듈.
// better-sqlite3는 동기 API이므로 Route Handler에서 nodejs 런타임으로만 사용한다.

import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DIFFICULTY_SEEDS, SEED_ADMIN_NICKNAME } from "./constants";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "climbing.db");

// Next dev 환경의 HMR로 연결이 중복 생성되는 것을 막기 위해 전역 캐싱.
const globalForDb = globalThis as unknown as { __climbingDb?: Database.Database };

function createConnection(): Database.Database {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  seed(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY,
      nickname    TEXT UNIQUE NOT NULL,
      role        TEXT NOT NULL CHECK (role IN ('member', 'admin')),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS difficulties (
      id          INTEGER PRIMARY KEY,
      color_name  TEXT NOT NULL,
      color_hex   TEXT NOT NULL,
      sort_order  INTEGER UNIQUE NOT NULL,
      points      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS records (
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      difficulty_id INTEGER NOT NULL REFERENCES difficulties(id),
      count         INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
      updated_at    DATETIME,
      PRIMARY KEY (user_id, difficulty_id)
    );

    CREATE TABLE IF NOT EXISTS event_state (
      id      INTEGER PRIMARY KEY CHECK (id = 1),
      status  TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED','ANNOUNCED'))
    );
  `);
}

function seed(db: Database.Database): void {
  // 난이도 11색 (없을 때만 삽입, sort_order 기준 멱등).
  const insertDifficulty = db.prepare(
    `INSERT OR IGNORE INTO difficulties (color_name, color_hex, sort_order, points)
     VALUES (@colorName, @colorHex, @sortOrder, @points)`,
  );
  const seedDifficulties = db.transaction(() => {
    for (const d of DIFFICULTY_SEEDS) insertDifficulty.run(d);
  });
  seedDifficulties();

  // 전역 행사 상태 1행.
  db.prepare(
    `INSERT OR IGNORE INTO event_state (id, status) VALUES (1, 'OPEN')`,
  ).run();

  // 초기 운영진 계정 (운영진이 한 명도 없을 때만).
  const adminCount = db
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'admin'`)
    .get() as { c: number };
  if (adminCount.c === 0) {
    const info = db
      .prepare(`INSERT OR IGNORE INTO users (nickname, role) VALUES (?, 'admin')`)
      .run(SEED_ADMIN_NICKNAME);
    if (info.changes > 0) ensureRecordsForUser(db, Number(info.lastInsertRowid));
  }
}

/** 특정 사용자의 난이도별 records 행을 0으로 보장(upsert). */
export function ensureRecordsForUser(db: Database.Database, userId: number): void {
  const difficultyIds = db
    .prepare(`SELECT id FROM difficulties`)
    .all() as { id: number }[];
  const insert = db.prepare(
    `INSERT OR IGNORE INTO records (user_id, difficulty_id, count) VALUES (?, ?, 0)`,
  );
  const tx = db.transaction(() => {
    for (const { id } of difficultyIds) insert.run(userId, id);
  });
  tx();
}

export function getDb(): Database.Database {
  if (!globalForDb.__climbingDb) {
    globalForDb.__climbingDb = createConnection();
  }
  return globalForDb.__climbingDb;
}
