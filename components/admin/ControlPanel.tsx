"use client";

import { useEffect, useState } from "react";
import { POLL_INTERVAL_MS, type EventStatus } from "@/lib/constants";
import { ApiError, apiGet, apiSend } from "@/lib/client";
import { usePolling } from "@/hooks/usePolling";
import { Modal } from "@/components/Modal";

const STATUS_LABEL: Record<EventStatus, string> = {
  OPEN: "진행중",
  CLOSED: "집계중",
  ANNOUNCED: "발표됨",
};

const STATUS_STYLE: Record<EventStatus, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-amber-100 text-amber-700",
  ANNOUNCED: "bg-indigo-100 text-indigo-700",
};

type PendingAction = {
  path: string;
  icon: string;
  title: string;
  message: string;
  isDanger?: boolean;
};

export function ControlPanel() {
  const [status, setStatus] = useState<EventStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function refresh() {
    try {
      const data = await apiGet<{ status: EventStatus }>("/api/state");
      setStatus(data.status);
    } catch {
      /* 무시 */
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  usePolling(refresh, POLL_INTERVAL_MS, !busy && !pending);

  async function transition(path: string) {
    setBusy(true);
    setError("");
    try {
      const data = await apiSend<{ status: EventStatus }>(path, "POST");
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "전환에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function resetRecords() {
    setBusy(true);
    setError("");
    setResetDone(false);
    try {
      await apiSend("/api/records/reset", "POST");
      setResetDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "초기화에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (!status) return <p className="text-slate-400">불러오는 중…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-slate-500">현재 상태</span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        <ActionButton
          onClick={() =>
            setPending({
              path: "/api/event/close",
              icon: "🔒",
              title: "행사를 마감할까요?",
              message: "마감하면 크루원은 더 이상 점수를 입력할 수 없습니다.",
              isDanger: true,
            })
          }
          disabled={busy || status !== "OPEN"}
          variant="warn"
        >
          마감 (진행중 → 집계중)
        </ActionButton>

        <ActionButton
          onClick={() =>
            setPending({
              path: "/api/event/announce",
              icon: "🎉",
              title: "결과를 발표할까요?",
              message: "크루원 화면에 순위와 시상대가 공개됩니다.",
            })
          }
          disabled={busy || status !== "CLOSED"}
          variant="primary"
        >
          결과 발표 (집계중 → 발표됨)
        </ActionButton>

        <ActionButton
          onClick={() =>
            setPending({
              path: "/api/event/reopen",
              icon: "↩️",
              title: "마감을 취소할까요?",
              message: "행사가 다시 진행중 상태로 돌아가 점수 입력이 가능해집니다.",
            })
          }
          disabled={busy || status === "OPEN"}
          variant="ghost"
        >
          마감 취소 (→ 진행중)
        </ActionButton>
      </div>

      <div className="mt-2 border-t border-slate-200 pt-5">
        <p className="mb-3 text-sm text-slate-400">
          새 행사를 시작하기 전에 모든 크루원의 점수를 0으로 되돌립니다.
        </p>
        {resetDone && (
          <p className="mb-3 text-sm font-medium text-emerald-600">
            모든 기록이 초기화되었습니다.
          </p>
        )}
        <ActionButton
          onClick={() => setIsResetModalOpen(true)}
          disabled={busy}
          variant="danger"
        >
          기록 초기화
        </ActionButton>
      </div>

      <Modal
        isOpen={isResetModalOpen}
        icon="🧹"
        title="모든 기록을 초기화할까요?"
        message="전체 크루원의 점수가 0으로 초기화됩니다. 되돌릴 수 없습니다."
        confirmLabel="초기화"
        isDanger
        onConfirm={() => {
          setIsResetModalOpen(false);
          void resetRecords();
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <Modal
        isOpen={pending !== null}
        icon={pending?.icon}
        title={pending?.title ?? ""}
        message={pending?.message}
        isDanger={pending?.isDanger}
        onConfirm={() => {
          const path = pending?.path;
          setPending(null);
          if (path) void transition(path);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "warn" | "ghost" | "danger";
}) {
  const styles: Record<typeof variant, string> = {
    primary: "bg-indigo-600 text-white",
    warn: "bg-amber-500 text-white",
    ghost: "border border-slate-300 text-slate-700",
    danger: "w-full border border-red-300 text-red-600",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-14 rounded-xl text-base font-semibold transition active:scale-[0.98] disabled:opacity-30 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
