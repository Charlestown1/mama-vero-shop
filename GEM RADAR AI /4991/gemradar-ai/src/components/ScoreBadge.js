export default function ScoreBadge({ label, score, max = 100 }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 75 ? "text-signal-green" : pct >= 45 ? "text-gold-500" : "text-signal-red";

  return (
    <div className="flex flex-col items-center">
      <span className={`font-display text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
    </div>
  );
}
