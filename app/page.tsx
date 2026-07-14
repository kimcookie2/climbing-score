import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEventStatus } from "@/lib/repo";
import { HomeScreen } from "@/components/HomeScreen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const status = getEventStatus();
  // 발표 상태의 크루원은 서버에서 바로 결과 페이지로 보낸다.
  if (status === "ANNOUNCED" && user.role !== "admin") redirect("/result");

  return <HomeScreen user={user} initialStatus={status} />;
}
