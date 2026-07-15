"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { POLL_INTERVAL_MS, type EventStatus } from "@/lib/constants";
import { apiGet } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import { calcRaffleTickets } from "@/lib/score";
import type { Difficulty, MyRecords, RankingRow, SessionUser } from "@/lib/types";
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
  const [tickets, setTickets] = useState<number | null>(null);

  useEffect(() => {
    apiGet<RankingResponse>("/api/ranking")
      .then(setData)
      .catch(() => {});

    // 헤더 추첨권 배지.
    apiGet<MyRecords>("/api/records/me")
      .then((d) =>
        setTickets(
          d.raffleThreshold > 0
            ? calcRaffleTickets(d.total, d.raffleThreshold)
            : null,
        ),
      )
      .catch(() => {});
  }, []);

  // 결과 페이지에 들어올 때마다 컨페티 재생.
  useEffect(() => {
    if (!data) return;
    setShowCongrats(true);
    void fireConfetti();
  }, [data]);

  // 발표가 취소되면(→ OPEN/CLOSED) 기본 화면으로.
  usePolling(async () => {
    try {
      const { status } = await apiGet<{ status: EventStatus }>("/api/state");
      if (status !== "ANNOUNCED") router.replace("/");
    } catch {
      /* 무시 */
    }
  }, POLL_INTERVAL_MS);

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white pb-10">
      <AppHeader user={user} title="결과 발표" tickets={tickets} />
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
