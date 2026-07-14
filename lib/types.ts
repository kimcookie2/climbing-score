// 앱 전역에서 공유하는 도메인 타입.

import type { EventStatus, Role } from "./constants";

export type User = {
  id: number;
  nickname: string;
  role: Role;
  created_at: string;
};

export type Difficulty = {
  id: number;
  color_name: string;
  color_hex: string;
  sort_order: number;
  points: number;
};

export type RecordRow = {
  user_id: number;
  difficulty_id: number;
  count: number;
  updated_at: string | null;
};

/** 내 기록 응답: 난이도별 개수 + 총점. */
export type MyRecords = {
  difficulties: Difficulty[];
  counts: Record<number, number>; // difficulty_id -> count
  total: number;
};

/** 순위표 한 행. */
export type RankingRow = {
  rank: number;
  userId: number;
  nickname: string;
  counts: Record<number, number>; // difficulty_id -> count
  totalProblems: number;
  totalScore: number;
};

export type SessionUser = {
  userId: number;
  nickname: string;
  role: Role;
};

export type MeResponse = SessionUser & {
  status: EventStatus;
};
