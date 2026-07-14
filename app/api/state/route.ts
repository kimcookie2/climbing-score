// GET /api/state — 행사 상태만 반환하는 경량 폴링 엔드포인트.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getEventStatus } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ status: getEventStatus() });
}
