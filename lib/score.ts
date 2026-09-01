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

/**
 * 추첨권 누적 기준점수 — n번째 추첨권을 얻기 위해 필요한 최소 총점.
 * 증분(30, 50, 70, 90, 120, 150, 180, 210)을 누적한 값으로,
 * 뒤로 갈수록 다음 추첨권을 얻기가 더 어려워진다. 최대 8장.
 */
export const RAFFLE_TICKET_THRESHOLDS: readonly number[] = [
  30, 80, 150, 240, 360, 510, 690, 900,
];

/**
 * 추첨권 개수 — 누적 기준점수 테이블에서 총점이 넘는 구간 수만큼 부여한다.
 * 예: 총점 300점 → 240(4장) 이상 360(5장) 미만이므로 4장.
 * 기준점수 0 이하는 미사용으로 0장(테이블은 고정, 이 값은 사용 여부 토글).
 */
export function calcRaffleTickets(total: number, threshold: number): number {
  if (threshold <= 0) return 0;
  let tickets = 0;
  for (const required of RAFFLE_TICKET_THRESHOLDS) {
    if (total < required) break;
    tickets += 1;
  }
  return tickets;
}

/**
 * 다음 추첨권을 얻기까지 남은 점수.
 * - 추첨 미사용(threshold ≤ 0) 또는 이미 최대(8장) 획득이면 null.
 * - 그 외에는 다음 누적 기준점수까지의 양수 차이.
 */
export function pointsToNextTicket(
  total: number,
  threshold: number,
): number | null {
  if (threshold <= 0) return null;
  const tickets = calcRaffleTickets(total, threshold);
  if (tickets >= RAFFLE_TICKET_THRESHOLDS.length) return null; // 최대 달성
  return RAFFLE_TICKET_THRESHOLDS[tickets] - total;
}
