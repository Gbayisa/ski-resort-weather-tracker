import { useState } from 'react';
import { Loader2, ShieldCheck, Trash2, Lock } from 'lucide-react';
import { meetApi } from '../api.js';

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

export default function ProfileView({ me, setMe, navigate, toast }) {
  const existing = me?.rider;
  const [form, setForm] = useState({
    name: existing?.name || '',
    age: existing?.age ? String(existing.age) : '',
    sport: existing?.sport || 'ski',
    gender: existing?.gender || '',
    level: existing?.level || '',
    bio: existing?.bio || '',
    visibility: existing?.visibility || 'everyone',
  });
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
      const data = await meetApi.saveProfile({ ...form, age });
      setMe({ rider: data.rider, checkin: data.checkin });
      toast(existing ? 'Profile saved' : `Welcome, ${data.rider.name}! ${data.rider.avatar}`);
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
        <span className="big-avatar" aria-hidden="true">
          {existing?.avatar || '🎿'}
        </span>
        <div>
          <h1>{existing ? 'Your rider profile' : 'Create your rider profile'}</h1>
          <p className="muted">This is what riders at your resort see. No photos, no surnames.</p>
        </div>
      </header>

      <form className="profile-form glass" onSubmit={save} noValidate>
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
          <Choice options={SPORTS} value={form.sport} onChange={set('sport')} label="I ride" />
        </fieldset>

        <fieldset>
          <legend>Level</legend>
          <Choice options={LEVELS} value={form.level} onChange={set('level')} label="Level" columns={2} />
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
