import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AdminShell } from "@/components/AdminShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버 측 admin 권한 검증 — 프론트 숨김만으로 처리하지 않는다.
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  return <AdminShell user={user}>{children}</AdminShell>;
}
