import ResortCard from './ResortCard.jsx';

export default function ResultsList({ results, loading, searched, date }) {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>
          Fetching resort forecasts...
        </p>
      </div>
    );
  }

  if (!searched) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎿</div>
        <h3>Find your perfect ski day</h3>
        <p>Enter your location and pick a date to discover resorts with great snow conditions nearby.</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❄️</div>
        <h3>No resorts found</h3>
        <p>No resorts meet your criteria. Try increasing the search radius, lowering the minimum snowfall, or changing the date.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="results-header">
        <h2>Ski Resorts</h2>
        <span className="results-count">{results.length} resort{results.length !== 1 ? 's' : ''} found</span>
      </div>
      {results.map((resort) => (
        <ResortCard key={resort.id} resort={resort} date={date} />
      ))}
    </div>
  );
}
