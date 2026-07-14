// POST /api/event/reopen — CLOSED/ANNOUNCED → OPEN (마감 취소, 발표 취소 겸용). admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getEventStatus, setEventStatus } from "@/lib/repo";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const status = getEventStatus();
  if (status !== "CLOSED" && status !== "ANNOUNCED") {
    return NextResponse.json(
      { error: "이미 진행중입니다." },
      { status: 409 },
    );
  }
  setEventStatus("OPEN");
  return NextResponse.json({ status: "OPEN" });
}
