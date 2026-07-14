"use client";

import { useEffect, useState } from "react";
import { ApiError, apiGet, apiSend } from "@/lib/client";
import type { Role } from "@/lib/constants";
import type { MeResponse, User } from "@/lib/types";
import { Modal } from "@/components/Modal";

export function MembersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [myId, setMyId] = useState<number | null>(null);
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  async function loadUsers() {
    const { users } = await apiGet<{ users: User[] }>("/api/users");
    setUsers(users);
  }

  useEffect(() => {
    void loadUsers().catch(() => setError("불러오기에 실패했습니다."));
    apiGet<MeResponse>("/api/me")
      .then((me) => setMyId(me.userId))
      .catch(() => {});
  }, []);

  const adminCount = users.filter((u) => u.role === "admin").length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    try {
      await apiSend("/api/users", "POST", { nickname: trimmed, role });
      setNickname("");
      setRole("member");
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "추가에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleToggle(user: User) {
    const nextRole: Role = user.role === "admin" ? "member" : "admin";
    setError("");
    try {
      await apiSend(`/api/users/${user.id}`, "PATCH", { role: nextRole });
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "권한 변경에 실패했습니다.");
    }
  }

  async function handleDelete(user: User) {
    setError("");
    try {
      await apiSend(`/api/users/${user.id}`, "DELETE");
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제에 실패했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3"
      >
        <p className="text-sm font-semibold text-slate-700">크루원 추가</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            autoComplete="off"
            className="h-11 flex-1 rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-900"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-11 rounded-lg border border-slate-300 px-2"
          >
            <option value="member">크루원</option>
            <option value="admin">운영진</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={busy || !nickname.trim()}
          className="h-11 rounded-lg bg-slate-900 font-semibold text-white disabled:opacity-40"
        >
          추가
        </button>
      </form>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <ul className="flex flex-col divide-y divide-slate-100">
        {users.map((user) => {
          const isSelf = user.id === myId;
          const isLastAdmin = user.role === "admin" && adminCount <= 1;
          return (
            <li key={user.id} className="flex items-center gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">
                  {user.nickname}
                  {isSelf && <span className="ml-1 text-xs text-slate-400">(나)</span>}
                </p>
                <p className="text-xs text-slate-400">
                  {user.role === "admin" ? "운영진" : "크루원"} ·{" "}
                  {user.created_at?.slice(0, 10)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRoleToggle(user)}
                disabled={isLastAdmin}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 active:bg-slate-100 disabled:opacity-30"
              >
                {user.role === "admin" ? "크루원으로" : "운영진으로"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(user)}
                disabled={isSelf || isLastAdmin}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 active:bg-red-50 disabled:opacity-30"
              >
                삭제
              </button>
            </li>
          );
        })}
      </ul>

      <Modal
        isOpen={deleteTarget !== null}
        icon="🗑️"
        title={`${deleteTarget?.nickname ?? ""}님을 삭제할까요?`}
        message="해당 크루원의 풀이 기록도 함께 삭제됩니다."
        confirmLabel="삭제"
        isDanger
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target) void handleDelete(target);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
