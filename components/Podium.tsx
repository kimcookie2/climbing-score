import type { RankingRow } from "@/lib/types";

type Props = {
  ranking: RankingRow[];
};

const STEP_STYLE: Record<number, { height: string; bg: string; medal: string }> = {
  1: { height: "h-32", bg: "bg-amber-300", medal: "🥇" },
  2: { height: "h-24", bg: "bg-slate-300", medal: "🥈" },
  3: { height: "h-20", bg: "bg-orange-300", medal: "🥉" },
};

/** 시상대 — 왼쪽부터 2등, 1등(가운데·최고), 3등. 동점자는 함께 표시. */
export function Podium({ ranking }: Props) {
  const byRank = (rank: number) => ranking.filter((r) => r.rank === rank);
  const order = [2, 1, 3];

  return (
    <div className="flex items-end justify-center gap-2 px-2">
      {order.map((rank) => {
        const winners = byRank(rank);
        if (winners.length === 0) {
          return <div key={rank} className="flex-1" aria-hidden />;
        }
        const style = STEP_STYLE[rank];
        return (
          <div key={rank} className="flex flex-1 flex-col items-center gap-2">
            <div className="text-2xl">{style.medal}</div>
            <div className="flex flex-col items-center gap-0.5">
              {winners.map((w) => (
                <span
                  key={w.userId}
                  className="max-w-full truncate text-sm font-bold text-slate-800"
                >
                  {w.nickname}
                </span>
              ))}
            </div>
            <div
              className={`flex w-full items-start justify-center rounded-t-lg ${style.height} ${style.bg}`}
            >
              <span className="mt-2 text-lg font-black text-white/90">{rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
