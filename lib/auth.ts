// Route Handler용 인증/권한 가드. 실패 시 NextResponse(에러)를 반환한다.

import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import type { SessionUser } from "./types";

export type GuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/** 로그인 필요. 미인증 시 401. */
export async function requireAuth(): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

/** 운영진 필요. 미인증 401, 권한 부족 403. */
export async function requireAdmin(): Promise<GuardResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }),
    };
  }
  return auth;
}
