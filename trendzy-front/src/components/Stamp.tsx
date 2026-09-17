type StampProps = {
  score: number;
  tone?: "clay" | "olive";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "size-9 text-sm",
  md: "size-11 text-base",
  lg: "size-14 text-lg",
};

/** The inked trend score, printed like a rubber stamp on the board. */
export function Stamp({ score, tone = "clay", size = "md", className = "" }: StampProps) {
  return (
    <span
      aria-label={`Trend score ${score}`}
      className={`stamp grid shrink-0 place-items-center rounded-full font-display font-semibold text-paper ${
        tone === "clay" ? "bg-clay" : "bg-olive"
      } ${sizes[size]} ${className}`}
    >
      {score}
    </span>
  );
}
