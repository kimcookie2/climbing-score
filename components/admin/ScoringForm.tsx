"use client";

import { useEffect, useState } from "react";
import { ApiError, apiGet, apiSend } from "@/lib/client";
import type { Difficulty } from "@/lib/types";
import { ColorSwatch } from "@/components/ColorSwatch";

export function ScoringForm() {
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [points, setPoints] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet<{ difficulties: Difficulty[] }>("/api/scoring")
      .then(({ difficulties }) => {
        setDifficulties(difficulties);
        setPoints(
          Object.fromEntries(difficulties.map((d) => [d.id, String(d.points)])),
        );
      })
      .catch(() => setError("불러오기에 실패했습니다."));
  }, []);

  const highToLow = [...difficulties].sort((a, b) => b.sort_order - a.sort_order);

  async function handleSave() {
    setBusy(true);
    setError("");
    setSaved(false);

    const payload = highToLow.map((d) => ({
      id: d.id,
      points: Number(points[d.id]),
    }));
    const invalid = payload.some(
      (p) => !Number.isInteger(p.points) || p.points < 0,
    );
    if (invalid) {
      setError("배점은 0 이상 정수여야 합니다.");
      setBusy(false);
      return;
    }

    try {
      await apiSend("/api/scoring", "PUT", { points: payload });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
        저장 즉시 모든 크루원의 총점 계산에 반영됩니다.
      </p>

      <ul className="flex flex-col gap-2">
        {highToLow.map((d) => (
          <li key={d.id} className="flex items-center gap-3">
            <ColorSwatch colorHex={d.color_hex} />
            <span className="w-14 font-semibold text-slate-800">{d.color_name}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={points[d.id] ?? ""}
              onChange={(e) => {
                setSaved(false);
                setPoints((prev) => ({ ...prev, [d.id]: e.target.value }));
              }}
              className="ml-auto h-11 w-24 rounded-lg border border-slate-300 px-3 text-right text-lg tabular-nums outline-none focus:border-slate-900"
            />
            <span className="text-slate-400">점</span>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {saved && <p className="text-sm font-medium text-emerald-600">저장되었습니다.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={busy}
        className="h-14 rounded-xl bg-slate-900 text-lg font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
      >
        {busy ? "저장 중…" : "일괄 저장"}
      </button>
    </div>
  );
}
