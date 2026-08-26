"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiGet, apiSend } from "@/lib/client";
import type { RaffleParticipant, RaffleStatus } from "@/lib/types";
import { Modal } from "@/components/Modal";

/* ── 릴 연출 상수 ── */
const ITEM_H = 76;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);
const LEAD_IN = 58; // 당첨자 앞에 지나갈 이름 개수

const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutQuad = (x: number) => 1 - (1 - x) * (1 - x);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** 마무리 연출 패턴 — 매 추첨마다 랜덤 선택. curve(t, target)는 t∈[0,1]에서의 y 위치. */
type SpinEnding = {
  duration: number;
  curve: (t: number, target: number) => number;
};

const ENDINGS: SpinEnding[] = [
  {
    // ① 기본 — 살짝(30px) 지나쳤다가 스르륵 복귀
    duration: 5200,
    curve: (t, target) =>
      t < 0.88
        ? (target + 30) * easeOutQuint(t / 0.88)
        : target + 30 * (1 - easeOutCubic((t - 0.88) / 0.12)),
  },
  {
    // ② 두 칸 가까이 확 넘어갔다가 천천히 되감기 — "아깝게 지나쳤나?!"
    duration: 6000,
    curve: (t, target) => {
      const over = ITEM_H * 1.7;
      return t < 0.76
        ? (target + over) * easeOutQuint(t / 0.76)
        : target + over * (1 - easeInOutCubic((t - 0.76) / 0.24));
    },
  },
  {
    // ③ 한 칸 지나쳐 멈칫… 반대방향으로 한 칸 쏙 (미세 바운스)
    duration: 5600,
    curve: (t, target) => {
      const over = ITEM_H;
      if (t < 0.78) return (target + over) * easeOutQuint(t / 0.78);
      if (t < 0.9) return target + over; // 긴장의 정적
      return target + over * (1 - easeOutBack((t - 0.9) / 0.1));
    },
  },
  {
    // ④ 마지막 한 칸을 아주 천천히 기어가서 도착 — 초조한 슬로우
    duration: 6400,
    curve: (t, target) => {
      const crawlFrom = target - ITEM_H * 0.95;
      return t < 0.6
        ? crawlFrom * easeOutCubic(t / 0.6)
        : crawlFrom + ITEM_H * 0.95 * easeOutQuad((t - 0.6) / 0.4);
    },
  },
];

/** 추첨권 수에 비례한 풀에서 인접 중복 없이 뽑는 픽 함수 생성. */
function makePicker(people: readonly RaffleParticipant[]) {
  const pool = people.flatMap((p) => Array<RaffleParticipant>(p.tickets).fill(p));
  // 인접 중복 회피는 "서로 다른 사람"이 2명 이상일 때만 의미가 있다.
  // pool.length로 판단하면 1명이 추첨권을 여러 장 가진 경우 무한 루프에 빠진다.
  const distinctPeople = new Set(pool.map((p) => p.userId)).size;
  let last: number | null = null;
  return {
    pick(): RaffleParticipant {
      let c: RaffleParticipant;
      do {
        c = pool[Math.floor(Math.random() * pool.length)];
      } while (distinctPeople > 1 && c.userId === last);
      last = c.userId;
      return c;
    },
    setLast(id: number) {
      last = id;
    },
  };
}

/** 릴 스트립 — 이름이 추첨권 수에 비례해 섞여 등장해서 확률이 눈에 보인다. */
function buildStrip(
  people: readonly RaffleParticipant[],
  winner: RaffleParticipant,
): RaffleParticipant[] {
  const picker = makePicker(people);
  const strip: RaffleParticipant[] = [];
  for (let i = 0; i < LEAD_IN; i++) strip.push(picker.pick());
  strip.push(winner);
  picker.setLast(winner.userId);
  for (let i = 0; i < VISIBLE; i++) strip.push(picker.pick());
  return strip;
}

/** 대기 화면용 스트립 — 시작 전에도 이름들이 섞여 보이도록. */
function buildIdleStrip(people: readonly RaffleParticipant[]): RaffleParticipant[] {
  if (people.length === 0) return [];
  const picker = makePicker(people);
  return Array.from({ length: VISIBLE }, () => picker.pick());
}

async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  const end = Date.now() + 1200;
  const shoot = () => {
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.45 } });
    if (Date.now() < end) requestAnimationFrame(shoot);
  };
  shoot();
}

type Phase = "idle" | "spinning" | "won";

export function RaffleScreen() {
  const [status, setStatus] = useState<RaffleStatus | null>(null);
  const [strip, setStrip] = useState<RaffleParticipant[]>([]);
  const [offset, setOffset] = useState(0);
  const [blur, setBlur] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [winner, setWinner] = useState<RaffleParticipant | null>(null);
  const [drawTotal, setDrawTotal] = useState(0); // 당첨 확률 표기용(추첨 시점 총 응모 수)
  const [error, setError] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const rafRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await apiGet<RaffleStatus>("/api/raffle"));
    } catch {
      setError("추첨 현황을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [load]);

  // 대기 상태에서는 현재 응모자들로 섞인 스트립을 미리 보여준다.
  useEffect(() => {
    if (phase === "idle" && status) {
      setStrip(buildIdleStrip(status.participants));
    }
  }, [phase, status]);

  const totalTickets =
    status?.participants.reduce((s, p) => s + p.tickets, 0) ?? 0;

  /* ── 뽑기 시작: 서버가 당첨자를 결정하고, 릴은 결과를 보여주기만 한다 ── */
  async function start() {
    if (phase === "spinning" || !status || totalTickets === 0) return;
    setError("");

    let win: RaffleParticipant;
    let pool: RaffleParticipant[];
    try {
      const res = await apiSend<{
        winner: RaffleParticipant;
        participants: RaffleParticipant[];
      }>("/api/raffle/draw", "POST");
      win = res.winner;
      pool = res.participants;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "추첨에 실패했습니다.");
      return;
    }

    setDrawTotal(pool.reduce((s, p) => s + p.tickets, 0));
    setStrip(buildStrip(pool, win));
    setWinner(null);
    setPhase("spinning");

    const target = (LEAD_IN - CENTER) * ITEM_H;
    const isReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const finish = () => {
      setBlur(0);
      setOffset(target);
      setPhase("won");
      setWinner(win);
      void fireConfetti();
      void load(); // 당첨자 제외 반영된 최신 현황
    };

    if (isReduced) {
      finish();
      return;
    }

    // 마무리 연출을 랜덤 선택 — 매번 다른 긴장감
    const ending = ENDINGS[Math.floor(Math.random() * ENDINGS.length)];
    const t0 = performance.now();
    let prev = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ending.duration);
      const y = ending.curve(t, target);
      // 속도에 비례한 은은한 블러 — 빠를 때도 이름이 살짝 읽히게 약하게만
      setBlur(Math.min(2, Math.abs(y - prev) * 0.04));
      prev = y;
      setOffset(y);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        finish();
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function nextDraw() {
    setOffset(0);
    setWinner(null);
    setPhase("idle");
  }

  async function resetWinners() {
    setError("");
    try {
      await apiSend("/api/raffle/reset", "POST");
      nextDraw();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "초기화에 실패했습니다.");
    }
  }

  if (!status) {
    return <p className="p-6 text-center text-slate-400">불러오는 중…</p>;
  }

  const isThresholdUnset = status.raffleThreshold <= 0;

  return (
    <div className="-mx-4 -my-4 min-h-[calc(100dvh-3.5rem)] bg-slate-950 px-4 py-6 text-white">
      <header className="mx-auto mb-6 max-w-md text-center">
        <h1 className="text-2xl font-extrabold">🎫 추첨권 뽑기</h1>
        <p className="mt-2 text-sm text-slate-400">
          응모 {totalTickets}장 · 참가 {status.participants.length}명
        </p>
      </header>

      {isThresholdUnset && (
        <p className="mx-auto mb-4 max-w-md rounded-xl bg-white/5 px-4 py-3 text-center text-sm text-slate-400">
          추첨권 기준점수가 설정되지 않았습니다. 배점 설정에서 기준점수를 먼저
          저장해주세요.
        </p>
      )}

      {/* ── 릴 ── */}
      <div className="relative mx-auto max-w-md">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
          style={{ height: ITEM_H * VISIBLE }}
        >
          {/* 당첨선 */}
          <div
            className="pointer-events-none absolute inset-x-0 z-20 border-y-2 border-amber-400/70 bg-amber-400/5"
            style={{ top: CENTER * ITEM_H, height: ITEM_H }}
          >
            <span className="absolute -left-px top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-amber-400" />
            <span className="absolute -right-px top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-amber-400" />
          </div>

          {/* 위아래 페이드 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-slate-900 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-slate-900 to-transparent" />

          <div
            style={{
              transform: `translateY(${-offset}px)`,
              filter: blur > 0.4 ? `blur(${blur}px)` : "none",
            }}
          >
            {strip.length === 0 && (
              <div
                className="flex items-center justify-center text-slate-600"
                style={{ height: ITEM_H * VISIBLE }}
              >
                뽑기 시작을 눌러주세요
              </div>
            )}
            {strip.map((p, i) => {
              const isWinnerRow = phase === "won" && i === LEAD_IN;
              return (
                <div
                  key={i}
                  className="flex items-center justify-center"
                  style={{ height: ITEM_H }}
                >
                  <span
                    className={`font-extrabold transition-all duration-300 ${
                      isWinnerRow
                        ? "text-3xl text-amber-300"
                        : "text-2xl text-slate-200"
                    }`}
                  >
                    {p.nickname}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 결과 / 버튼 ── */}
      <div className="mx-auto mt-6 max-w-md">
        {error && (
          <p className="mb-3 text-center text-sm font-medium text-red-400">
            {error}
          </p>
        )}

        {phase === "won" && winner ? (
          <div className="rise-in space-y-3 text-center">
            <p className="text-sm font-semibold text-amber-300">🎉 축하합니다</p>
            <p className="text-3xl font-extrabold">{winner.nickname}</p>
            <p className="text-sm text-slate-400">
              응모 {winner.tickets}장 · 당첨 확률{" "}
              {drawTotal > 0 ? ((winner.tickets / drawTotal) * 100).toFixed(1) : 0}
              %
            </p>
            <p className="text-xs text-slate-500">
              당첨자는 다음 추첨에서 자동으로 제외됩니다.
            </p>
            <button
              type="button"
              onClick={nextDraw}
              className="w-full rounded-xl bg-white py-3.5 font-bold text-slate-900 transition active:scale-[0.98]"
            >
              다음 추첨
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void start()}
            disabled={phase === "spinning" || totalTickets === 0}
            className="relative w-full overflow-hidden rounded-xl bg-amber-400 py-4 text-lg font-extrabold text-slate-950 transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500"
          >
            {phase === "spinning" ? (
              <span className="glow-pulse">뽑는 중…</span>
            ) : totalTickets === 0 ? (
              "남은 응모권이 없습니다"
            ) : (
              "뽑기 시작"
            )}
          </button>
        )}
      </div>

      {/* ── 응모 현황 ── */}
      <div className="mx-auto mt-8 max-w-md">
        <h2 className="mb-3 text-sm font-bold text-slate-400">응모 현황</h2>
        {status.participants.length === 0 ? (
          <p className="rounded-lg bg-white/5 px-3 py-4 text-center text-sm text-slate-500">
            응모 가능한 크루원이 없습니다.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {[...status.participants]
              .sort((a, b) => b.tickets - a.tickets)
              .map((p) => {
                const pct =
                  totalTickets > 0 ? (p.tickets / totalTickets) * 100 : 0;
                const isWin = phase === "won" && winner?.userId === p.userId;
                return (
                  <li
                    key={p.userId}
                    className="relative overflow-hidden rounded-lg bg-white/5 px-3 py-2.5"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 ${
                        isWin ? "bg-amber-400/25" : "bg-white/5"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center">
                      <span
                        className={`text-sm font-semibold ${
                          isWin ? "text-amber-300" : "text-slate-200"
                        }`}
                      >
                        {p.nickname}
                      </span>
                      <span className="ml-auto text-xs tabular-nums text-slate-400">
                        {p.tickets}장 · {pct.toFixed(1)}%
                      </span>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}

        {/* 제외 대상 안내 */}
        {(status.excludedTop.length > 0 || status.winners.length > 0) && (
          <div className="mt-5 space-y-2 text-xs text-slate-500">
            {status.excludedTop.length > 0 && (
              <p>
                👑 점수 1·2·3등 제외:{" "}
                <span className="text-slate-400">
                  {status.excludedTop.map((t) => t.nickname).join(", ")}
                </span>
              </p>
            )}
            {status.winners.length > 0 && (
              <p>
                🏆 당첨 완료:{" "}
                <span className="text-amber-300/80">
                  {status.winners.map((w) => w.nickname).join(" → ")}
                </span>
              </p>
            )}
          </div>
        )}

        {status.winners.length > 0 && (
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="mt-6 w-full rounded-xl border border-white/15 py-3 text-sm font-semibold text-slate-400 transition active:scale-[0.98]"
          >
            당첨 기록 초기화
          </button>
        )}
      </div>

      <Modal
        isOpen={isResetModalOpen}
        icon="♻️"
        title="당첨 기록을 초기화할까요?"
        message="모든 당첨자가 다시 응모 대상이 됩니다."
        confirmLabel="초기화"
        isDanger
        onConfirm={() => {
          setIsResetModalOpen(false);
          void resetWinners();
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
