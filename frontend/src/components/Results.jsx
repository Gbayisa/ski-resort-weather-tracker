import { Snowflake, Info, TriangleAlert, CalendarDays, MapPin, Loader2 } from 'lucide-react';
import ResortCard from './ResortCard.jsx';
import AdSlot from './AdSlot.jsx';
import { DRIVES, STYLES } from './TripPlanner.jsx';
import { formatDate } from '../utils/format.js';

function headline(trip, dates) {
  if (trip === 'weekend') return 'Your best weekend';
  if (trip === 'week') return 'Your best ski week';
  return `Best for ${formatDate(dates[0], { weekday: 'long', day: 'numeric', month: 'short' })}`;
}

export default function Results({ state, origin, trip, drive, style, dates, onStyle, onMeet, locationName }) {
  const { data, loading, error } = state;

  if (error && !data) {
    return (
      <EmptyState icon={TriangleAlert} title="We couldn’t load conditions">
        {error}. Check your connection and try again.
      </EmptyState>
    );
  }
  if (!data) return <Skeleton />;

  const driveInfo = DRIVES.find((d) => d.key === drive);
  const styleInfo = STYLES.find((s) => s.key === style);
  const [top, ...rest] = data.results;
  const maxFresh = Math.max(0, ...data.results.map((r) => r.snow.fresh24));
  const range = data.widened ? 'within 4h' : driveInfo.range;

  return (
    <section className={`results ${loading ? 'is-refreshing' : ''}`} aria-live="polite" aria-busy={loading}>
      {data.results.length > 0 && (
        <header className="results-head">
          <h2>{headline(trip, dates)}</h2>
          <p>
            {data.totalMatches} open resort{data.totalMatches === 1 ? '' : 's'} {range} · ranked for{' '}
            <strong>{styleInfo.title}</strong>
          </p>
        </header>
      )}

      {data.pendingForecasts > 0 && (
        <p className="pending">
          <Loader2 size={15} className="spin" /> Checking {data.pendingForecasts} more ski area
          {data.pendingForecasts === 1 ? '' : 's'} nearby — results update automatically
        </p>
      )}

      {data.powderAlert && style !== 'powder' && (
        <button className="banner banner-powder" onClick={() => onStyle('powder')}>
          <Snowflake size={20} />
          <span>
            <strong>Powder alert:</strong> {data.powderAlert.fresh24} cm fresh at {data.powderAlert.name} on{' '}
            {formatDate(data.powderAlert.date, { weekday: 'long' })}
          </span>
          <span className="banner-cta">Switch to Powder Day</span>
        </button>
      )}

      {data.widened && (
        <div className="banner banner-info">
          <Info size={18} />
          <span>Nothing’s open {driveInfo.range} of you yet — here’s the best within 4 hours.</span>
        </div>
      )}

      {style === 'powder' && data.results.length > 0 && maxFresh < 10 && (
        <div className="banner banner-info">
          <Info size={18} />
          <span>
            {maxFresh < 1
              ? 'No fresh snow within reach right now.'
              : `No real powder within reach — ${Math.round(maxFresh)} cm fresh at most.`}{' '}
            These are the best of what’s there;{' '}
            <button className="link" onClick={() => onStyle('allmountain')}>
              try All Mountain
            </button>
            .
          </span>
        </div>
      )}

      {data.notice?.type === 'off-season' && <OffSeason notice={data.notice} locationName={locationName} />}

      {top && <ResortCard featured resort={top} origin={origin} trip={trip} onMeet={onMeet} />}

      {rest.length > 0 && (
        <div className="results-grid">
          {rest.map((r, i) => (
            <ResortCard key={r.id} resort={r} origin={origin} trip={trip} onMeet={onMeet} index={i + 1} />
          ))}
        </div>
      )}
      <AdSlot slot="results" />
    </section>
  );
}

function OffSeason({ notice, locationName }) {
  if (notice.resortsNearby === 0) {
    return (
      <EmptyState icon={MapPin} title="No ski areas we know of within 4 hours">
        Our catalogue doesn’t have any ski areas within a 4-hour drive of {locationName} yet. Try a different
        starting point.
      </EmptyState>
    );
  }
  return (
    <EmptyState icon={CalendarDays} title="The season hasn’t started near you yet">
      {notice.nextOpening && (
        <>
          Resorts within 4 hours typically open around{' '}
          <strong>{formatDate(notice.nextOpening, { day: 'numeric', month: 'long' })}</strong>. Live conditions will
          appear here as they open.
        </>
      )}
      {notice.openElsewhere?.length > 0 && (
        <span className="empty-extra">
          Skiable right now: {notice.openElsewhere.map((r) => `${r.name} (${r.distanceKm} km)`).join(' · ')}
        </span>
      )}
    </EmptyState>
  );
}

function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="empty glass">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <section className="results" aria-busy="true" aria-label="Loading resorts">
      <div className="skeleton skeleton-head" />
      <div className="skeleton skeleton-featured" />
      <div className="results-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </section>
  );
}
