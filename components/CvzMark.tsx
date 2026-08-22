// Logo officiel CONVERZA : bulle de conversation + « C » vert (tuile verte).
export function CvzMark({ size = 72, id = "cvzg" }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" role="img" aria-label="CONVERZA">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#25D366" />
          <stop offset="1" stopColor="#008069" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="116" height="116" rx="30" fill={`url(#${id})`} />
      <circle cx="60" cy="56" r="40" fill="#fff" />
      <path d="M38 80 L28 100 L56 85 Z" fill="#fff" />
      <path d="M75.6 38.4 A 22 22 0 1 0 75.6 69.6" fill="none" stroke="#008069" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}
