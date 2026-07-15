// 공용 DB 조회/변경 함수. Route Handler를 얇게 유지하기 위한 데이터 접근 계층.

import type { EventStatus } from "./constants";
import { ensureRecordsForUser, getDb } from "./db";
import type { Difficulty, RankingRow, User } from "./types";
import { computeRanking, type RankingEntrant } from "./ranking";

export function getEventStatus(): EventStatus {
  const row = getDb()
    .prepare(`SELECT status FROM event_state WHERE id = 1`)
    .get() as { status: EventStatus };
  return row.status;
}

export function setEventStatus(status: EventStatus): void {
  getDb().prepare(`UPDATE event_state SET status = ? WHERE id = 1`).run(status);
}

/** 추첨권 기준점수 조회 (0 = 미사용). */
export function getRaffleThreshold(): number {
  const row = getDb()
    .prepare(`SELECT raffle_threshold FROM event_state WHERE id = 1`)
    .get() as { raffle_threshold: number };
  return row.raffle_threshold;
}

export function setRaffleThreshold(threshold: number): void {
  getDb()
    .prepare(`UPDATE event_state SET raffle_threshold = ? WHERE id = 1`)
    .run(threshold);
}

export function getDifficulties(): Difficulty[] {
  return getDb()
    .prepare(`SELECT * FROM difficulties ORDER BY sort_order ASC`)
    .all() as Difficulty[];
}

export function findUserByNickname(nickname: string): User | undefined {
  return getDb()
    .prepare(`SELECT * FROM users WHERE nickname = ?`)
    .get(nickname) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return getDb().prepare(`SELECT * FROM users WHERE id = ?`).get(id) as
    | User
    | undefined;
}

export function getAllUsers(): User[] {
  return getDb()
    .prepare(`SELECT * FROM users ORDER BY created_at ASC, id ASC`)
    .all() as User[];
}

export function countAdmins(): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'admin'`)
    .get() as { c: number };
  return row.c;
}

/** 특정 사용자의 난이도별 개수 맵. 없는 행은 0. */
export function getUserCounts(userId: number): Record<number, number> {
  const rows = getDb()
    .prepare(`SELECT difficulty_id, count FROM records WHERE user_id = ?`)
    .all(userId) as { difficulty_id: number; count: number }[];
  const map: Record<number, number> = {};
  for (const r of rows) map[r.difficulty_id] = r.count;
  return map;
}

/** 내 기록 갱신 (upsert, last-write-wins). */
export function upsertRecord(
  userId: number,
  difficultyId: number,
  count: number,
): void {
  getDb()
    .prepare(
      `INSERT INTO records (user_id, difficulty_id, count, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, difficulty_id)
       DO UPDATE SET count = excluded.count, updated_at = CURRENT_TIMESTAMP`,
    )
    .run(userId, difficultyId, count);
}

export function createUser(nickname: string, role: "member" | "admin"): User {
  const db = getDb();
  const info = db
    .prepare(`INSERT INTO users (nickname, role) VALUES (?, ?)`)
    .run(nickname, role);
  const id = Number(info.lastInsertRowid);
  ensureRecordsForUser(db, id);
  return getUserById(id)!;
}

export function updateUserRole(id: number, role: "member" | "admin"): void {
  getDb().prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, id);
}

export function deleteUser(id: number): void {
  // records는 ON DELETE CASCADE로 함께 삭제된다.
  getDb().prepare(`DELETE FROM users WHERE id = ?`).run(id);
}

/** 모든 크루원의 풀이 기록을 0으로 초기화. */
export function resetAllRecords(): void {
  getDb()
    .prepare(`UPDATE records SET count = 0, updated_at = CURRENT_TIMESTAMP`)
    .run();
}

export function updateDifficultyPoints(
  points: { id: number; points: number }[],
): void {
  const db = getDb();
  const stmt = db.prepare(`UPDATE difficulties SET points = ? WHERE id = ?`);
  const tx = db.transaction(() => {
    for (const p of points) stmt.run(p.points, p.id);
  });
  tx();
}

/** 전체 순위표 계산. */
export function getRanking(): RankingRow[] {
  const users = getAllUsers();
  const difficulties = getDifficulties();
  const entrants: RankingEntrant[] = users.map((u) => ({
    userId: u.id,
    nickname: u.nickname,
    counts: getUserCounts(u.id),
  }));
  return computeRanking(entrants, difficulties);
}
