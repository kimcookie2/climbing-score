// PATCH/DELETE /api/users/[id] — 권한 변경 / 삭제. admin 전용.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/constants";
import {
  countAdmins,
  deleteUser,
  getUserById,
  updateUserRole,
} from "@/lib/repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "잘못된 사용자입니다." }, { status: 400 });
  }
  const target = getUserById(id);
  if (!target) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const role = (body as { role?: unknown }).role as Role;
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "권한 값이 올바르지 않습니다." }, { status: 400 });
  }

  // 마지막 운영진을 크루원으로 강등하는 것 금지.
  if (target.role === "admin" && role === "member" && countAdmins() <= 1) {
    return NextResponse.json(
      { error: "운영진은 최소 1명 유지되어야 합니다." },
      { status: 409 },
    );
  }

  updateUserRole(id, role);
  return NextResponse.json({ user: getUserById(id) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "잘못된 사용자입니다." }, { status: 400 });
  }
  const target = getUserById(id);
  if (!target) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  // 본인 삭제 금지.
  if (target.id === auth.user.userId) {
    return NextResponse.json(
      { error: "본인 계정은 삭제할 수 없습니다." },
      { status: 409 },
    );
  }
  // 마지막 운영진 삭제 금지.
  if (target.role === "admin" && countAdmins() <= 1) {
    return NextResponse.json(
      { error: "운영진은 최소 1명 유지되어야 합니다." },
      { status: 409 },
    );
  }

  deleteUser(id);
  return NextResponse.json({ ok: true });
}
