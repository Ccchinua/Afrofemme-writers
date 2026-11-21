import type { CSSProperties } from "react";

type BeadMarkVariant = "full" | "ring" | "bead" | "cluster";

type BeadMarkProps = {
  variant?: BeadMarkVariant;
  size?: number;
  className?: string;
  label?: string;
};

const palette = [
  "#176B50", "#FFF7EA", "#3157A4", "#852D4B", "#69416F",
  "#F07869", "#E5AC43", "#F5C5A8", "#242438",
] as const;

const ring = palette.map((color, index) => {
  const angle = ((index * 40) - 90) * Math.PI / 180;
  return {
    color,
    x: 50 + Math.cos(angle) * 32,
    y: 50 + Math.sin(angle) * 32,
  };
});

function Bead({ x, y, color, radius = 6 }: { x: number; y: number; color: string; radius?: number }) {
  return (
    <g>
      <circle cx={x + 1.5} cy={y + 1.7} r={radius} fill="#171725" className="bead-shadow" />
      <circle cx={x} cy={y} r={radius} fill={color} stroke="rgba(36,36,56,.24)" strokeWidth=".65" />
      <circle cx={x - radius * .34} cy={y - radius * .36} r={Math.max(1, radius * .22)} fill="#FFFFFF" className="bead-highlight" />
    </g>
  );
}

export default function BeadMark({
  variant = "full",
  size = 64,
  className,
  label = "Afrofemme bead mark",
}: BeadMarkProps) {
  const style: CSSProperties = { width: size, height: size };
  const isDecorative = !label;

  if (variant === "bead") {
    return (
      <svg className={["af-bead-mark", className].filter(Boolean).join(" ")} style={style} viewBox="0 0 24 24" role={isDecorative ? undefined : "img"} aria-label={isDecorative ? undefined : label} aria-hidden={isDecorative}>
        <Bead x={10} y={10} color={palette[0]} radius={7} />
      </svg>
    );
  }

  if (variant === "cluster") {
    const beads = [
      { x: 9, y: 10, color: palette[0] },
      { x: 20, y: 7, color: palette[5] },
      { x: 19, y: 19, color: palette[6] },
      { x: 7, y: 21, color: palette[2] },
      { x: 14, y: 14, color: palette[4] },
    ];
    return (
      <svg className={["af-bead-mark", className].filter(Boolean).join(" ")} style={style} viewBox="0 0 28 28" role={isDecorative ? undefined : "img"} aria-label={isDecorative ? undefined : label} aria-hidden={isDecorative}>
        {beads.map((bead, index) => <Bead key={index} {...bead} radius={5.1} />)}
      </svg>
    );
  }

  return (
    <svg className={["af-bead-mark", className].filter(Boolean).join(" ")} style={style} viewBox="0 0 100 100" role={isDecorative ? undefined : "img"} aria-label={isDecorative ? undefined : label} aria-hidden={isDecorative}>
      {ring.map((bead, index) => <Bead key={index} {...bead} radius={6.4} />)}
      {variant === "full" && <Bead x={52} y={48} color={palette[0]} radius={10} />}
    </svg>
  );
}
