// iron-session 서명 쿠키 세션 설정 및 헬퍼. 서버 전용.

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./constants";
import type { SessionUser } from "./types";

export type SessionData = Partial<SessionUser>;

// iron-session 비밀키는 32자 이상이어야 한다. 운영 환경에서는 반드시 SESSION_SECRET 설정.
const DEV_FALLBACK_SECRET = "dev_only_insecure_secret_change_me_please_32+";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET(32자 이상)가 설정되지 않았습니다.");
  }
  return DEV_FALLBACK_SECRET;
}

// 비밀키 검증은 요청 시점에 수행한다(빌드 시 모듈 로드에서 throw 방지).
function getSessionOptions(): SessionOptions {
  return {
    password: getSecret(),
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // nginx가 HTTPS 종료를 담당하므로 프록시 뒤에서 secure 쿠키 사용.
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

/** 로그인된 사용자 정보 반환, 없으면 null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session.userId || !session.nickname || !session.role) return null;
  return {
    userId: session.userId,
    nickname: session.nickname,
    role: session.role,
  };
}
