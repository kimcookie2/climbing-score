import { useId } from "react";

type Props = {
  colorHex: string;
  size?: number;
};

/* ── 색상 유틸 ── */
const hexToRgb = (hex: string): number[] => {
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};

const toHex = (rgb: number[]): string =>
  "#" +
  rgb
    .map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0"))
    .join("");

const mix = (hex: string, target: string, amount: number): string => {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return toHex(a.map((c, i) => c + (b[i] - c) * amount));
};

const lighten = (hex: string, amt: number) => mix(hex, "#ffffff", amt);
const darken = (hex: string, amt: number) => mix(hex, "#000000", amt);

const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const HEART_PATH =
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

/** 난이도 색상 스와치 — 광택 하트. 흰색/검정처럼 극단 명도는 테두리 색을 보정해 배경과 구분. */
export function ColorSwatch({ colorHex, size = 28 }: Props) {
  const uid = useId().replace(/:/g, "");
  const lum = luminance(colorHex);

  const rim =
    lum > 0.72
      ? darken(colorHex, 0.3)
      : lum < 0.15
        ? lighten(colorHex, 0.22)
        : darken(colorHex, 0.2);
  const top = lighten(colorHex, lum < 0.15 ? 0.34 : 0.24);
  const bottom = darken(colorHex, 0.12);
  const shadow = darken(colorHex, lum > 0.8 ? 0.55 : 0.35);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="block shrink-0"
      style={{ filter: `drop-shadow(0 2px 3px ${shadow}40)` }}
    >
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="55%" stopColor={colorHex} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
        <clipPath id={`c-${uid}`}>
          <path d={HEART_PATH} />
        </clipPath>
      </defs>

      <path
        d={HEART_PATH}
        fill={`url(#g-${uid})`}
        stroke={rim}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* 왼쪽 위 하이라이트 — 젤리 같은 광택 */}
      <g clipPath={`url(#c-${uid})`}>
        <ellipse
          cx="8.4"
          cy="8.2"
          rx="2.9"
          ry="1.9"
          fill="#fff"
          opacity={lum > 0.8 ? 0.5 : 0.42}
          transform="rotate(-38 8.4 8.2)"
        />
      </g>
    </svg>
  );
}
