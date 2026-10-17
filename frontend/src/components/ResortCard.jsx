import { useState } from 'react';
import {
  Car,
  Users,
  Snowflake,
  Layers,
  Sun,
  Thermometer,
  Check,
  Navigation,
  ChevronDown,
  ExternalLink,
  Sparkles,
  TrainFront,
} from 'lucide-react';
import ScoreRing from './ScoreRing.jsx';
import TerrainBar from './TerrainBar.jsx';
import ResortDetails from './ResortDetails.jsx';
import { buildDirectionsUrl } from '../utils/maps.js';
import { COVER, TAGS, flag, formatDate, formatDuration, formatTemp, scoreTone } from '../utils/format.js';

export default function ResortCard({ resort, origin, trip, featured = false, onMeet, index = 0 }) {
  const [open, setOpen] = useState(false);
  const directionsUrl = buildDirectionsUrl(resort, origin);
  const { snow, weather, drive } = resort;
  const multiDay = trip !== 'day' && resort.days.length > 1;

  return (
    <article
      className={`resort-card glass ${featured ? 'is-featured' : ''}`}
      style={{ '--i': index }}
      aria-label={`${resort.name}, match ${resort.match}`}
    >
      {featured && (
        <div className="featured-eyebrow">
          <Sparkles size={14} /> Top pick for you
        </div>
      )}

      <header className="rc-head">
        <div className="rc-title">
          <h3>{resort.name}</h3>
          <p className="rc-meta">
            <span aria-hidden="true">{flag(resort.country)}</span> {resort.region}
            {resort.season.glacier && <span className="rc-meta-dot">Glacier</span>}
          </p>
        </div>
        <ScoreRing score={resort.match} size={featured ? 88 : 62} />
      </header>

      <div className="rc-pills">
        <a
          className="pill pill-drive"
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={drive.source === 'estimate' ? 'Estimated — routing unavailable' : 'Road network drive time, no traffic'}
          aria-label={`${formatDuration(drive.minutes, drive.source)} drive. Open directions in Google Maps`}
        >
          <Car size={15} /> {formatDuration(drive.minutes, drive.source)}
          <small>{Math.round(drive.km)} km</small>
        </a>
        {resort.ridersToday > 0 && (
          <button className="pill pill-riders" onClick={onMeet}>
            <span className="live-dot" aria-hidden="true" />
            <Users size={15} /> {resort.ridersToday} riding today
          </button>
        )}
        {multiDay && snow.tripSnow >= 2 && (
          <span className="pill pill-snow">
            <Snowflake size={15} /> {snow.tripSnow} cm over the trip
          </span>
        )}
        {resort.confidence !== 'high' && (
          <span className={`pill pill-muted conf-${resort.confidence}`}>{resort.confidence} confidence</span>
        )}
      </div>

      {resort.access && (
        <p className="rc-access">
          <TrainFront size={15} /> {resort.access.note}
        </p>
      )}

      <div className="rc-stats">
        <Stat icon={Snowflake} label="Fresh 24 h" value={`${Math.round(snow.fresh24)} cm`} hot={snow.fresh24 >= 10} />
        <Stat
          icon={Layers}
          label="Snow cover"
          value={snow.cover === 'glacier' ? 'Glacier' : `${snow.depthMid} cm`}
          sub={COVER[snow.cover]}
        />
        <Stat icon={Sun} label="Sunshine" value={`${weather.sunHours} h`} sub="of 8 ski hours" />
        <Stat
          icon={Thermometer}
          label="Mid-mountain"
          value={formatTemp(weather.tempMid)}
          sub={weather.wind != null ? `${weather.wind} km/h wind` : null}
        />
      </div>

      {resort.tags.length > 0 && (
        <div className="tags">
          {resort.tags.map((t) => (
            <span key={t} className={`tag tone-${TAGS[t]?.tone || 'ice'}`}>
              {TAGS[t]?.label || t}
            </span>
          ))}
        </div>
      )}

      {resort.reasons.length > 0 && (
        <ul className="reasons">
          {resort.reasons.map((r) => (
            <li key={r}>
              <Check size={15} strokeWidth={3} /> {r}
            </li>
          ))}
        </ul>
      )}

      {multiDay && <DayStrip days={resort.days} bestDate={resort.bestDate} />}

      {resort.terrain && <TerrainBar terrain={resort.terrain} country={resort.country} />}

      <footer className="rc-actions">
        <a className="btn btn-primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">
          <Navigation size={17} /> {origin?.fromDevice ? 'Navigate' : 'Directions'}
        </a>
        <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Hourly <ChevronDown size={16} className={open ? 'rot-180' : ''} />
        </button>
        {resort.website && (
          <a
            className="icon-btn"
            href={resort.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${resort.name} website`}
          >
            <ExternalLink size={18} />
          </a>
        )}
      </footer>

      {open && <ResortDetails resortId={resort.id} date={resort.bestDate} elevations={resort.elevations} />}
    </article>
  );
}

function Stat({ icon: Icon, label, value, sub, hot }) {
  return (
    <div className={`stat ${hot ? 'is-hot' : ''}`}>
      <span className="stat-label">
        <Icon size={13} /> {label}
      </span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function DayStrip({ days, bestDate }) {
  return (
    <div className="day-strip" role="list" aria-label="Day by day">
      {days.map((d) => (
        <div
          key={d.date}
          role="listitem"
          className={`ds-day ${d.date === bestDate ? 'is-best' : ''} ${d.open ? '' : 'is-closed'}`}
          aria-label={`${formatDate(d.date)}: ${d.open ? `score ${d.score}` : 'closed'}`}
        >
          <span className="ds-name">{formatDate(d.date, { weekday: 'short' })}</span>
          <span className="ds-track">
            <i className={`ds-bar tone-${scoreTone(d.score).tone}`} style={{ '--h': `${d.open ? Math.max(6, d.score) : 0}%` }} />
          </span>
          <span className="ds-wx">
            {!d.open ? (
              'Shut'
            ) : d.fresh24 >= 3 ? (
              <>
                <Snowflake size={11} />
                {Math.round(d.fresh24)}
              </>
            ) : d.sunHours >= 5 ? (
              <Sun size={12} />
            ) : (
              formatTemp(d.tempMid)
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
