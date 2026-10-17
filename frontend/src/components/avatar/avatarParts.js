/**
 * Rider avatar parts. Keys must match AVATAR_OPTIONS in backend/src/services/community.js,
 * which rejects anything else.
 */
export const SKIN = [
  '#FCE3D2', '#F6D0B1', '#EDBB94', '#DFA57A', '#C98D62',
  '#AE7247', '#935E3A', '#784A2D', '#5D3722', '#432719',
];

export const HAIR_COLORS = {
  black: '#1c1717',
  espresso: '#3b2519',
  brown: '#6b4428',
  auburn: '#8e3b1e',
  ginger: '#cf6a2c',
  honey: '#b98a4c',
  blonde: '#e6c67e',
  platinum: '#f2e8cf',
  silver: '#b9bec8',
  pink: '#f472b6',
  blue: '#60a5fa',
  teal: '#2dd4bf',
  purple: '#a78bfa',
};

export const COLORS = {
  snow: '#eef2f7',
  ice: '#7dd3fc',
  sky: '#3b82f6',
  navy: '#1e3a8a',
  teal: '#14b8a6',
  mint: '#34d399',
  lime: '#a3e635',
  forest: '#15803d',
  sun: '#facc15',
  orange: '#f97316',
  red: '#ef4444',
  coral: '#fb7185',
  pink: '#f472b6',
  violet: '#8b5cf6',
  lilac: '#c4b5fd',
  sand: '#d6c3a0',
  charcoal: '#475569',
  night: '#1e293b',
};

/** Goggle and sunglass lenses: [light, deep] for the mirrored gradient. */
export const LENSES = {
  gold: ['#fef3c7', '#d97706'],
  fire: ['#fde68a', '#dc2626'],
  rose: ['#fce7f3', '#db2777'],
  violet: ['#ede9fe', '#6d28d9'],
  blue: ['#bfdbfe', '#1d4ed8'],
  emerald: ['#d1fae5', '#047857'],
  smoke: ['#e2e8f0', '#334155'],
  chrome: ['#ffffff', '#8492a6'],
};

/** Sky behind the rider: [top, bottom]. */
export const BACKDROPS = {
  bluebird: ['#7dd3fc', '#1d4ed8'],
  dawn: ['#fbcfe8', '#7c3aed'],
  alpenglow: ['#fdba74', '#be123c'],
  gold: ['#fde68a', '#d97706'],
  glacier: ['#cffafe', '#0e7490'],
  night: ['#334155', '#020617'],
  aurora: ['#0f3d4a', '#0b1026'],
  storm: ['#cbd5e1', '#475569'],
};

/** Hair styles whose length the length picker changes. */
export const LENGTH_STYLES = new Set(['straight', 'wavy', 'curly', 'afro', 'braids', 'ponytail', 'pigtails']);
/** Headwear that leaves the top of the hair visible. */
export const OPEN_HEADWEAR = new Set(['none', 'headband']);

const keys = (obj) => Object.keys(obj);

/**
 * The creator, tab by tab. `view` is the crop each option tile renders,
 * `preview` adjusts the tile so the option is visible (e.g. hats off for hair).
 */
export const AVATAR_TABS = [
  {
    key: 'face',
    label: 'Face',
    fields: [
      { key: 'skin', label: 'Skin tone', type: 'swatch', palette: 'skin', options: SKIN.map((_, i) => i) },
      {
        key: 'expression',
        label: 'Expression',
        type: 'tile',
        view: 'face',
        preview: { eyewear: 'none' },
        options: [['smile', 'Smile'], ['grin', 'Grin'], ['stoked', 'Stoked'], ['wink', 'Wink'], ['cheeky', 'Cheeky']],
      },
      {
        key: 'marks',
        label: 'Details',
        type: 'tile',
        view: 'face',
        preview: { eyewear: 'none' },
        options: [['none', 'Clean'], ['rosy', 'Rosy'], ['freckles', 'Freckles']],
      },
      {
        key: 'facialHair',
        label: 'Facial hair',
        type: 'tile',
        view: 'face',
        preview: { eyewear: 'none' },
        options: [['none', 'None'], ['stubble', 'Stubble'], ['moustache', 'Tache'], ['beard', 'Beard']],
      },
    ],
  },
  {
    key: 'hair',
    label: 'Hair',
    fields: [
      {
        key: 'hair',
        label: 'Style',
        type: 'tile',
        view: 'hair',
        preview: { headwear: 'none', eyewear: 'none' },
        options: [
          ['buzz', 'Buzz'], ['crop', 'Crop'], ['sweep', 'Swept'], ['straight', 'Straight'], ['wavy', 'Wavy'],
          ['curly', 'Curly'], ['afro', 'Afro'], ['braids', 'Braids'], ['ponytail', 'Ponytail'],
          ['pigtails', 'Pigtails'], ['bun', 'Top knot'], ['mohawk', 'Mohawk'], ['bald', 'Bald'],
        ],
      },
      {
        key: 'hairLength',
        label: 'Length',
        type: 'tile',
        view: 'hair',
        preview: { headwear: 'none', eyewear: 'none' },
        options: [['short', 'Short'], ['medium', 'Medium'], ['long', 'Long']],
        disabledWhen: (a) => !LENGTH_STYLES.has(a.hair),
        disabledNote: 'This style has one length',
      },
      { key: 'hairColor', label: 'Colour', type: 'swatch', palette: 'hair', options: keys(HAIR_COLORS) },
    ],
  },
  {
    key: 'head',
    label: 'Head',
    fields: [
      {
        key: 'headwear',
        label: 'On your head',
        type: 'tile',
        view: 'head',
        options: [
          ['helmet', 'Helmet'], ['beanie', 'Beanie'], ['pom', 'Bobble'], ['critter', 'Bear hat'],
          ['trapper', 'Trapper'], ['cap', 'Cap'], ['headband', 'Ear warmer'], ['none', 'Nothing'],
        ],
      },
      { key: 'hat', label: 'Hat colour', type: 'swatch', palette: 'color', options: keys(COLORS) },
      {
        key: 'eyewear',
        label: 'Eyewear',
        type: 'tile',
        view: 'head',
        options: [['goggles', 'Goggles'], ['goggles-up', 'Goggles up'], ['shades', 'Shades'], ['none', 'None']],
      },
      { key: 'lens', label: 'Lens', type: 'swatch', palette: 'lens', options: keys(LENSES) },
    ],
  },
  {
    key: 'outfit',
    label: 'Outfit',
    fields: [
      {
        key: 'outfit',
        label: 'Jacket',
        type: 'tile',
        view: 'torso',
        options: [['shell', 'Shell'], ['puffer', 'Puffer'], ['anorak', 'Anorak'], ['hoodie', 'Hoodie'], ['retro', 'Retro ’86']],
      },
      {
        key: 'pattern',
        label: 'Pattern',
        type: 'tile',
        view: 'torso',
        options: [['solid', 'Solid'], ['stripe', 'Stripe'], ['two-tone', 'Two-tone'], ['chevron', 'Chevron'], ['camo', 'Camo']],
      },
      { key: 'jacket', label: 'Jacket colour', type: 'swatch', palette: 'color', options: keys(COLORS) },
      { key: 'accent', label: 'Accent & gloves', type: 'swatch', palette: 'color', options: keys(COLORS) },
      { key: 'pants', label: 'Pants', type: 'swatch', palette: 'color', options: keys(COLORS) },
    ],
  },
  {
    key: 'gear',
    label: 'Gear',
    fields: [
      {
        key: 'gear',
        label: 'You ride',
        type: 'tile',
        view: 'full',
        options: [['ski', 'Skier'], ['board', 'Snowboarder']],
      },
      {
        key: 'graphic',
        label: 'Graphic',
        type: 'tile',
        view: 'gear',
        options: [['clean', 'Clean'], ['stripes', 'Stripes'], ['peak', 'Peak'], ['flame', 'Flame'], ['stars', 'Stars']],
      },
      { key: 'gearColor', label: 'Base colour', type: 'swatch', palette: 'color', options: keys(COLORS) },
    ],
  },
  {
    key: 'scene',
    label: 'Scene',
    fields: [
      {
        key: 'backdrop',
        label: 'Backdrop',
        type: 'tile',
        view: 'portrait',
        options: [
          ['bluebird', 'Bluebird'], ['dawn', 'Dawn'], ['alpenglow', 'Alpenglow'], ['gold', 'Golden hour'],
          ['glacier', 'Glacier'], ['night', 'Night'], ['aurora', 'Aurora'], ['storm', 'Storm'],
        ],
      },
    ],
  },
];

export const AVATAR_FIELDS = AVATAR_TABS.flatMap((t) => t.fields);

export const optionKeys = (field) => field.options.map((o) => (Array.isArray(o) ? o[0] : o));

export const DEFAULT_AVATAR = {
  skin: 3,
  expression: 'smile',
  marks: 'none',
  facialHair: 'none',
  hair: 'crop',
  hairLength: 'medium',
  hairColor: 'brown',
  headwear: 'helmet',
  hat: 'red',
  eyewear: 'goggles',
  lens: 'gold',
  outfit: 'shell',
  pattern: 'stripe',
  jacket: 'sky',
  accent: 'snow',
  pants: 'night',
  gear: 'ski',
  graphic: 'peak',
  gearColor: 'orange',
  backdrop: 'bluebird',
};

const LEGACY_VALUES = { pattern: { block: 'two-tone' } };

/** Fill gaps and drop unknown values, so older or partial configs still draw. */
export function normalizeAvatar(config) {
  if (!config || typeof config !== 'object') return null;
  const out = {};
  for (const field of AVATAR_FIELDS) {
    let v = config[field.key];
    v = LEGACY_VALUES[field.key]?.[v] ?? v;
    out[field.key] = optionKeys(field).includes(v) ? v : DEFAULT_AVATAR[field.key];
  }
  // Older avatars had no accent colour: the hat colour played that part
  if (!('accent' in config) && config.hat in COLORS) out.accent = config.hat;
  return out;
}

const pick = (list, rand) => list[Math.floor(rand() * list.length)];

/** A random rider. `keep` pins fields, e.g. skin tone and skis vs board. */
export function randomAvatar(rand = Math.random, keep = {}) {
  const out = Object.fromEntries(AVATAR_FIELDS.map((f) => [f.key, pick(optionKeys(f), rand)]));
  if (rand() < 0.65) out.facialHair = 'none';
  if (out.accent === out.jacket) out.accent = out.jacket === 'snow' ? 'night' : 'snow';
  return { ...out, ...keep };
}

/** Preset looks. They change the outfit and kit, never your face or hair. */
export const LOOKS = [
  {
    key: 'racer',
    label: 'Racer',
    set: {
      outfit: 'shell', pattern: 'chevron', jacket: 'red', accent: 'snow', pants: 'night', headwear: 'helmet',
      hat: 'snow', eyewear: 'goggles', lens: 'chrome', graphic: 'stripes', gearColor: 'red',
    },
  },
  {
    key: 'park',
    label: 'Park rat',
    set: {
      outfit: 'hoodie', pattern: 'camo', jacket: 'forest', accent: 'sand', pants: 'sand', headwear: 'beanie',
      hat: 'orange', eyewear: 'shades', lens: 'fire', graphic: 'flame', gearColor: 'night',
    },
  },
  {
    key: 'retro',
    label: 'Retro ’86',
    set: {
      outfit: 'retro', pattern: 'solid', jacket: 'violet', accent: 'sun', pants: 'pink', headwear: 'headband',
      hat: 'pink', eyewear: 'shades', lens: 'blue', graphic: 'stripes', gearColor: 'sun', backdrop: 'dawn',
    },
  },
  {
    key: 'freeride',
    label: 'Freerider',
    set: {
      outfit: 'anorak', pattern: 'two-tone', jacket: 'orange', accent: 'navy', pants: 'charcoal', headwear: 'helmet',
      hat: 'night', eyewear: 'goggles', lens: 'fire', graphic: 'peak', gearColor: 'snow', backdrop: 'bluebird',
    },
  },
  {
    key: 'apres',
    label: 'Après',
    set: {
      outfit: 'puffer', pattern: 'solid', jacket: 'snow', accent: 'red', pants: 'red', headwear: 'trapper',
      hat: 'red', eyewear: 'goggles-up', lens: 'gold', graphic: 'stars', gearColor: 'navy', backdrop: 'alpenglow',
    },
  },
  {
    key: 'bear',
    label: 'Bear mode',
    set: {
      outfit: 'puffer', pattern: 'two-tone', jacket: 'sand', accent: 'charcoal', pants: 'charcoal', headwear: 'critter',
      hat: 'sand', eyewear: 'none', graphic: 'peak', gearColor: 'forest', backdrop: 'storm',
    },
  },
];

/** Rider "vibe" tags — keys must match RIDER_TAGS in the backend. */
export const RIDER_TAGS = {
  'first-chair': 'First chair',
  'powder-hound': 'Powder hound',
  'park-rat': 'Park rat',
  'tree-runs': 'Tree runs',
  groomers: 'Groomer cruiser',
  steeps: 'Steeps',
  bumps: 'Bumps',
  touring: 'Touring',
  apres: 'Après legend',
  photos: 'Photo stops',
  'chill-pace': 'Chill pace',
  'send-it': 'Send it',
};
export const MAX_TAGS = 3;
