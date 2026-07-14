// 순위 산정 — 기능정의서 §6.5. 순수 함수로 테스트 가능하게 분리.

import { calcTotalProblems, calcTotalScore } from "./score";
import type { Difficulty, RankingRow } from "./types";

export type RankingEntrant = {
  userId: number;
  nickname: string;
  counts: Record<number, number>; // difficulty_id -> count
};

/**
 * 두 참가자를 정렬 비교한다. 음수면 a가 상위.
 * 1) 총점 내림차순
 * 2) 동점 시 가장 높은 난이도(sort_order 큰 값)부터 개수 비교, 많은 쪽이 상위
 * 3) 모두 동일하면 0 (동순위)
 */
function compareEntrants(
  a: RankingEntrant,
  b: RankingEntrant,
  difficultiesHighToLow: readonly Difficulty[],
): number {
  const scoreA = calcTotalScore(a.counts, difficultiesHighToLow);
  const scoreB = calcTotalScore(b.counts, difficultiesHighToLow);
  if (scoreA !== scoreB) return scoreB - scoreA;

  for (const d of difficultiesHighToLow) {
    const ca = a.counts[d.id] ?? 0;
    const cb = b.counts[d.id] ?? 0;
    if (ca !== cb) return cb - ca;
  }
  return 0;
}

/**
 * 참가자 목록을 순위표 행으로 변환한다.
 * 완전 동점은 공동 순위로 묶고 다음 순위는 건너뛴다(공동 2등 2명 → 다음 4등).
 */
export function computeRanking(
  entrants: readonly RankingEntrant[],
  difficulties: readonly Difficulty[],
): RankingRow[] {
  // 높은 난이도부터(sort_order 내림차순) — 동점 비교 순서와 일치.
  const highToLow = [...difficulties].sort((x, y) => y.sort_order - x.sort_order);

  const sorted = [...entrants].sort((a, b) => compareEntrants(a, b, highToLow));

  const rows: RankingRow[] = [];
  let prev: RankingEntrant | null = null;
  let prevRank = 0;

  sorted.forEach((entrant, index) => {
    const isTieWithPrev =
      prev !== null && compareEntrants(prev, entrant, highToLow) === 0;
    const rank = isTieWithPrev ? prevRank : index + 1;

    rows.push({
      rank,
      userId: entrant.userId,
      nickname: entrant.nickname,
      counts: entrant.counts,
      totalProblems: calcTotalProblems(entrant.counts),
      totalScore: calcTotalScore(entrant.counts, difficulties),
    });

    prev = entrant;
    prevRank = rank;
  });

  return rows;
}
