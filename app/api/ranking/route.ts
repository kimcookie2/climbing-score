// GET /api/ranking — 전체 순위표. admin 전용이되 ANNOUNCED 시 전체 로그인 사용자 허용.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDifficulties, getEventStatus, getRanking } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const status = getEventStatus();
  // ANNOUNCED가 아니면 admin만 열람 가능.
  if (status !== "ANNOUNCED" && auth.user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  return NextResponse.json({
    difficulties: getDifficulties(),
    ranking: getRanking(),
  });
}
