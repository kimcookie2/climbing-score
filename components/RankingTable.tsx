import type { Difficulty, RankingRow } from "@/lib/types";
import { ColorSwatch } from "./ColorSwatch";

type Props = {
  difficulties: Difficulty[];
  ranking: RankingRow[];
  highlightUserId?: number;
};

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/** 순위표 — 운영진/결과 페이지 공용. 난이도는 높은 순(흰색 → 빨강). */
export function RankingTable({ difficulties, ranking, highlightUserId }: Props) {
  const highToLow = [...difficulties].sort((a, b) => b.sort_order - a.sort_order);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr className="border-b border-slate-300 text-slate-500">
            <th className="whitespace-nowrap px-2 py-2 text-center">순위</th>
            <th className="whitespace-nowrap px-2 py-2 text-left">닉네임</th>
            <th className="whitespace-nowrap px-2 py-2 text-center font-semibold text-slate-700">
              총점
            </th>
            {highToLow.map((d) => (
              <th key={d.id} className="px-1.5 py-2 text-center">
                <ColorSwatch colorHex={d.color_hex} size={16} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranking.map((row) => {
            const isMe = row.userId === highlightUserId;
            const medal = MEDALS[row.rank];
            return (
              <tr
                key={row.userId}
                className={`border-b border-slate-100 ${
                  isMe ? "bg-amber-50 font-semibold" : ""
                }`}
              >
                <td className="whitespace-nowrap px-2 py-2 text-center font-bold text-slate-700">
                  {row.rank}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-left">
                  {medal && <span className="mr-1">{medal}</span>}
                  {row.nickname}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-center font-bold text-slate-900">
                  {row.totalScore}
                </td>
                {highToLow.map((d) => (
                  <td key={d.id} className="px-1.5 py-2 text-center text-slate-600">
                    {row.counts[d.id] ?? 0}
                  </td>
                ))}
              </tr>
            );
          })}
          {ranking.length === 0 && (
            <tr>
              <td colSpan={highToLow.length + 3} className="py-8 text-center text-slate-400">
                아직 기록이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
