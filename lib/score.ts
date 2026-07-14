// 총점 계산 — 저장하지 않고 조회 시 count × points 합산.

import type { Difficulty } from "./types";

/**
 * 난이도별 개수와 배점으로 총점을 계산한다.
 * @param counts difficulty_id -> 푼 개수
 * @param difficulties 난이도(배점 포함) 목록
 */
export function calcTotalScore(
  counts: Record<number, number>,
  difficulties: readonly Difficulty[],
): number {
  return difficulties.reduce((sum, d) => sum + (counts[d.id] ?? 0) * d.points, 0);
}

/** 총 문제 수(개수 단순 합산). */
export function calcTotalProblems(counts: Record<number, number>): number {
  return Object.values(counts).reduce((sum, c) => sum + c, 0);
}
