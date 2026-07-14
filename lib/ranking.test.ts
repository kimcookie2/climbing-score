import { describe, expect, test } from "vitest";
import { computeRanking, type RankingEntrant } from "./ranking";
import type { Difficulty } from "./types";

// 테스트용 난이도 3종: 빨강(1점), 파랑(2점), 흰색(3점).
const difficulties: Difficulty[] = [
  { id: 1, color_name: "빨강", color_hex: "#f00", sort_order: 1, points: 1 },
  { id: 2, color_name: "파랑", color_hex: "#00f", sort_order: 5, points: 2 },
  { id: 3, color_name: "흰색", color_hex: "#fff", sort_order: 11, points: 3 },
];

function entrant(
  userId: number,
  nickname: string,
  counts: Record<number, number>,
): RankingEntrant {
  return { userId, nickname, counts };
}

describe("computeRanking", () => {
  test("총점 내림차순으로 순위를 매긴다", () => {
    const rows = computeRanking(
      [
        entrant(1, "A", { 1: 0, 2: 0, 3: 1 }), // 3점
        entrant(2, "B", { 1: 5, 2: 0, 3: 0 }), // 5점
        entrant(3, "C", { 1: 0, 2: 2, 3: 0 }), // 4점
      ],
      difficulties,
    );
    expect(rows.map((r) => r.nickname)).toEqual(["B", "C", "A"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(rows[0].totalScore).toBe(5);
  });

  test("동점 시 높은 난이도(흰색)를 더 많이 푼 사람이 상위", () => {
    // 둘 다 총점 6점. A는 흰색 2개, B는 흰색 0개.
    const rows = computeRanking(
      [
        entrant(1, "A", { 1: 0, 2: 0, 3: 2 }), // 6점, 흰색 2
        entrant(2, "B", { 1: 0, 2: 3, 3: 0 }), // 6점, 흰색 0
      ],
      difficulties,
    );
    expect(rows.map((r) => r.nickname)).toEqual(["A", "B"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2]);
  });

  test("흰색 동일하면 그다음 높은 난이도로 비교", () => {
    // 둘 다 흰색 1개(3점) + 나머지로 총점 5점. A는 파랑 1개, B는 빨강 2개.
    const rows = computeRanking(
      [
        entrant(1, "A", { 1: 0, 2: 1, 3: 1 }), // 흰1 파1
        entrant(2, "B", { 1: 2, 2: 0, 3: 1 }), // 흰1 빨2
      ],
      difficulties,
    );
    expect(rows.map((r) => r.nickname)).toEqual(["A", "B"]);
  });

  test("완전 동일하면 공동 순위, 다음 순위는 건너뛴다", () => {
    const rows = computeRanking(
      [
        entrant(1, "A", { 1: 0, 2: 0, 3: 2 }), // 6점
        entrant(2, "B", { 1: 0, 2: 0, 3: 2 }), // 6점 (A와 동일)
        entrant(3, "C", { 1: 1, 2: 0, 3: 0 }), // 1점
      ],
      difficulties,
    );
    // 공동 1등 2명 → 다음은 3등.
    expect(rows.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  test("빈 목록은 빈 배열", () => {
    expect(computeRanking([], difficulties)).toEqual([]);
  });
});
