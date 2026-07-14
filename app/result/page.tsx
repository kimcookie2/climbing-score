import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEventStatus } from "@/lib/repo";
import { ResultScreen } from "@/components/ResultScreen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ResultPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // 발표 상태가 아니면 기본 화면으로.
  if (getEventStatus() !== "ANNOUNCED") redirect("/");

  return <ResultScreen user={user} />;
}
