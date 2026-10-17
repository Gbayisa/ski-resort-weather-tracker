import { useEffect, useState } from 'react';
import { Sun, CloudSun, Cloud, CloudSnow, CloudRain, Loader2, Wind } from 'lucide-react';
import { getResortDetail } from '../api.js';
import { formatDate, formatHour, formatTemp } from '../utils/format.js';

const ALTITUDES = [
  { key: 'base', label: 'Base' },
  { key: 'mid', label: 'Mid' },
  { key: 'peak', label: 'Peak' },
];

function SkyIcon({ entry, altitude }) {
  const snow = typeof entry.snowfall === 'object' ? entry.snowfall[altitude] : entry.snowfall;
  if (snow > 0.2) return <CloudSnow size={18} />;
  if (entry.precipitation > 0.2) return <CloudRain size={18} />;
  if (entry.skyCondition === 'sunny') return <Sun size={18} />;
  if (entry.skyCondition === 'partly cloudy') return <CloudSun size={18} />;
  return <Cloud size={18} />;
}

/** Hour-by-hour ski-day forecast, loaded on demand. */
export default function ResortDetails({ resortId, date, elevations }) {
  const [altitude, setAltitude] = useState('mid');
  const [state, setState] = useState({ data: null, error: null });

  useEffect(() => {
    let alive = true;
    getResortDetail(resortId, date)
      .then((data) => alive && setState({ data, error: null }))
      .catch((err) => alive && setState({ data: null, error: err.message }));
    return () => {
      alive = false;
    };
  }, [resortId, date]);

  if (state.error) return <p className="details-msg">Couldn’t load the hourly forecast.</p>;
  if (!state.data)
    return (
      <p className="details-msg">
        <Loader2 size={16} className="spin" /> Loading hourly forecast…
      </p>
    );

  const hours = (state.data.hourlyTimeline || []).filter((h) => h.hour >= 8 && h.hour <= 17);
  // Unmapped areas have one known elevation, so base/mid/peak would all read the same
  const singleElevation = !elevations || elevations.base === elevations.peak;

  return (
    <div className="details">
      <div className="details-head">
        <strong>{formatDate(date)}</strong>
        {singleElevation ? (
          <span className="muted">{elevations?.base} m</span>
        ) : (
          <div className="segmented segmented-sm" role="radiogroup" aria-label="Altitude">
            {ALTITUDES.map((a) => (
              <button
                key={a.key}
                role="radio"
                aria-checked={altitude === a.key}
                className={altitude === a.key ? 'is-active' : ''}
                onClick={() => setAltitude(a.key)}
              >
                {a.label} <small>{elevations?.[a.key]} m</small>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="hours" role="list">
        {hours.map((h) => {
          const snow = typeof h.snowfall === 'object' ? h.snowfall[altitude] : h.snowfall;
          return (
            <div className="hour" role="listitem" key={h.hour}>
              <span className="hour-time">{formatHour(h.hour)}</span>
              <SkyIcon entry={h} altitude={altitude} />
              <strong className={`hour-temp ${h.temperature?.[altitude] > 0 ? 'is-warm' : ''}`}>
                {formatTemp(h.temperature?.[altitude])}
              </strong>
              <span className="hour-snow">{snow > 0 ? `${snow} cm` : ''}</span>
              <span className="hour-wind">
                <Wind size={11} /> {Math.round(h.windSpeed)}
              </span>
            </div>
          );
        })}
      </div>
      {state.data.history?.length > 0 && (
        <p className="details-history">
          Recent snow:{' '}
          {state.data.history.map((d) => `${formatDate(d.date, { weekday: 'short' })} ${d.snowfallMid ?? d.snowfall} cm`).join(' · ')}
        </p>
      )}
    </div>
  );
}
