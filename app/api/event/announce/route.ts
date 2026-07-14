// POST /api/event/announce — CLOSED → ANNOUNCED. admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getEventStatus, setEventStatus } from "@/lib/repo";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (getEventStatus() !== "CLOSED") {
    return NextResponse.json(
      { error: "집계중(CLOSED) 상태에서만 발표할 수 있습니다." },
      { status: 409 },
    );
  }
  setEventStatus("ANNOUNCED");
  return NextResponse.json({ status: "ANNOUNCED" });
}
