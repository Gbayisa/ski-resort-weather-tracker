import { useEffect, useState } from 'react';
import {
  Loader2,
  ShieldCheck,
  Trash2,
  Lock,
  Search,
  X,
  Mountain,
  Footprints,
  Flame,
  Map as MapIcon,
  Users,
  MountainSnow,
  House,
} from 'lucide-react';
import { meetApi, searchResorts } from '../api.js';
import RiderAvatar from './avatar/RiderAvatar.jsx';
import AvatarBuilder from './avatar/AvatarBuilder.jsx';
import { MAX_TAGS, RIDER_TAGS, normalizeAvatar, randomAvatar } from './avatar/avatarParts.js';
import { flag } from '../utils/format.js';
import { InstagramIcon } from './InstagramLink.jsx';

const SPORTS = [
  ['ski', '⛷️', 'Ski'],
  ['snowboard', '🏂', 'Snowboard'],
  ['both', '🔁', 'Both'],
];
const GENDERS = [
  ['woman', 'Woman'],
  ['man', 'Man'],
  ['nonbinary', 'Non-binary'],
  ['undisclosed', 'Prefer not to say'],
];
const LEVELS = [
  ['beginner', 'Beginner', 'Learning, easy runs'],
  ['intermediate', 'Intermediate', 'Confident on most pistes'],
  ['advanced', 'Advanced', 'Blacks and some off-piste'],
  ['expert', 'Expert', 'Anything, anywhere'],
];
const gearFor = (sport) => (sport === 'snowboard' ? 'board' : 'ski');
const seasonLabel = (d = new Date()) => {
  const start = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
};
const BADGE_ICONS = {
  'first-tracks': Footprints,
  'five-days': Flame,
  explorer: MapIcon,
  social: Users,
  glacier: MountainSnow,
  local: House,
};

function Choice({ options, value, onChange, label, columns }) {
  return (
    <div className={`choice-grid cols-${columns || options.length}`} role="radiogroup" aria-label={label}>
      {options.map(([key, ...rest]) => (
        <button
          type="button"
          key={key}
          role="radio"
          aria-checked={value === key}
          className={`choice ${value === key ? 'is-active' : ''}`}
          onClick={() => onChange(key)}
        >
          {rest.length === 2 && rest[0].length <= 2 ? (
            <>
              <span className="choice-emoji">{rest[0]}</span>
              <strong>{rest[1]}</strong>
            </>
          ) : (
            <>
              <strong>{rest[0]}</strong>
              {rest[1] && <small>{rest[1]}</small>}
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function TagPicker({ value, onChange }) {
  const toggle = (key) =>
    onChange(value.includes(key) ? value.filter((t) => t !== key) : [...value, key].slice(0, MAX_TAGS));
  return (
    <div className="tag-picker" role="group" aria-label="Your vibe">
      {Object.entries(RIDER_TAGS).map(([key, label]) => {
        const on = value.includes(key);
        return (
          <button
            type="button"
            key={key}
            aria-pressed={on}
            disabled={!on && value.length >= MAX_TAGS}
            className={`vibe-tag ${on ? 'is-active' : ''}`}
            onClick={() => toggle(key)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function HomePicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    const controller = new AbortController();
    const t = setTimeout(() => {
      searchResorts(query, controller.signal)
        .then(setResults)
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  if (value) {
    return (
      <div className="home-pill">
        <Mountain size={16} /> <strong>{value.name}</strong>
        <button type="button" className="icon-btn icon-btn-sm" onClick={() => onChange(null)} aria-label="Remove home mountain">
          <X size={15} />
        </button>
      </div>
    );
  }
  return (
    <div className="home-picker">
      <label className="search-field">
        <Search size={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your favourite ski area"
          aria-label="Search for your home mountain"
        />
      </label>
      {results.length > 0 && (
        <ul className="location-results">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="location-result"
                onClick={() => {
                  onChange({ id: r.id, name: r.name });
                  setQuery('');
                }}
              >
                <Mountain size={17} />
                <span>
                  <strong>{r.name}</strong>
                  <small>
                    {flag(r.country)} {r.region || r.country}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeasonCard({ rider, avatar, season, badges }) {
  const unlocked = badges.filter((b) => b.unlocked).length;
  const level = LEVELS.find(([key]) => key === rider.level)?.[1];
  const sport = SPORTS.find(([key]) => key === rider.sport)?.[2];
  return (
    <section className="season-card glass" aria-labelledby="season-title">
      <div className="season-hero">
        <RiderAvatar config={avatar} view="full" size={104} live className="season-figure" />
        <div className="season-hero-text">
          <span className="season-eyebrow">Season {seasonLabel()}</span>
          <h2 id="season-title">{rider.name}</h2>
          <p className="muted">
            {level} · {sport} · {unlocked}/{badges.length} badges
          </p>
        </div>
      </div>
      <div className="season-stats">
        <div>
          <strong>{season.days}</strong>
          <span>days on snow</span>
        </div>
        <div>
          <strong>{season.resorts}</strong>
          <span>resorts</span>
        </div>
        <div>
          <strong>{season.ridersMet}</strong>
          <span>riders met</span>
        </div>
      </div>
      <ul className="badges">
        {badges.map((b) => {
          const Icon = BADGE_ICONS[b.key] || Mountain;
          return (
            <li key={b.key} className={`badge ${b.unlocked ? 'is-unlocked' : ''}`}>
              <span className="badge-icon">
                <Icon size={20} />
              </span>
              <span className="badge-text">
                <strong>{b.label}</strong>
                <small>{b.description}</small>
                {!b.unlocked && (
                  <span className="badge-progress" aria-label={`${b.current} of ${b.target}`}>
                    <i style={{ width: `${(100 * b.current) / b.target}%` }} />
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ProfileView({ me, setMe, navigate, toast }) {
  const existing = me?.rider;
  const [form, setForm] = useState(() => ({
    name: existing?.name || '',
    age: existing?.age ? String(existing.age) : '',
    sport: existing?.sport || 'ski',
    gender: existing?.gender || '',
    level: existing?.level || '',
    bio: existing?.bio || '',
    visibility: existing?.visibility || 'everyone',
    avatar: normalizeAvatar(existing?.avatarConfig) ?? randomAvatar(Math.random, { gear: gearFor(existing?.sport) }),
    tags: existing?.tags || [],
    home: existing?.home || null,
    instagram: existing?.instagram || '',
    instagramVisibility: existing?.instagramVisibility || 'connections',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const age = Number(form.age);
  const under18 = form.age !== '' && age < 18;
  const ready = form.name.trim().length >= 2 && age >= 18 && age <= 99 && form.gender && form.level;

  const save = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { home, ...fields } = form;
      const data = await meetApi.saveProfile({ ...fields, age, homeResortId: home?.id ?? null });
      setMe({ rider: data.rider, checkin: data.checkin, season: data.season, badges: data.badges });
      toast(existing ? 'Profile saved' : `Welcome, ${data.rider.name}!`);
      if (!existing) navigate('meet');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete your profile, check-ins and chats? This can’t be undone.')) return;
    await meetApi.deleteProfile();
    setMe({ rider: null });
    toast('Your profile and data were deleted');
    navigate('discover');
  };

  return (
    <div className="page profile">
      <header className="page-title">
        <RiderAvatar config={form.avatar} size={76} className="title-avatar" />
        <div>
          <h1>{existing ? 'Your rider profile' : 'Create your rider profile'}</h1>
          <p className="muted">This is what riders at your resort see. No photos, no surnames.</p>
        </div>
      </header>

      {existing && me.season && (
        <SeasonCard rider={existing} avatar={form.avatar} season={me.season} badges={me.badges || []} />
      )}

      <form className="profile-form glass" onSubmit={save} noValidate>
        {/* Not a fieldset: WebKit won't keep the creator's preview sticky inside one */}
        <section aria-labelledby="avatar-legend">
          <h2 className="legend" id="avatar-legend">
            Your avatar
          </h2>
          <AvatarBuilder value={form.avatar} onChange={set('avatar')} />
        </section>

        <div className="field-row">
          <label className="field">
            <span>First name</span>
            <input value={form.name} maxLength={24} onChange={(e) => set('name')(e.target.value)} autoComplete="given-name" />
          </label>
          <label className="field field-age">
            <span>Age</span>
            <input
              value={form.age}
              inputMode="numeric"
              maxLength={2}
              onChange={(e) => set('age')(e.target.value.replace(/\D/g, ''))}
              aria-invalid={under18}
            />
          </label>
        </div>
        {under18 && <p className="form-error">Meet riders is for adults (18+). You can still use everything else.</p>}

        <fieldset>
          <legend>I ride</legend>
          <Choice
            options={SPORTS}
            value={form.sport}
            label="I ride"
            onChange={(sport) =>
              setForm((f) => ({
                ...f,
                sport,
                avatar: sport === 'both' ? f.avatar : { ...f.avatar, gear: gearFor(sport) },
              }))
            }
          />
        </fieldset>

        <fieldset>
          <legend>Level</legend>
          <Choice options={LEVELS} value={form.level} onChange={set('level')} label="Level" columns={2} />
        </fieldset>

        <fieldset>
          <legend>
            Your vibe{' '}
            <small>
              {form.tags.length}/{MAX_TAGS}
            </small>
          </legend>
          <TagPicker value={form.tags} onChange={set('tags')} />
        </fieldset>

        <fieldset>
          <legend>
            Home mountain <small>optional</small>
          </legend>
          <HomePicker value={form.home} onChange={set('home')} />
        </fieldset>

        <fieldset>
          <legend>
            Instagram <small>optional</small>
          </legend>
          <label className="search-field ig-field">
            <InstagramIcon size={17} />
            <span className="ig-at" aria-hidden="true">
              @
            </span>
            <input
              value={form.instagram}
              maxLength={60}
              onChange={(e) => set('instagram')(e.target.value.replace(/^@/, ''))}
              placeholder="yourusername"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Instagram username"
            />
          </label>
          {form.instagram.trim() && (
            <Choice
              options={[
                ['connections', 'Connections only', 'Riders you’ve said yes to'],
                ['everyone', 'Everyone here', 'All riders at your resort'],
              ]}
              value={form.instagramVisibility}
              onChange={set('instagramVisibility')}
              label="Who sees your Instagram"
            />
          )}
        </fieldset>

        <fieldset>
          <legend>Gender</legend>
          <Choice options={GENDERS} value={form.gender} onChange={set('gender')} label="Gender" columns={2} />
        </fieldset>

        {form.gender === 'woman' && (
          <fieldset>
            <legend>Who can see me</legend>
            <Choice
              options={[
                ['everyone', 'Everyone', 'All riders at my resort'],
                ['women', 'Women only', 'Only women at my resort'],
              ]}
              value={form.visibility}
              onChange={set('visibility')}
              label="Who can see me"
            />
          </fieldset>
        )}

        <label className="field">
          <span>
            About you <small>{form.bio.length}/140</small>
          </span>
          <textarea
            rows={2}
            maxLength={140}
            value={form.bio}
            onChange={(e) => set('bio')(e.target.value)}
            placeholder="e.g. First chair, then long lunches. Happy to show the best reds."
          />
        </label>

        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-lg btn-block" disabled={!ready || busy}>
          {busy && <Loader2 size={18} className="spin" />}
          {existing ? 'Save profile' : 'Create profile & find riders'}
        </button>
        <p className="fine-print">
          <Lock size={13} /> Stored only to show riders at the same resort. No email, no phone number.
        </p>
      </form>

      {existing && (
        <section className="glass danger-zone">
          <div>
            <h2>
              <ShieldCheck size={18} /> Your data
            </h2>
            <p className="muted">Delete your profile, check-ins and chats at any time.</p>
          </div>
          <button className="btn btn-danger" onClick={remove}>
            <Trash2 size={16} /> Delete profile
          </button>
        </section>
      )}
    </div>
  );
}
