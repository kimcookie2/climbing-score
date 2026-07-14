"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONFETTI_SEEN_KEY,
  POLL_INTERVAL_MS,
  type EventStatus,
} from "@/lib/constants";
import { apiGet } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import type { Difficulty, RankingRow, SessionUser } from "@/lib/types";
import { AppHeader } from "./AppHeader";
import { Podium } from "./Podium";
import { RankingTable } from "./RankingTable";

type RankingResponse = {
  difficulties: Difficulty[];
  ranking: RankingRow[];
};

async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  const end = Date.now() + 1200;
  const shoot = () => {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    if (Date.now() < end) requestAnimationFrame(shoot);
  };
  shoot();
}

export function ResultScreen({ user }: { user: SessionUser }) {
  const router = useRouter();
  const userId = user.userId;
  const [data, setData] = useState<RankingResponse | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    apiGet<RankingResponse>("/api/ranking")
      .then(setData)
      .catch(() => {});
  }, []);

  // 첫 진입 시에만 컨페티 재생 (localStorage로 반복 방지).
  useEffect(() => {
    if (!data) return;
    const seen = localStorage.getItem(CONFETTI_SEEN_KEY);
    if (!seen) {
      localStorage.setItem(CONFETTI_SEEN_KEY, "1");
      setShowCongrats(true);
      void fireConfetti();
    }
  }, [data]);

  // 발표가 취소되면(→ OPEN/CLOSED) seen 플래그를 지우고 기본 화면으로.
  usePolling(async () => {
    try {
      const { status } = await apiGet<{ status: EventStatus }>("/api/state");
      if (status !== "ANNOUNCED") {
        localStorage.removeItem(CONFETTI_SEEN_KEY);
        router.replace("/");
      }
    } catch {
      /* 무시 */
    }
  }, POLL_INTERVAL_MS);

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white pb-10">
      <AppHeader user={user} title="결과 발표" />
      <div className="bg-gradient-to-b from-indigo-50 to-white px-4 pb-6 pt-8">
        {showCongrats && (
          <p className="mb-6 text-center text-2xl font-black text-indigo-600">
            🎉 축하합니다! 🎉
          </p>
        )}
        {data && <Podium ranking={data.ranking} />}
      </div>

      <section className="px-4">
        <h2 className="mb-2 text-base font-bold text-slate-800">전체 성적표</h2>
        {data ? (
          <RankingTable
            difficulties={data.difficulties}
            ranking={data.ranking}
            highlightUserId={userId}
          />
        ) : (
          <p className="text-slate-400">불러오는 중…</p>
        )}
      </section>
    </main>
  );
}
