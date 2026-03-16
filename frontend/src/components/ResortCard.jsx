import ForecastBlock from './ForecastBlock.jsx';

export default function ResortCard({ resort, date }) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="resort-card">
      <div className="resort-card-header">
        <div>
          <div className="resort-name">{resort.name}</div>
          <div className="resort-meta">
            {resort.region && <span>📍 {resort.region}, {resort.country}</span>}
            <span>📅 {formattedDate}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="resort-distance">📏 {resort.distance} km</span>
          <span className="resort-snowfall-badge">❄️ {resort.daySnowfall} cm</span>
        </div>
      </div>

      <div className="forecast-grid">
        <ForecastBlock title="🌅 Morning (6am–12pm)" data={resort.morning} />
        <ForecastBlock title="☀️ Afternoon (12pm–6pm)" data={resort.afternoon} />
      </div>

      {resort.history && resort.history.length > 0 && (
        <div className="history-section">
          <div className="history-title">❄️ Snowfall — Last 3 Days</div>
          <div className="history-days">
            {resort.history.map((day) => (
              <div key={day.date} className="history-day">
                <div className="history-day-date">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="history-day-value">{day.snowfall} cm</div>
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
