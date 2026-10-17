import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RiderAvatar, { VIEWS } from '../components/avatar/RiderAvatar.jsx';
import {
  AVATAR_FIELDS,
  BACKDROPS,
  COLORS,
  DEFAULT_AVATAR,
  HAIR_COLORS,
  LENGTH_STYLES,
  LENSES,
  LOOKS,
  MAX_TAGS,
  RIDER_TAGS,
  SKIN,
  normalizeAvatar,
  optionKeys,
  randomAvatar,
} from '../components/avatar/avatarParts.js';

const field = (key) => AVATAR_FIELDS.find((f) => f.key === key);
const draw = (config, view = 'full') => renderToStaticMarkup(createElement(RiderAvatar, { config, view, size: 100 }));

describe('avatar parts', () => {
  it('random avatars only use known parts', () => {
    for (let i = 0; i < 50; i++) {
      const a = randomAvatar();
      for (const f of AVATAR_FIELDS) expect(optionKeys(f)).toContain(a[f.key]);
    }
  });

  it('random avatars keep pinned parts', () => {
    const a = randomAvatar(Math.random, { skin: 8, gear: 'board' });
    expect(a).toMatchObject({ skin: 8, gear: 'board' });
  });

  it('every swatch has a colour to paint', () => {
    const palettes = { skin: SKIN, hair: HAIR_COLORS, lens: LENSES, color: COLORS };
    for (const f of AVATAR_FIELDS.filter((x) => x.type === 'swatch')) {
      for (const v of optionKeys(f)) expect(palettes[f.palette][v]).toBeDefined();
    }
    for (const v of optionKeys(field('backdrop'))) expect(BACKDROPS[v]).toBeDefined();
  });

  it('preset looks only use known parts and never touch face or hair', () => {
    for (const look of LOOKS) {
      for (const [key, value] of Object.entries(look.set)) {
        expect(optionKeys(field(key))).toContain(value);
        expect(['skin', 'hair', 'hairColor', 'hairLength', 'expression', 'facialHair', 'marks']).not.toContain(key);
      }
    }
  });

  it('normalises older and partial configs', () => {
    expect(normalizeAvatar(null)).toBeNull();
    const legacy = normalizeAvatar({ backdrop: 'dawn', skin: 2, headwear: 'beanie', hat: 'sun', lens: 'rose', jacket: 'night', pattern: 'block' });
    expect(legacy).toMatchObject({ backdrop: 'dawn', pattern: 'two-tone', accent: 'sun', hair: DEFAULT_AVATAR.hair });
    expect(normalizeAvatar({ hair: 'dreadful', skin: 99 })).toMatchObject({ hair: DEFAULT_AVATAR.hair, skin: DEFAULT_AVATAR.skin });
  });

  it('offers a dozen vibe tags, three per rider', () => {
    expect(Object.keys(RIDER_TAGS)).toHaveLength(12);
    expect(MAX_TAGS).toBe(3);
  });
});

describe('rider artwork', () => {
  it('draws every option of every part in every view', () => {
    for (const f of AVATAR_FIELDS) {
      for (const v of optionKeys(f)) {
        for (const view of Object.keys(VIEWS)) {
          expect(draw({ ...DEFAULT_AVATAR, headwear: 'none', [f.key]: v }, view)).toContain('<svg');
        }
      }
    }
  });

  it('each hair style looks different, and length only changes the styles that have one', () => {
    const bare = { ...DEFAULT_AVATAR, headwear: 'none', eyewear: 'none' };
    const styles = optionKeys(field('hair'));
    const looks = new Set(styles.map((hair) => draw({ ...bare, hair })));
    expect(looks.size).toBe(styles.length);
    for (const hair of styles) {
      const lengths = new Set(['short', 'medium', 'long'].map((hairLength) => draw({ ...bare, hair, hairLength })));
      expect(lengths.size).toBe(LENGTH_STYLES.has(hair) ? 3 : 1);
    }
  });

  it('skiers carry skis and poles, snowboarders a board', () => {
    const ski = draw({ ...DEFAULT_AVATAR, gear: 'ski' });
    const board = draw({ ...DEFAULT_AVATAR, gear: 'board' });
    expect(ski).not.toEqual(board);
    expect(board).toContain('rx="14"');
  });

  it('falls back to the emoji without a config', () => {
    expect(renderToStaticMarkup(createElement(RiderAvatar, { config: null, fallback: '🦊' }))).toContain('🦊');
  });
});
