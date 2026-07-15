"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { POLL_INTERVAL_MS, type EventStatus } from "@/lib/constants";
import { apiGet } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import type { SessionUser } from "@/lib/types";
import { ScoreInput } from "./ScoreInput";
import { WaitingScreen } from "./WaitingScreen";
import { AppHeader } from "./AppHeader";

type Props = {
  user: SessionUser;
  initialStatus: EventStatus;
};

/** 랜딩 화면. 상태 폴링으로 입력/집계중/결과를 자동 전환. */
export function HomeScreen({ user, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<EventStatus>(initialStatus);
  const [tickets, setTickets] = useState<number | null>(null);

  const isAdmin = user.role === "admin";

  usePolling(async () => {
    try {
      const data = await apiGet<{ status: EventStatus }>("/api/state");
      if (data.status !== status) setStatus(data.status);
    } catch {
      // 폴링 실패는 조용히 무시 (다음 주기 재시도).
    }
  }, POLL_INTERVAL_MS);

  // 크루원은 발표 상태가 되면 결과 페이지로 자동 이동 (초기 진입이 이미 발표 상태여도 동작).
  useEffect(() => {
    if (status === "ANNOUNCED" && !isAdmin) router.replace("/result");
  }, [status, isAdmin, router]);

  if (status !== "OPEN") {
    // 마감/발표 상태에서도 헤더(닉네임·나가기, 운영진은 네비게이션 포함)를 유지한다.
    return (
      <main className="mx-auto min-h-dvh max-w-md bg-white">
        <AppHeader user={user} title="점수 입력" />
        {status === "ANNOUNCED" && isAdmin ? (
          <div className="flex flex-col items-center gap-4 px-8 py-24 text-center">
            <div className="text-5xl">🎉</div>
            <p className="text-xl font-bold text-slate-900">
              결과가 발표되었습니다.
            </p>
            <Link
              href="/result"
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white"
            >
              결과 보러 가기
            </Link>
          </div>
        ) : (
          <WaitingScreen fullScreen={false} />
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-white">
      <AppHeader user={user} title="점수 입력" tickets={tickets} />
      <ScoreInput
        onTicketsChange={setTickets}
        onEventClosed={async () => {
          // 폴링을 기다리지 않고 즉시 서버 상태를 반영해 집계중 화면으로 전환.
          try {
            const data = await apiGet<{ status: EventStatus }>("/api/state");
            setStatus(data.status);
          } catch {
            setStatus("CLOSED");
          }
        }}
      />
    </main>
  );
}
