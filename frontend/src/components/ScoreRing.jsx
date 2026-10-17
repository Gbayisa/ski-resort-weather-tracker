import { scoreTone } from '../utils/format.js';

/** Circular 0–100 gauge in the style of activity rings. */
export default function ScoreRing({ score, size = 64, label = 'match' }) {
  const stroke = Math.max(5, size / 10);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const { label: word, tone } = scoreTone(score);

  return (
    <div className={`score-ring tone-${tone}`} style={{ width: size, height: size }} role="img" aria-label={`${score} ${label}, ${word}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="score-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="score-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, score)) / 100)}
        />
      </svg>
      <div className="score-ring-text">
        <strong style={{ fontSize: size * 0.3 }}>{score}</strong>
        {size >= 64 && <span>{word}</span>}
      </div>
    </div>
  );
}
