// GET /api/me — 내 닉네임·권한 + 현재 행사 상태.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getEventStatus } from "@/lib/repo";
import type { MeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body: MeResponse = { ...auth.user, status: getEventStatus() };
  return NextResponse.json(body);
}
