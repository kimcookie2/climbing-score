// GET/PUT /api/scoring — 난이도별 배점 + 추첨권 기준점수 조회/일괄 저장. admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getDifficulties,
  getRaffleThreshold,
  setRaffleThreshold,
  updateDifficultyPoints,
} from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    difficulties: getDifficulties(),
    raffleThreshold: getRaffleThreshold(),
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { points, raffleThreshold } = body as {
    points?: unknown;
    raffleThreshold?: unknown;
  };
  if (!Array.isArray(points)) {
    return NextResponse.json(
      { error: "points 배열이 필요합니다." },
      { status: 400 },
    );
  }

  const validIds = new Set(getDifficulties().map((d) => d.id));
  for (const p of points) {
    const { id, points: value } = p as { id?: unknown; points?: unknown };
    if (
      !Number.isInteger(id) ||
      !validIds.has(id as number) ||
      !Number.isInteger(value) ||
      (value as number) < 0
    ) {
      return NextResponse.json(
        { error: "각 배점은 0 이상 정수여야 합니다." },
        { status: 400 },
      );
    }
  }

  if (!Number.isInteger(raffleThreshold) || (raffleThreshold as number) < 0) {
    return NextResponse.json(
      { error: "추첨권 기준점수는 0 이상 정수여야 합니다." },
      { status: 400 },
    );
  }

  updateDifficultyPoints(points as { id: number; points: number }[]);
  setRaffleThreshold(raffleThreshold as number);

  return NextResponse.json({
    difficulties: getDifficulties(),
    raffleThreshold: getRaffleThreshold(),
  });
}
