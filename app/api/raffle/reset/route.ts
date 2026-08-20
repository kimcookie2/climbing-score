// POST /api/raffle/reset — 당첨자 기록 초기화 (전원 재응모 가능). admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { clearRaffleWinners } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  clearRaffleWinners();
  return NextResponse.json({ ok: true });
}
