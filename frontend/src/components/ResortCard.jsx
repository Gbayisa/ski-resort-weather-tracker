import { useState } from 'react';

export default function ResortCard({ resort, date }) {
  const [altitude, setAltitude] = useState('mid');

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const elev = resort.elevations || { base: 0, mid: 0, peak: 0 };

  // Get current altitude-specific data from the hourly timeline
  const timeline = resort.hourlyTimeline || [];
  const avgTemp = getAvgTemp(timeline, altitude);
  const latestSnowDepth = getLatestSnowDepth(timeline, altitude);
  const avgFreezingLevel = getAvgFreezingLevel(timeline);
  const avgVisibility = getAvgVisibility(timeline);

  // Today's projected snowfall at mid altitude (all 24h of the forecast date, observed + forecast)
  const daySnowfallMid = resort.daySnowfallMid ?? resort.daySnowfall ?? 0;

  // Fresh snow = sum of last 2 days of actual snowfall at mid altitude (48-hour window)
  const freshSnow = resort.freshSnow ?? 0;

  return (
    <div className="resort-card">
      <div className="resort-card-header">
        <div>
          <div className="resort-name">{resort.name}</div>
          <div className="resort-meta">
            {resort.region && <span>📍 {resort.region}, {resort.country}</span>}
            <span>📅 {formattedDate}</span>
            <span className="resort-elevation-range">
              ⛰️ {elev.base}m – {elev.peak}m
            </span>
          </div>
        </div>
        <div className="resort-badges">
          <span className="resort-distance">📏 {resort.distance} km</span>
          <span className="resort-snowfall-badge">❄️ {freshSnow} cm</span>
        </div>
      </div>

      {/* Altitude Toggle */}
      <div className="altitude-toggle">
        <button
          className={`altitude-btn ${altitude === 'base' ? 'active' : ''}`}
          onClick={() => setAltitude('base')}
        >
          🏠 Base ({elev.base}m)
        </button>
        <button
          className={`altitude-btn ${altitude === 'mid' ? 'active' : ''}`}
          onClick={() => setAltitude('mid')}
        >
          ⛷️ Mid ({elev.mid}m)
        </button>
        <button
          className={`altitude-btn ${altitude === 'peak' ? 'active' : ''}`}
          onClick={() => setAltitude('peak')}
        >
          🏔️ Peak ({elev.peak}m)
        </button>
      </div>

      {/* Summary Stats at selected altitude */}
      <div className="altitude-summary">
        <div className="summary-stat">
          <span className="summary-label">🌡️ Avg Temp</span>
          <span className="summary-value">{avgTemp !== null ? `${avgTemp}°C` : '—'}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">❄️ Snow Depth</span>
          <span className="summary-value">{latestSnowDepth !== null ? `${latestSnowDepth} cm` : '—'}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">🧊 Freezing Level</span>
          <span className="summary-value">{avgFreezingLevel !== null ? `${avgFreezingLevel}m` : '—'}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">👁️ Visibility</span>
          <span className="summary-value">{avgVisibility !== null ? `${avgVisibility} km` : '—'}</span>
        </div>
      </div>

      {/* Hourly Timeline */}
      {timeline.length > 0 && (
        <div className="hourly-timeline-section">
          <div className="timeline-title">📊 24-Hour Forecast</div>
          <div className="hourly-timeline">
            {timeline.map((entry) => (
              <HourlyEntry key={entry.hour} entry={entry} altitude={altitude} />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {resort.history && resort.history.length > 0 && (
        <div className="history-section">
          <div className="history-title">❄️ Snowfall — Recent Days</div>
          <div className="history-days">
            {resort.history.map((day) => (
              <div key={day.date} className="history-day">
                <div className="history-day-date">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {day.isForecast && <span className="forecast-label"> (forecast)</span>}
                </div>
                <div className="history-day-value">{day.snowfallMid ?? day.snowfall} cm</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resort.website && (
        <a
          href={resort.website}
          target="_blank"
          rel="noopener noreferrer"
          className="resort-link"
        >
          🌐 Visit Resort Website →
        </a>
      )}
    </div>
  );
}

function HourlyEntry({ entry, altitude }) {
  const temp = entry.temperature?.[altitude] ?? null;
  const snowDepth = entry.snowDepth?.[altitude] ?? null;

  // Support both object (altitude-specific) and legacy scalar snowfall values
  const snowfallAtAlt =
    entry.snowfall && typeof entry.snowfall === 'object'
      ? (entry.snowfall[altitude] ?? 0)
      : (entry.snowfall ?? 0);

  const isSnowing = snowfallAtAlt > 0;
  const isRaining = entry.precipitation > 0 && !isSnowing;

  const skyIcon = entry.skyCondition === 'sunny'
    ? '☀️'
    : entry.skyCondition === 'partly cloudy'
    ? '⛅'
    : '☁️';

  const precipIcon = isSnowing ? '❄️' : isRaining ? '🌧️' : '';
  const precipValue = isSnowing
    ? `${snowfallAtAlt}cm`
    : isRaining
    ? `${entry.precipitation}mm`
    : '';

  // Bar height for snowfall (max ~3cm per hour = 100%)
  const snowBarHeight = Math.min(100, (snowfallAtAlt / 3) * 100);
  const precipBarHeight = Math.min(100, (entry.precipitation / 5) * 100);

  return (
    <div className="hourly-entry">
      <div className="hourly-time">{formatHour(entry.hour)}</div>
      <div className="hourly-sky">{skyIcon}</div>
      <div className="hourly-temp" style={{ color: temp !== null && temp <= 0 ? '#3b82f6' : '#ef4444' }}>
        {temp !== null ? `${temp}°` : '—'}
      </div>
      <div className="hourly-precip-bar">
        {snowfallAtAlt > 0 && (
          <div className="snow-bar" style={{ height: `${snowBarHeight}%` }} title={`Snow: ${snowfallAtAlt}cm`} />
        )}
        {entry.precipitation > 0 && snowfallAtAlt === 0 && (
          <div className="rain-bar" style={{ height: `${precipBarHeight}%` }} title={`Rain: ${entry.precipitation}mm`} />
        )}
      </div>
      <div className="hourly-precip-text">
        {precipIcon} {precipValue}
      </div>
      <div className="hourly-wind">💨 {entry.windSpeed}</div>
      <div className="hourly-visibility">👁️ {entry.visibility}km</div>
    </div>
  );
}

function formatHour(h) {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

function getAvgTemp(timeline, altitude) {
  const temps = timeline
    .map((e) => e.temperature?.[altitude])
    .filter((t) => t !== null && t !== undefined);
  if (temps.length === 0) return null;
  return Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10;
}

function getLatestSnowDepth(timeline, altitude) {
  // Get the most representative snow depth (midday value or last available)
  const middayEntry = timeline.find((e) => e.hour === 12) || timeline[timeline.length - 1];
  if (!middayEntry) return null;
  const depth = middayEntry.snowDepth?.[altitude];
  return depth !== null && depth !== undefined ? depth : null;
}

function getAvgFreezingLevel(timeline) {
  const levels = timeline
    .map((e) => e.freezingLevel)
    .filter((l) => l !== null && l !== undefined);
  if (levels.length === 0) return null;
  return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
}

function getAvgVisibility(timeline) {
  const vals = timeline
    .map((e) => e.visibility)
    .filter((v) => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
