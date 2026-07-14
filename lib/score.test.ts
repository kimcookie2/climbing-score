import { describe, expect, test } from "vitest";
import { calcTotalProblems, calcTotalScore } from "./score";
import type { Difficulty } from "./types";

const difficulties: Difficulty[] = [
  { id: 1, color_name: "빨강", color_hex: "#f00", sort_order: 1, points: 1 },
  { id: 2, color_name: "흰색", color_hex: "#fff", sort_order: 11, points: 11 },
];

describe("calcTotalScore", () => {
  test("count × points 합산", () => {
    expect(calcTotalScore({ 1: 3, 2: 2 }, difficulties)).toBe(3 * 1 + 2 * 11);
  });

  test("배점 변경 시 총점이 재계산된다", () => {
    const counts = { 1: 5, 2: 1 };
    expect(calcTotalScore(counts, difficulties)).toBe(16);
    const rescored = difficulties.map((d) =>
      d.id === 2 ? { ...d, points: 20 } : d,
    );
    expect(calcTotalScore(counts, rescored)).toBe(25);
  });

  test("기록 없는 난이도는 0으로 취급", () => {
    expect(calcTotalScore({ 2: 1 }, difficulties)).toBe(11);
  });
});

describe("calcTotalProblems", () => {
  test("개수 단순 합산", () => {
    expect(calcTotalProblems({ 1: 3, 2: 2 })).toBe(5);
    expect(calcTotalProblems({})).toBe(0);
  });
});
