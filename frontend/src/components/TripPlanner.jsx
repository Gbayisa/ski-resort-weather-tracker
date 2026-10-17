import { Car, Route, Trophy, Sun, Mountain, Snowflake, Check, Crown } from 'lucide-react';
import { addDaysISO, DAY_PICKER_DAYS, weekendDates } from '../utils/dates.js';
import { dayLabel, formatDate, formatRange, scoreTone } from '../utils/format.js';

export const TRIPS = [
  { key: 'day', label: 'Day' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'week', label: 'Week' },
];

export const DRIVES = [
  { key: 'short', title: 'Short drive', sub: 'Up to 1h 30', icon: Car },
  { key: 'happy', title: 'Happy to drive for better', sub: 'Up to 2h 30', icon: Route },
  { key: 'best', title: 'I want the best', sub: 'Up to 4h', icon: Trophy },
];

export const STYLES = [
  { key: 'groomer', title: 'Groomer Day', sub: 'Corduroy, sunshine & calm', icon: Sun },
  { key: 'allmountain', title: 'All Mountain', sub: 'Deep base, the whole hill open', icon: Mountain },
  { key: 'powder', title: 'Powder Day', sub: 'Fresh snow overnight', icon: Snowflake },
];

/** Default drive tolerance per trip: longer trips justify longer drives. */
export const DEFAULT_DRIVE = { day: 'short', weekend: 'happy', week: 'best' };

export default function TripPlanner({ trip, onTrip, dayOffset, onDayOffset, drive, onDrive, style, onStyle, outlook, today, dates }) {
  return (
    <div className="planner glass">
      <section className="planner-step planner-when" aria-labelledby="step-when">
        <StepTitle id="step-when" n={1}>
          When are you going?
        </StepTitle>
        <div className="segmented" role="radiogroup" aria-labelledby="step-when">
          {TRIPS.map((t) => (
            <button
              key={t.key}
              role="radio"
              aria-checked={trip === t.key}
              className={trip === t.key ? 'is-active' : ''}
              onClick={() => onTrip(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {trip === 'day' ? (
          <DayChips today={today} dayOffset={dayOffset} onDayOffset={onDayOffset} outlook={outlook} />
        ) : (
          <TripSummary trip={trip} dates={dates} outlook={outlook} />
        )}
      </section>

      <section className="planner-step" aria-labelledby="step-drive">
        <StepTitle id="step-drive" n={2}>
          How far will you drive?
        </StepTitle>
        <OptionGroup options={DRIVES} value={drive} onChange={onDrive} label="Drive time" />
      </section>

      <section className="planner-step" aria-labelledby="step-style">
        <StepTitle id="step-style" n={3}>
          What kind of day?
        </StepTitle>
        <OptionGroup options={STYLES} value={style} onChange={onStyle} label="Ski style" />
      </section>
    </div>
  );
}

function StepTitle({ id, n, children }) {
  return (
    <h3 className="step-title" id={id}>
      <span className="step-num">{n}</span>
      {children}
    </h3>
  );
}

function OptionGroup({ options, value, onChange, label }) {
  return (
    <div className="options" role="radiogroup" aria-label={label}>
      {options.map(({ key, title, sub, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            className={`option ${active ? 'is-active' : ''}`}
            onClick={() => onChange(key)}
          >
            <span className="option-icon">
              <Icon size={20} />
            </span>
            <span className="option-text">
              <strong>{title}</strong>
              <small>{sub}</small>
            </span>
            <span className="option-check" aria-hidden="true">
              {active && <Check size={14} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DayChips({ today, dayOffset, onDayOffset, outlook }) {
  const byDate = new Map((outlook || []).map((o) => [o.date, o]));
  const best = (outlook || []).reduce((a, b) => (b.bestScore > (a?.bestScore ?? 0) ? b : a), null);

  return (
    <div className="day-chips" role="radiogroup" aria-label="Day">
      {Array.from({ length: DAY_PICKER_DAYS }, (_, i) => {
        const date = addDaysISO(today, i);
        const { name, day } = dayLabel(date, today);
        const o = byDate.get(date);
        const tone = o ? scoreTone(o.bestScore).tone : 'none';
        const isBest = best && best.bestScore > 0 && best.date === date;
        return (
          <button
            key={date}
            role="radio"
            aria-checked={dayOffset === i}
            className={`day-chip ${dayOffset === i ? 'is-active' : ''}`}
            onClick={() => onDayOffset(i)}
            aria-label={`${name} ${day}${o ? `, best match ${o.bestScore}` : ''}${isBest ? ', best day' : ''}`}
          >
            {isBest && (
              <span className="day-chip-best">
                <Crown size={10} /> Best
              </span>
            )}
            <span className="day-chip-name">{name}</span>
            <span className="day-chip-day">{day}</span>
            <span className="day-chip-wx">
              {o && o.maxFresh >= 3 ? (
                <>
                  <Snowflake size={12} /> {o.maxFresh}
                </>
              ) : o?.sunny ? (
                <Sun size={12} />
              ) : (
                <span className="dim">·</span>
              )}
            </span>
            <span className={`day-chip-bar tone-${tone}`} style={{ '--w': `${o ? Math.max(8, o.bestScore) : 0}%` }} />
          </button>
        );
      })}
    </div>
  );
}

function TripSummary({ trip, dates, outlook }) {
  const byDate = new Map((outlook || []).map((o) => [o.date, o]));
  const title = trip === 'weekend' ? weekendDates().label : 'Next 7 days';
  return (
    <div className="trip-summary">
      <div>
        <strong>{title}</strong>
        <span>{formatRange(dates)}</span>
      </div>
      <div className="trip-summary-days">
        {dates.map((d) => {
          const o = byDate.get(d);
          return (
            <span key={d} className={`mini-day tone-${o ? scoreTone(o.bestScore).tone : 'none'}`}>
              {formatDate(d, { weekday: 'narrow' })}
              {o && o.maxFresh >= 3 ? <Snowflake size={10} /> : o?.sunny ? <Sun size={10} /> : null}
            </span>
          );
        })}
      </div>
      {trip === 'week' && <p className="hint">Forecast confidence drops after day 4 — we weigh the week as a whole.</p>}
    </div>
  );
}
