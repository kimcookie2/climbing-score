// 추첨 로직 — 추첨권 1장 = 응모 1건 가중 랜덤. 순수 함수로 테스트 가능하게 분리.

import type { RaffleParticipant } from "./types";

/**
 * 가중 랜덤으로 당첨자를 뽑는다. 추첨권 수에 비례해 확률이 높아진다.
 * @param participants 응모자 목록 (tickets ≥ 1)
 * @param random 0 이상 1 미만 난수 공급자 (테스트 주입용)
 */
export function drawWinner(
  participants: readonly RaffleParticipant[],
  random: () => number = Math.random,
): RaffleParticipant | null {
  const total = participants.reduce((sum, p) => sum + p.tickets, 0);
  if (total <= 0) return null;

  let r = random() * total;
  for (const p of participants) {
    r -= p.tickets;
    if (r < 0) return p;
  }
  return participants[participants.length - 1];
}
