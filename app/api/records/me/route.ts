// GET/PUT /api/records/me — 내 난이도별 기록 + 총점.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getDifficulties,
  getEventStatus,
  getRaffleThreshold,
  getUserCounts,
  upsertRecord,
} from "@/lib/repo";
import { calcTotalScore } from "@/lib/score";
import type { MyRecords } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const difficulties = getDifficulties();
  const counts = getUserCounts(auth.user.userId);
  const body: MyRecords = {
    difficulties,
    counts,
    total: calcTotalScore(counts, difficulties),
    raffleThreshold: getRaffleThreshold(),
  };
  return NextResponse.json(body);
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  // OPEN 상태에서만 기록 갱신 허용.
  if (getEventStatus() !== "OPEN") {
    return NextResponse.json(
      { error: "이미 마감되었습니다." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { difficulty_id, count } = body as {
    difficulty_id?: unknown;
    count?: unknown;
  };

  if (
    !Number.isInteger(difficulty_id) ||
    !Number.isInteger(count) ||
    (count as number) < 0
  ) {
    return NextResponse.json(
      { error: "difficulty_id와 count(0 이상 정수)가 필요합니다." },
      { status: 400 },
    );
  }

  // 존재하는 난이도인지 확인.
  const difficulties = getDifficulties();
  const exists = difficulties.some((d) => d.id === difficulty_id);
  if (!exists) {
    return NextResponse.json(
      { error: "존재하지 않는 난이도입니다." },
      { status: 400 },
    );
  }

  upsertRecord(auth.user.userId, difficulty_id as number, count as number);

  const counts = getUserCounts(auth.user.userId);
  const responseBody: MyRecords = {
    difficulties,
    counts,
    total: calcTotalScore(counts, difficulties),
    raffleThreshold: getRaffleThreshold(),
  };
  return NextResponse.json(responseBody);
}
