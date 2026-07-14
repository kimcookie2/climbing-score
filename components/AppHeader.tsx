"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/client";
import type { SessionUser } from "@/lib/types";

type Props = {
  user: SessionUser;
  title: string;
};

export const ADMIN_LINKS = [
  { href: "/", label: "점수 입력" },
  { href: "/admin/ranking", label: "순위표" },
  { href: "/admin/scoring", label: "배점 설정" },
  { href: "/admin/control", label: "마감 관리" },
  { href: "/admin/members", label: "크루원 관리" },
];

export function AppHeader({ user, title }: Props) {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const isAdmin = user.role === "admin";

  async function handleLogout() {
    await apiSend("/api/logout", "POST");
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
        {isAdmin && (
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setIsNavOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100"
          >
            <span className="text-2xl leading-none">☰</span>
          </button>
        )}
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        <span className="ml-auto text-sm font-medium text-slate-500">
          {user.nickname}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-slate-400 active:text-slate-600"
        >
          나가기
        </button>
      </header>

      {isAdmin && isNavOpen && (
        <div className="fixed inset-0 z-30">
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsNavOpen(false)}
          />
          <nav
            aria-label="운영진 메뉴"
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white p-4 shadow-xl"
          >
            <p className="mb-4 px-2 text-xs font-semibold tracking-wide text-slate-400">
              메뉴
            </p>
            <ul className="flex flex-col gap-1">
              {ADMIN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsNavOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 active:bg-slate-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

    </>
  );
}
