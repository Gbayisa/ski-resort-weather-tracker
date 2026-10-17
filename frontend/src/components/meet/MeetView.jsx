import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  LocateFixed,
  Loader2,
  MapPin,
  MountainSnow,
  Coffee,
  Beer,
  Hand,
  MessageCircle,
  LogOut,
  Lock,
  EyeOff,
  Clock,
  Check,
  X,
  Ellipsis,
  UserPlus,
} from 'lucide-react';
import { meetApi } from '../../api.js';
import { getCurrentPosition } from '../../utils/geo.js';
import ChatSheet from './ChatSheet.jsx';

export const INTENTS = {
  ride: { label: 'Ride together', short: 'Ride', icon: MountainSnow },
  coffee: { label: 'Grab a coffee', short: 'Coffee', icon: Coffee },
  apres: { label: 'Après', short: 'Après', icon: Beer },
};
export const SPORT = { ski: '⛷️ Skier', snowboard: '🏂 Snowboarder', both: '⛷️🏂 Ski & board' };
export const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

const timeOf = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function MeetView({ me, setMe, navigate, toast }) {
  if (me === undefined) {
    return (
      <div className="page-loading">
        <Loader2 className="spin" />
      </div>
    );
  }
  if (!me.rider) return <MeetIntro onStart={() => navigate('profile')} />;
  if (!me.checkin) return <CheckIn me={me} setMe={setMe} toast={toast} />;
  return <OnMountain me={me} setMe={setMe} toast={toast} />;
}

function SafetyList() {
  return (
    <ul className="safety-list">
      <li>
        <Lock size={18} />
        <span>
          <strong>Resort-level only.</strong> Your location is used once to confirm which resort you’re at — never
          stored, never shown.
        </span>
      </li>
      <li>
        <EyeOff size={18} />
        <span>
          <strong>Only riders at your resort see you,</strong> and only while you’re checked in. It ends automatically.
        </span>
      </li>
      <li>
        <ShieldCheck size={18} />
        <span>
          <strong>Chat opens when both say yes.</strong> 18+ only, women-only visibility option, block and report
          everywhere.
        </span>
      </li>
    </ul>
  );
}

function MeetIntro({ onStart }) {
  return (
    <div className="page meet-intro">
      <section className="meet-hero glass">
        <div className="avatar-cluster" aria-hidden="true">
          {['🦊', '🐻', '🦉', '🐧', '🦌'].map((a, i) => (
            <span key={a} style={{ '--i': i }}>
              {a}
            </span>
          ))}
        </div>
        <h1>
          Never ski <span className="grad-text">alone</span>
        </h1>
        <p>
          Solo on the mountain? Check in at your resort and find riders for a few laps, a coffee in the sun or après
          when the lifts close.
        </p>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          <UserPlus size={18} /> Create your rider profile
        </button>
        <small className="muted">Takes 30 seconds · 18+ only</small>
      </section>

      <section className="how-it-works">
        {[
          ['1', 'Make a quick profile', 'Skier or boarder, your level and what you’re up for.'],
          ['2', 'Check in at the resort', 'One tap when you arrive. Riders here can now see you.'],
          ['3', 'Wave & meet up', 'Ride together, coffee or après — chat opens when you both say yes.'],
        ].map(([n, title, text]) => (
          <div className="how-step glass" key={n}>
            <span className="step-num">{n}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <section className="glass safety-card">
        <h2>Safety first</h2>
        <SafetyList />
      </section>
    </div>
  );
}

function IntentToggles({ value, onChange }) {
  return (
    <div className="chip-row" role="group" aria-label="What are you up for?">
      {Object.entries(INTENTS).map(([key, { label, icon: Icon }]) => {
        const on = value.includes(key);
        return (
          <button
            key={key}
            className={`chip ${on ? 'is-active' : ''}`}
            aria-pressed={on}
            onClick={() => {
              const next = on ? value.filter((v) => v !== key) : [...value, key];
              if (next.length) onChange(next);
            }}
          >
            <Icon size={16} /> {label}
          </button>
        );
      })}
    </div>
  );
}

function CheckIn({ me, setMe, toast }) {
  const [intents, setIntents] = useState(['ride']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [devResorts, setDevResorts] = useState(null);
  const [devResortId, setDevResortId] = useState('');

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    meetApi
      .devResorts()
      .then((d) => {
        setDevResorts(d.resorts);
        setDevResortId(String(d.resorts[0]?.id ?? ''));
      })
      .catch(() => {});
  }, []);

  const submit = async (location) => {
    setBusy(true);
    setError(null);
    try {
      const body = location.devResortId ? { devResortId: Number(location.devResortId), intents } : { ...location, intents };
      const { checkin } = await meetApi.checkIn(body);
      setMe({ ...me, checkin });
      toast(`You’re checked in at ${checkin.resort.name}`);
    } catch (err) {
      const nearest = err.body?.nearest;
      setError(nearest ? `${err.message} — the closest is ${nearest.name}, ${nearest.distanceKm} km away.` : err.message);
    } finally {
      setBusy(false);
    }
  };

  const viaGps = async () => {
    setBusy(true);
    setError(null);
    try {
      const pos = await getCurrentPosition({ highAccuracy: true });
      await submit({ lat: pos.latitude, lon: pos.longitude });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <section className="checkin-card glass">
        <span className="big-avatar" aria-hidden="true">
          {me.rider.avatar}
        </span>
        <h1>Hey {me.rider.name}, on the mountain?</h1>
        <p className="muted">Check in and riders at your resort can find you for the next 9 hours.</p>

        <h3 className="label">What are you up for today?</h3>
        <IntentToggles value={intents} onChange={setIntents} />

        <button className="btn btn-primary btn-lg btn-block" onClick={viaGps} disabled={busy}>
          {busy ? <Loader2 size={18} className="spin" /> : <LocateFixed size={18} />} Check in at my resort
        </button>
        {error && <p className="form-error">{error}</p>}
        <p className="fine-print">
          <Lock size={13} /> We use your location once to find your resort. It’s never stored or shown to anyone.
        </p>

        {devResorts && (
          <div className="dev-panel">
            <span className="dev-badge">Dev only</span>
            <p>Not at a resort? Simulate a check-in:</p>
            <div className="dev-row">
              <select value={devResortId} onChange={(e) => setDevResortId(e.target.value)} aria-label="Resort">
                {devResorts.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.inSeason ? '· open' : ''} {r.riders ? `· ${r.riders} rider${r.riders === 1 ? '' : 's'}` : ''}
                  </option>
                ))}
              </select>
              <button className="btn btn-glass" disabled={busy || !devResortId} onClick={() => submit({ devResortId })}>
                Simulate
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="glass safety-card">
        <SafetyList />
      </section>
    </div>
  );
}

function OnMountain({ me, setMe, toast }) {
  const { checkin } = me;
  const [riders, setRiders] = useState(null);
  const [connections, setConnections] = useState([]);
  const [filter, setFilter] = useState('all');
  const [chat, setChat] = useState(null);
  const [note, setNote] = useState(checkin.note || '');
  const noteTimer = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([meetApi.riders(checkin.resort.id), meetApi.connections()]);
      setRiders(r.riders);
      setConnections(c.connections);
    } catch (err) {
      if (err.code === 'not_checked_in') setMe((m) => ({ ...m, checkin: null }));
    }
  }, [checkin.resort.id, setMe]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 12000);
    return () => clearInterval(t);
  }, [refresh]);

  const updateCheckin = async (patch) => {
    try {
      const { checkin: next } = await meetApi.updateCheckin({ intents: checkin.intents, note, ...patch });
      setMe((m) => ({ ...m, checkin: next }));
    } catch (err) {
      toast(err.message);
    }
  };

  const onNote = (value) => {
    setNote(value);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => updateCheckin({ note: value }), 700);
  };

  const wave = async (rider, intent) => {
    try {
      const { connection } = await meetApi.connect(rider.id, intent);
      if (connection.status === 'accepted') {
        toast(`${rider.name} is in — say hi!`);
        setChat(connection);
      } else {
        toast(`Wave sent to ${rider.name} 👋`);
      }
      refresh();
    } catch (err) {
      toast(err.message);
    }
  };

  const respond = async (conn, accept) => {
    try {
      const { connection } = await meetApi.respond(conn.id, accept);
      refresh();
      if (accept) setChat(connection);
    } catch (err) {
      toast(err.message);
    }
  };

  const safetyAction = async (rider, action) => {
    try {
      if (action === 'block') await meetApi.block(rider.id);
      else await meetApi.report(rider.id, action);
      toast(action === 'block' ? `${rider.name} is blocked` : 'Thanks — we’ll review this. They’re blocked for you.');
      setChat(null);
      refresh();
    } catch (err) {
      toast(err.message);
    }
  };

  const checkOut = async () => {
    await meetApi.checkOut();
    setMe((m) => ({ ...m, checkin: null }));
    toast('Checked out — you’re no longer visible');
  };

  const incoming = connections.filter((c) => c.direction === 'incoming' && c.status === 'pending');
  const chats = connections.filter((c) => c.status === 'accepted');
  const shown = (riders || []).filter(
    (r) => filter === 'all' || r.sport === filter || r.sport === 'both'
  );

  return (
    <div className="page meet">
      <section className="meet-status glass">
        <div className="meet-status-head">
          <div>
            <p className="eyebrow">
              <span className="live-dot" /> Checked in
            </p>
            <h1>{checkin.resort.name}</h1>
            <p className="muted">
              <Clock size={14} /> Visible to riders here until {timeOf(checkin.expiresAt)}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={checkOut}>
            <LogOut size={16} /> Check out
          </button>
        </div>
        <IntentToggles value={checkin.intents} onChange={(intents) => updateCheckin({ intents })} />
        <label className="note-field">
          <MapPin size={16} />
          <input
            value={note}
            maxLength={80}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Where to find you (e.g. top of gondola)"
            aria-label="Where to find you"
          />
        </label>
      </section>

      {incoming.length > 0 && (
        <section className="meet-section">
          <h2>Requests</h2>
          {incoming.map((c) => (
            <div className="request glass" key={c.id}>
              <span className="avatar">{c.rider.avatar}</span>
              <span className="request-text">
                <strong>{c.rider.name}</strong> wants to {INTENTS[c.intent].label.toLowerCase()}
              </span>
              <button className="icon-btn icon-btn-ok" onClick={() => respond(c, true)} aria-label="Accept">
                <Check size={18} />
              </button>
              <button className="icon-btn" onClick={() => respond(c, false)} aria-label="Decline">
                <X size={18} />
              </button>
            </div>
          ))}
        </section>
      )}

      {chats.length > 0 && (
        <section className="meet-section">
          <h2>Your chats</h2>
          {chats.map((c) => (
            <button className="chat-row glass" key={c.id} onClick={() => setChat(c)}>
              <span className="avatar">{c.rider.avatar}</span>
              <span className="chat-row-text">
                <strong>{c.rider.name}</strong>
                <small>{c.lastMessage ? `${c.lastMessage.mine ? 'You: ' : ''}${c.lastMessage.body}` : 'Say hi 👋'}</small>
              </span>
              <MessageCircle size={18} />
            </button>
          ))}
        </section>
      )}

      <section className="meet-section">
        <div className="meet-section-head">
          <h2>
            Riders here {riders && <span className="count">{riders.length}</span>}
          </h2>
          <div className="segmented segmented-sm" role="radiogroup" aria-label="Filter">
            {[
              ['all', 'All'],
              ['ski', 'Skiers'],
              ['snowboard', 'Boarders'],
            ].map(([k, l]) => (
              <button key={k} role="radio" aria-checked={filter === k} className={filter === k ? 'is-active' : ''} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {riders === null ? (
          <div className="page-loading">
            <Loader2 className="spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="empty glass">
            <span className="empty-icon">
              <MountainSnow size={26} />
            </span>
            <h3>You’re the first one here</h3>
            <p>Riders who check in at {checkin.resort.name} will show up here. We’ll keep looking.</p>
          </div>
        ) : (
          <div className="rider-grid">
            {shown.map((r, i) => (
              <RiderCard
                key={r.id}
                rider={r}
                index={i}
                connection={connections.find((c) => c.rider?.id === r.id)}
                onWave={wave}
                onRespond={respond}
                onOpenChat={setChat}
                onSafety={safetyAction}
              />
            ))}
          </div>
        )}
      </section>

      {chat && (
        <ChatSheet
          connection={chat}
          onClose={() => {
            setChat(null);
            refresh();
          }}
          onSafety={(action) => safetyAction(chat.rider, action)}
          toast={toast}
        />
      )}
    </div>
  );
}

function RiderCard({ rider, index, connection, onWave, onRespond, onOpenChat, onSafety }) {
  return (
    <article className={`rider-card glass level-${rider.level}`} style={{ '--i': index }}>
      <header>
        <span className="avatar avatar-lg">{rider.avatar}</span>
        <div className="rider-id">
          <h3>
            {rider.name}, {rider.age}
            {rider.isDemo && <span className="demo-badge">Demo</span>}
          </h3>
          <p>
            {SPORT[rider.sport]} · <span className={`level-pill level-${rider.level}`}>{LEVEL[rider.level]}</span>
          </p>
        </div>
        <details className="rider-menu">
          <summary aria-label={`More options for ${rider.name}`}>
            <Ellipsis size={18} />
          </summary>
          <div className="rider-menu-pop glass">
            <button onClick={() => onSafety(rider, 'block')}>Block</button>
            <button onClick={() => onSafety(rider, 'Inappropriate behaviour')}>Report</button>
          </div>
        </details>
      </header>
      {rider.bio && <p className="rider-bio">{rider.bio}</p>}
      {rider.note && (
        <p className="rider-note">
          <MapPin size={14} /> {rider.note}
        </p>
      )}
      <div className="rider-actions">
        {!connection &&
          rider.intents.map((intent) => {
            const { label, icon: Icon } = INTENTS[intent];
            return (
              <button
                key={intent}
                className="btn btn-wave"
                onClick={() => onWave(rider, intent)}
                aria-label={`Wave at ${rider.name}: ${label}`}
              >
                <Icon size={15} /> {label}
              </button>
            );
          })}
        {connection?.status === 'pending' && connection.direction === 'outgoing' && (
          <span className="wave-sent">
            <Hand size={15} /> Wave sent · waiting
          </span>
        )}
        {connection?.status === 'pending' && connection.direction === 'incoming' && (
          <>
            <button className="btn btn-primary" onClick={() => onRespond(connection, true)}>
              <Check size={15} /> Accept
            </button>
            <button className="btn btn-ghost" onClick={() => onRespond(connection, false)}>
              Not now
            </button>
          </>
        )}
        {connection?.status === 'accepted' && (
          <button className="btn btn-primary" onClick={() => onOpenChat(connection)}>
            <MessageCircle size={15} /> Open chat
          </button>
        )}
      </div>
    </article>
  );
}
