type Props = {
  /** false면 헤더 아래에 삽입되는 형태(전체 화면 높이 미사용). */
  fullScreen?: boolean;
};

/** 집계중 안내 화면 — 상태 CLOSED. */
export function WaitingScreen({ fullScreen = true }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 px-8 text-center ${
        fullScreen ? "min-h-dvh" : "py-24"
      }`}
    >
      <div className="text-5xl">⏳</div>
      <h1 className="text-xl font-bold text-slate-900">점수 집계중입니다.</h1>
      <p className="text-slate-500">잠시만 기다려주세요.</p>
    </div>
  );
}
