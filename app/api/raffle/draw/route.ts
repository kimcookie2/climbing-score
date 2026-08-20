// POST /api/raffle/draw — 가중 랜덤 추첨 + 당첨자 기록(다음 추첨부터 제외). admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { drawWinner } from "@/lib/raffle";
import { addRaffleWinner, getRaffleStatus } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const status = getRaffleStatus();
  const winner = drawWinner(status.participants);
  if (!winner) {
    return NextResponse.json(
      { error: "응모 가능한 추첨권이 없습니다." },
      { status: 409 },
    );
  }

  addRaffleWinner(winner.userId);

  // participants는 추첨 시점(당첨자 포함) 목록 — 클라이언트 릴 연출용.
  return NextResponse.json({ winner, participants: status.participants });
}
