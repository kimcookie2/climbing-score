// 지정 주기로 콜백을 실행하는 폴링 훅. 언마운트 시 정리.

import { useEffect, useRef } from "react";

/**
 * @param callback 폴링마다 실행할 함수 (최신 클로저를 ref로 유지)
 * @param intervalMs 폴링 주기
 * @param enabled false면 폴링 중지
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
): void {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      void savedCallback.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
