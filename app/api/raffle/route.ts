// GET /api/raffle — 추첨 현황 (응모 가능자·당첨자·제외자). admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getRaffleStatus } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json(getRaffleStatus());
}
