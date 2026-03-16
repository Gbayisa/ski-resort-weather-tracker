export default function ForecastBlock({ title, data }) {
  if (!data) {
    return (
      <div className="forecast-block">
        <div className="forecast-block-title">{title}</div>
        <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No data available</div>
      </div>
    );
  }

  const skyClass = data.skyCondition === 'sunny'
    ? 'sky-sunny'
    : data.skyCondition === 'partly cloudy'
    ? 'sky-partly-cloudy'
    : 'sky-cloudy';

  const visClass = data.visibilityLabel === 'low'
    ? 'vis-low'
    : data.visibilityLabel === 'medium'
    ? 'vis-medium'
    : 'vis-high';

  const skyIcon = data.skyCondition === 'sunny'
    ? '☀️'
    : data.skyCondition === 'partly cloudy'
    ? '⛅'
    : '☁️';

  return (
    <div className="forecast-block">
      <div className="forecast-block-title">{title}</div>
      <div className="forecast-stat">
        <span className="forecast-stat-label">Snowfall</span>
        <span className="forecast-stat-value">❄️ {data.snowfall} cm</span>
      </div>
      <div className="forecast-stat">
        <span className="forecast-stat-label">Wind Speed</span>
        <span className="forecast-stat-value">💨 {data.windSpeed} km/h</span>
      </div>
      <div className="forecast-stat">
        <span className="forecast-stat-label">Visibility</span>
        <span className={`forecast-stat-value ${visClass}`}>
          👁️ {data.visibilityLabel} ({data.visibility} km)
        </span>
      </div>
      <div className="forecast-stat">
        <span className="forecast-stat-label">Sky</span>
        <span className={`forecast-stat-value ${skyClass}`}>
          {skyIcon} {data.skyCondition}
        </span>
      </div>
    </div>
  );
}
