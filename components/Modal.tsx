"use client";

type Props = {
  isOpen: boolean;
  icon?: string;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true면 확인 버튼을 위험(빨강) 스타일로 표시. */
  isDanger?: boolean;
  onConfirm: () => void;
  /** 전달 시 취소 버튼이 함께 표시된다(확인 다이얼로그). 미전달 시 알림 모달. */
  onCancel?: () => void;
};

/** 공용 모달 — 알림(확인 1버튼) / 확인 다이얼로그(확인+취소) 겸용. */
export function Modal({
  isOpen,
  icon,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  isDanger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onCancel ?? onConfirm}
      />
      <div className="relative w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
        {icon && <div className="mb-3 text-4xl">{icon}</div>}
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {message && <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>}
        <div className="mt-5 flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-12 flex-1 rounded-xl border border-slate-300 font-semibold text-slate-700 transition active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`h-12 flex-1 rounded-xl font-semibold text-white transition active:scale-[0.98] ${
              isDanger ? "bg-red-600" : "bg-slate-900"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
