// 도메인 상수 — 난이도 시드, 폴링 주기, 세션 쿠키 이름 등.

export const EVENT_STATUSES = ["OPEN", "CLOSED", "ANNOUNCED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ROLES = ["member", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** 상태 조회 폴링 주기 (ms). 기능정의서 §10: 5~10초. */
export const POLL_INTERVAL_MS = 6000;

/** iron-session 쿠키 이름. */
export const SESSION_COOKIE_NAME = "climbing_session";

export type DifficultySeed = {
  colorName: string;
  colorHex: string;
  sortOrder: number; // 1(빨강) ~ 11(흰색)
  points: number; // 초기 기본 배점 (운영진이 수정 가능)
};

/**
 * 난이도 11색 고정 시드. 낮은 난이도 → 높은 난이도 순서.
 * 초기 배점은 sort_order 값(1~11)을 그대로 사용한다.
 */
export const DIFFICULTY_SEEDS: readonly DifficultySeed[] = [
  { colorName: "빨강", colorHex: "#ef4444", sortOrder: 1, points: 1 },
  { colorName: "주황", colorHex: "#f97316", sortOrder: 2, points: 2 },
  { colorName: "노랑", colorHex: "#eab308", sortOrder: 3, points: 3 },
  { colorName: "초록", colorHex: "#22c55e", sortOrder: 4, points: 4 },
  { colorName: "파랑", colorHex: "#3b82f6", sortOrder: 5, points: 5 },
  { colorName: "남색", colorHex: "#3730a3", sortOrder: 6, points: 6 },
  { colorName: "보라", colorHex: "#a855f7", sortOrder: 7, points: 7 },
  { colorName: "회색", colorHex: "#9ca3af", sortOrder: 8, points: 8 },
  { colorName: "갈색", colorHex: "#92400e", sortOrder: 9, points: 9 },
  { colorName: "검정", colorHex: "#171717", sortOrder: 10, points: 10 },
  { colorName: "흰색", colorHex: "#ffffff", sortOrder: 11, points: 11 },
] as const;

/** 초기 시드 운영진 닉네임 (환경변수 우선). */
export const SEED_ADMIN_NICKNAME = process.env.SEED_ADMIN_NICKNAME?.trim() || "운영진";
