import { describe, expect, test } from "vitest";
import { calcRaffleTickets, calcTotalProblems, calcTotalScore } from "./score";
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

describe("calcRaffleTickets", () => {
  // 누적 기준점수: 30 / 80 / 150 / 240 / 360 / 510 / 690 / 900
  const ENABLED = 1; // threshold > 0 = 추첨 사용

  test("첫 기준점수(30) 미달이면 0장", () => {
    expect(calcRaffleTickets(29, ENABLED)).toBe(0);
  });

  test("경계값에서 정확히 지급", () => {
    expect(calcRaffleTickets(30, ENABLED)).toBe(1);
    expect(calcRaffleTickets(80, ENABLED)).toBe(2);
    expect(calcRaffleTickets(150, ENABLED)).toBe(3);
    expect(calcRaffleTickets(240, ENABLED)).toBe(4);
  });

  test("구간 사이 값은 아래 구간 수만큼 지급", () => {
    expect(calcRaffleTickets(79, ENABLED)).toBe(1);
    expect(calcRaffleTickets(239, ENABLED)).toBe(3);
  });

  test("총점 300점 → 4장", () => {
    expect(calcRaffleTickets(300, ENABLED)).toBe(4);
  });

  test("최대 8장으로 상한", () => {
    expect(calcRaffleTickets(900, ENABLED)).toBe(8);
    expect(calcRaffleTickets(99999, ENABLED)).toBe(8);
  });

  test("기준점수 0(미사용)이면 항상 0장", () => {
    expect(calcRaffleTickets(1000, 0)).toBe(0);
  });
});
