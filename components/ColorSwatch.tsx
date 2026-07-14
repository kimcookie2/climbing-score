type Props = {
  colorHex: string;
  size?: number;
};

/** 난이도 색상 스와치. 흰색/밝은 색은 테두리로 배경과 구분. */
export function ColorSwatch({ colorHex, size = 28 }: Props) {
  return (
    <span
      className="inline-block shrink-0 rounded-full border"
      style={{
        width: size,
        height: size,
        backgroundColor: colorHex,
        borderColor: "rgba(15, 23, 42, 0.25)",
      }}
      aria-hidden
    />
  );
}
