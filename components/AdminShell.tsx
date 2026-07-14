"use client";

import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/types";
import { ADMIN_LINKS, AppHeader } from "./AppHeader";

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

/** 운영진 페이지 공용 셸: 경로로 제목을 정하고 햄버거 네비를 제공. */
export function AdminShell({ user, children }: Props) {
  const pathname = usePathname();
  const title =
    ADMIN_LINKS.find((l) => l.href === pathname)?.label ?? "운영진";

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white">
      <AppHeader user={user} title={title} />
      <div className="px-4 py-4">{children}</div>
    </main>
  );
}
