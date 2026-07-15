"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, apiGet, apiSend } from "@/lib/client";
import { calcRaffleTickets, calcTotalScore } from "@/lib/score";
import type { Difficulty, MyRecords } from "@/lib/types";
import { ColorSwatch } from "./ColorSwatch";
import { Modal } from "./Modal";

const SAVE_DEBOUNCE_MS = 500;

type SaveState = "idle" | "saving" | "saved" | "error";

type Props = {
  /** 마감(409) 감지 시 호출 — 상위에서 집계중 화면으로 전환한다. */
  onEventClosed?: () => void;
};

export function ScoreInput({ onEventClosed }: Props) {
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [isClosedModalOpen, setIsClosedModalOpen] = useState(false);
  const [raffleThreshold, setRaffleThreshold] = useState(0);

  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    apiGet<MyRecords>("/api/records/me")
      .then((data) => {
        setDifficulties(data.difficulties);
        setCounts(data.counts);
        setRaffleThreshold(data.raffleThreshold);
      })
      .catch(() => setSaveState("error"))
      .finally(() => setIsLoading(false));

    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
    };
  }, []);

  function scheduleSave(difficultyId: number, count: number) {
    const existing = timers.current.get(difficultyId);
    if (existing) clearTimeout(existing);

    setSaveState("saving");
    const timer = setTimeout(async () => {
      try {
        await apiSend<MyRecords>("/api/records/me", "PUT", {
          difficulty_id: difficultyId,
          count,
        });
        setSaveState("saved");
      } catch (err) {
        setSaveState("error");
        if (err instanceof ApiError && err.status === 409) {
          // 마감됨: 안내 모달을 띄우고 확인 시 집계중 화면으로 즉시 전환.
          setIsClosedModalOpen(true);
        }
      }
    }, SAVE_DEBOUNCE_MS);
    timers.current.set(difficultyId, timer);
  }

  function setCount(difficultyId: number, next: number) {
    const clamped = Math.max(0, Math.floor(next));
    setCounts((prev) => ({ ...prev, [difficultyId]: clamped }));
    scheduleSave(difficultyId, clamped);
  }

  // 높은 난이도부터(흰색 → 빨강).
  const highToLow = [...difficulties].sort((a, b) => b.sort_order - a.sort_order);
  const total = calcTotalScore(counts, difficulties);
  const tickets = calcRaffleTickets(total, raffleThreshold);

  if (isLoading) {
    return <p className="p-6 text-center text-slate-400">불러오는 중…</p>;
  }

  return (
    <div className="pb-28">
      <ul className="divide-y divide-slate-200">
        {highToLow.map((d) => (
          <li key={d.id} className="flex items-center gap-3 px-4 py-3">
            <ColorSwatch colorHex={d.color_hex} />
            <span className="w-14 text-base font-semibold tabular-nums text-slate-800">
              {d.points}점
            </span>
            <span className="ml-auto flex items-center gap-2">
              <StepperButton
                label="빼기"
                onClick={() => setCount(d.id, (counts[d.id] ?? 0) - 1)}
                disabled={(counts[d.id] ?? 0) <= 0}
              >
                −
              </StepperButton>
              <CountInput
                value={counts[d.id] ?? 0}
                onChange={(v) => setCount(d.id, v)}
              />
              <StepperButton
                label="더하기"
                onClick={() => setCount(d.id, (counts[d.id] ?? 0) + 1)}
              >
                +
              </StepperButton>
            </span>
          </li>
        ))}
      </ul>

      <TotalBar
        total={total}
        tickets={tickets}
        showTickets={raffleThreshold > 0}
        saveState={saveState}
      />

      <Modal
        isOpen={isClosedModalOpen}
        icon="⏰"
        title="이미 마감되었습니다"
        message="운영진이 행사를 마감하여 더 이상 점수를 입력할 수 없습니다."
        onConfirm={() => {
          setIsClosedModalOpen(false);
          onEventClosed?.();
        }}
      />
    </div>
  );
}

function StepperButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-700 transition active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function CountInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={String(value)}
      onChange={(e) => {
        // 숫자만 남기고 정수로 변환 — 앞자리 0("03")은 3으로 정규화되어 표시된다.
        const digits = e.target.value.replace(/\D/g, "");
        onChange(digits === "" ? 0 : Number(digits));
      }}
      onFocus={(e) => e.target.select()}
      className="h-11 w-14 rounded-lg border border-slate-200 text-center text-xl font-semibold tabular-nums outline-none focus:border-slate-900"
    />
  );
}

function TotalBar({
  total,
  tickets,
  showTickets,
  saveState,
}: {
  total: number;
  tickets: number;
  showTickets: boolean;
  saveState: SaveState;
}) {
  const saveLabel: Record<SaveState, string> = {
    idle: "",
    saving: "저장 중…",
    saved: "✓ 저장됨",
    error: "⚠ 저장 실패",
  };
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <span
          className={`text-sm ${
            saveState === "error" ? "text-red-600" : "text-slate-400"
          }`}
        >
          {saveLabel[saveState]}
        </span>
        <span className="flex items-center gap-3">
          {showTickets && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
              🎫 추첨권 <span className="tabular-nums">{tickets}</span>개
            </span>
          )}
          <span className="text-lg font-bold text-slate-900">
            총점 <span className="tabular-nums">{total}</span>점
          </span>
        </span>
      </div>
    </div>
  );
}
