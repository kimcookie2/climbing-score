// POST /api/records/reset — 모든 크루원의 풀이 기록을 0으로 초기화. admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { resetAllRecords } from "@/lib/repo";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  resetAllRecords();
  return NextResponse.json({ ok: true });
}
