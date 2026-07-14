"use client";

import { useEffect, useState } from "react";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { apiGet } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import type { Difficulty, RankingRow } from "@/lib/types";
import { RankingTable } from "@/components/RankingTable";

type RankingResponse = {
  difficulties: Difficulty[];
  ranking: RankingRow[];
};

export function RankingView() {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setData(await apiGet<RankingResponse>("/api/ranking"));
      setError("");
    } catch {
      setError("불러오기에 실패했습니다.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  usePolling(refresh, POLL_INTERVAL_MS);

  if (error && !data) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-400">불러오는 중…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {POLL_INTERVAL_MS / 1000}초마다 자동 갱신
        </p>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 active:bg-slate-100"
        >
          새로고침
        </button>
      </div>
      <RankingTable difficulties={data.difficulties} ranking={data.ranking} />
    </div>
  );
}
