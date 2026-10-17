import { useState } from 'react';
import { Dices, HardHat, MountainSnow, Scissors, Shirt, Smile, Sparkles, Sunrise } from 'lucide-react';
import RiderAvatar from './RiderAvatar.jsx';
import { lighten } from './geometry.js';
import {
  AVATAR_TABS,
  COLORS,
  HAIR_COLORS,
  LENSES,
  LOOKS,
  OPEN_HEADWEAR,
  SKIN,
  normalizeAvatar,
  randomAvatar,
} from './avatarParts.js';

const TAB_ICONS = { face: Smile, hair: Scissors, head: HardHat, outfit: Shirt, gear: MountainSnow, scene: Sunrise };
const TILE_SIZE = { full: 54, gear: 24, portrait: 58 };
const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function swatchStyle(palette, value) {
  switch (palette) {
    case 'skin':
      return { background: SKIN[value] };
    case 'hair':
      return { background: `radial-gradient(circle at 35% 30%, ${lighten(HAIR_COLORS[value], 0.4)}, ${HAIR_COLORS[value]} 62%)` };
    case 'lens':
      return { background: `linear-gradient(135deg, ${LENSES[value][0]}, ${LENSES[value][1]})` };
    default:
      return { background: COLORS[value] };
  }
}

function Field({ field, avatar, onPick }) {
  const disabled = field.disabledWhen?.(avatar);
  const labelId = `avatar-field-${field.key}`;
  return (
    <div className={`avatar-field ${disabled ? 'is-disabled' : ''}`}>
      <span className="swatch-label" id={labelId}>
        {field.label}
        {disabled && <small> · {field.disabledNote}</small>}
      </span>
      {field.type === 'swatch' ? (
        <div className="swatches" role="radiogroup" aria-labelledby={labelId}>
          {field.options.map((opt) => {
            const active = avatar[field.key] === opt;
            return (
              <button
                type="button"
                key={opt}
                role="radio"
                aria-checked={active}
                aria-label={field.palette === 'skin' ? `Skin tone ${opt + 1}` : capitalise(opt)}
                className={`swatch ${active ? 'is-active' : ''}`}
                style={swatchStyle(field.palette, opt)}
                onClick={() => onPick(opt)}
              />
            );
          })}
        </div>
      ) : (
        <div className={`tiles tiles-${field.view}`} role="radiogroup" aria-labelledby={labelId}>
          {field.options.map(([key, label]) => {
            const active = avatar[field.key] === key;
            return (
              <button
                type="button"
                key={key}
                role="radio"
                aria-checked={active}
                disabled={disabled}
                className={`tile ${active ? 'is-active' : ''}`}
                onClick={() => onPick(key)}
              >
                <RiderAvatar
                  config={{ ...avatar, ...field.preview, [field.key]: key }}
                  view={field.view}
                  size={TILE_SIZE[field.view] ?? 60}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Character creator: live rider on a stage, preset looks, and a tab per body area. */
export default function AvatarBuilder({ value, onChange }) {
  const avatar = normalizeAvatar(value) ?? randomAvatar();
  const [tab, setTab] = useState('face');
  const [pop, setPop] = useState(0);
  const update = (patch) => {
    onChange({ ...avatar, ...patch });
    setPop((n) => n + 1);
  };

  const fields = AVATAR_TABS.find((t) => t.key === tab).fields;
  // Hats come off while styling hair, like a barber's chair
  const hatOff = tab === 'hair' && !OPEN_HEADWEAR.has(avatar.headwear);
  const staged = hatOff
    ? { ...avatar, headwear: 'none', eyewear: avatar.eyewear === 'goggles' ? 'none' : avatar.eyewear }
    : avatar;

  return (
    <div className="avatar-builder">
      {/* Stays pinned while the options scroll, so every tap shows on the rider */}
      <div className="avatar-dock">
        <div className="avatar-hero" key={pop}>
          <RiderAvatar config={staged} view="full" size={168} live className="avatar-hero-art" />
          {hatOff && <span className="stage-note">Hat off</span>}
        </div>
        <div className="avatar-dock-side">
          <div className="avatar-tabs" role="tablist" aria-label="Customise your rider">
            {AVATAR_TABS.map((t) => {
              const Icon = TAB_ICONS[t.key];
              return (
                <button
                  type="button"
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  className={`avatar-tab ${tab === t.key ? 'is-active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  <Icon size={18} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-glass stage-dice"
            onClick={() => update(randomAvatar(Math.random, { skin: avatar.skin, gear: avatar.gear }))}
          >
            <Dices size={17} /> Surprise me
          </button>
        </div>
      </div>

      <div className="avatar-panel">
        <div className="looks" role="group" aria-label="Preset looks">
          <span className="looks-label">
            <Sparkles size={14} /> Looks
          </span>
          {LOOKS.map((look) => (
            <button type="button" key={look.key} className="look-chip" onClick={() => update(look.set)}>
              {look.label}
            </button>
          ))}
        </div>

        <div className="avatar-fields" role="tabpanel">
          {fields.map((field) => (
            <Field key={field.key} field={field} avatar={avatar} onPick={(v) => update({ [field.key]: v })} />
          ))}
        </div>
      </div>
    </div>
  );
}
