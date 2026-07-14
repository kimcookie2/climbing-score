// POST /api/event/close — OPEN → CLOSED. admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getEventStatus, setEventStatus } from "@/lib/repo";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (getEventStatus() !== "OPEN") {
    return NextResponse.json(
      { error: "진행중(OPEN) 상태에서만 마감할 수 있습니다." },
      { status: 409 },
    );
  }
  setEventStatus("CLOSED");
  return NextResponse.json({ status: "CLOSED" });
}
