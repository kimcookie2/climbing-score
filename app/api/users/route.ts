// GET/POST /api/users — 사용자 목록 조회 / 추가. admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/constants";
import { createUser, findUserByNickname, getAllUsers } from "@/lib/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ users: getAllUsers() });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const raw = body as { nickname?: unknown; role?: unknown };
  const nickname = typeof raw.nickname === "string" ? raw.nickname.trim() : "";
  const role = raw.role as Role;

  if (!nickname) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "권한 값이 올바르지 않습니다." }, { status: 400 });
  }
  if (findUserByNickname(nickname)) {
    return NextResponse.json(
      { error: "이미 존재하는 닉네임입니다." },
      { status: 409 },
    );
  }

  const user = createUser(nickname, role);
  return NextResponse.json({ user }, { status: 201 });
}
