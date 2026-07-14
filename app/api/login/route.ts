// POST /api/login — 닉네임 검증 후 세션 발급. 공개.

import { NextResponse } from "next/server";
import { findUserByNickname } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const nickname =
    typeof (body as { nickname?: unknown })?.nickname === "string"
      ? (body as { nickname: string }).nickname.trim()
      : "";

  if (!nickname) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }

  const user = findUserByNickname(nickname);
  if (!user) {
    return NextResponse.json(
      { error: "등록되지 않은 닉네임입니다." },
      { status: 401 },
    );
  }

  const session = await getSession();
  session.userId = user.id;
  session.nickname = user.nickname;
  session.role = user.role;
  await session.save();

  return NextResponse.json({
    userId: user.id,
    nickname: user.nickname,
    role: user.role,
  });
}
