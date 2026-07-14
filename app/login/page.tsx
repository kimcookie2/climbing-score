"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiSend } from "@/lib/client";
import type { SessionUser } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      await apiSend<SessionUser>("/api/login", "POST", { nickname: trimmed });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-slate-900">
          🧗 득득배
        </h1>
        <h1 className="mb-2 text-center text-3xl font-bold text-slate-900">
          천하제일결정전
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500">
          닉네임을 입력하고 입장하세요.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            autoFocus
            autoComplete="off"
            className="h-14 rounded-xl border border-slate-300 bg-white px-4 text-lg outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !nickname.trim()}
            className="h-14 rounded-xl bg-slate-900 text-lg font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            {isSubmitting ? "입장 중…" : "입장"}
          </button>
        </form>
      </div>
    </main>
  );
}
