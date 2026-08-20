import { describe, expect, test } from "vitest";
import { drawWinner } from "./raffle";
import type { RaffleParticipant } from "./types";

const participants: RaffleParticipant[] = [
  { userId: 1, nickname: "가", tickets: 1 },
  { userId: 2, nickname: "나", tickets: 3 },
  { userId: 3, nickname: "다", tickets: 6 },
];

describe("drawWinner", () => {
  test("난수 구간에 따라 추첨권 수 비례로 당첨된다 (총 10장)", () => {
    // 누적 구간: 가 [0,1), 나 [1,4), 다 [4,10)
    expect(drawWinner(participants, () => 0)?.userId).toBe(1);
    expect(drawWinner(participants, () => 0.09)?.userId).toBe(1);
    expect(drawWinner(participants, () => 0.1)?.userId).toBe(2);
    expect(drawWinner(participants, () => 0.39)?.userId).toBe(2);
    expect(drawWinner(participants, () => 0.4)?.userId).toBe(3);
    expect(drawWinner(participants, () => 0.999)?.userId).toBe(3);
  });

  test("응모자가 없거나 추첨권 합이 0이면 null", () => {
    expect(drawWinner([])).toBeNull();
    expect(
      drawWinner([{ userId: 1, nickname: "가", tickets: 0 }]),
    ).toBeNull();
  });

  test("1명만 있으면 항상 그 사람", () => {
    const only = [{ userId: 7, nickname: "혼자", tickets: 2 }];
    expect(drawWinner(only, () => 0.99)?.userId).toBe(7);
  });
});
