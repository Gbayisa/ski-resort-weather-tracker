import { useId } from 'react';
import { BACKDROPS, COLORS, HAIR_COLORS, LENSES, SKIN, normalizeAvatar } from './avatarParts.js';
import { darken, mix, seeded, starPath } from './geometry.js';
import { HairBack, HairFront } from './hair.jsx';

/** Crops of the 200 × 280 stage: [x, y, width, height]. */
export const VIEWS = {
  full: [0, 0, 200, 280],
  portrait: [40, 18, 120, 120],
  face: [72, 42, 56, 56],
  hair: [36, 12, 128, 128],
  head: [56, 13, 88, 88],
  torso: [44, 88, 112, 112],
  gear: [126, 50, 48, 210],
};

const MIRROR = 'translate(200 0) scale(-1 1)';
const TORSO = 'M86 95 C78 97 71 101 68 108 L68 178 Q100 184 132 178 L132 108 C129 101 122 97 114 95 Z';
const SLEEVE = 'M76 98 C64 99 56 106 54 118 L52 166 L70.5 168 L72 122 C73 112 75 104 76 98 Z';
const CUFF = 'M52.3 159 L70.7 161 L70.4 168.4 L52 166.2 Z';
const HEM = 'M68 170 Q100 176 132 170 L132 178.5 Q100 184.5 68 178.5 Z';
const GLOVE = 'M50 165 Q48 183 58 186.5 Q69 187.5 71.5 176 L70.6 165.5 Z';
const THUMB = 'M69.5 168 Q76.5 170 74 178.5 Q71.5 180.5 69.8 177 Z';
const POCKET = 'M80 146 H120 Q123 146 123 149 V167 H77 V149 Q77 146 80 146 Z';
const PANTS = {
  ski: 'M70 172 H130 L131 240 Q117 242.5 103 240 L100 200 L97 240 Q83 242.5 69 240 Z',
  board: 'M69 172 H131 L136 241 Q120 244 104 241 L100 198 L96 241 Q80 244 64 241 Z',
};
const BOOT = {
  ski: 'M66 234 H97 V249 Q97 255 91 255 H62 Q57.5 255 58.6 250 L63 242 Z',
  board: 'M65 236 H98 V249.5 Q98 255.5 92 255.5 H64.5 Q59 255.5 60 249.5 Z',
};
const SKIS = [
  'M138 74 Q138 57 143.5 55 Q149 57 149 74 V253 Q149 256 146 256 H141 Q138 256 138 253 Z',
  'M151 74 Q151 57 156.5 55 Q162 57 162 74 V253 Q162 256 159 256 H154 Q151 256 151 253 Z',
];
const CAMO = [
  'M70 112 q8 -7 17 -2 t13 6 q-3 8 -14 7 t-16 -11 Z',
  'M104 120 q10 -5 20 1 t8 10 q-8 5 -17 1 t-11 -12 Z',
  'M78 140 q9 -6 18 0 t10 9 q-9 6 -18 2 t-10 -11 Z',
  'M110 150 q8 -4 15 1 t7 9 q-7 4 -14 0 t-8 -10 Z',
  'M55 126 q6 -4 11 2 t3 10 q-6 3 -10 -2 t-4 -10 Z',
  'M133 128 q6 -2 10 4 t1 10 q-5 2 -8 -3 t-3 -11 Z',
  'M86 162 q9 -3 16 2 t6 8 q-8 3 -15 0 t-7 -10 Z',
  'M57 150 q5 -3 9 1 t2 8 q-5 2 -8 -2 t-3 -7 Z',
];
const SUNNY = new Set(['bluebird', 'dawn', 'alpenglow', 'gold', 'glacier']);
const NIGHT = new Set(['night', 'aurora']);
const STARS = (() => {
  const rand = seeded(7);
  return Array.from({ length: 22 }, () => [rand() * 200, rand() * 130, 0.5 + rand() * 0.9]);
})();
const STORM = (() => {
  const rand = seeded(11);
  return Array.from({ length: 34 }, () => [rand() * 200, rand() * 236, 0.7 + rand() * 1.2]);
})();
const SNOWFALL = (() => {
  const rand = seeded(3);
  return Array.from({ length: 16 }, () => ({ x: rand() * 210, r: 0.8 + rand(), dur: 6 + rand() * 5, delay: -rand() * 11 }));
})();

function palette(a) {
  return {
    skin: SKIN[a.skin],
    hair: HAIR_COLORS[a.hairColor],
    hat: COLORS[a.hat],
    jacket: COLORS[a.jacket],
    accent: COLORS[a.accent],
    pants: COLORS[a.pants],
    gear: COLORS[a.gearColor],
    lens: LENSES[a.lens],
    sky: BACKDROPS[a.backdrop],
  };
}

// ---------- scene ----------

function Scene({ a, url, live }) {
  const night = NIGHT.has(a.backdrop);
  return (
    <g>
      <rect width="200" height="280" fill={url('sky')} />
      {night && (
        <g fill="#fff">
          {STARS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} opacity={0.5 + (i % 3) * 0.2} />
          ))}
        </g>
      )}
      {a.backdrop === 'aurora' && (
        <g className="aurora" fill={url('aurora')}>
          <path d="M-10 74 C30 34 66 92 104 56 C140 22 170 66 210 34 L210 52 C170 86 140 44 104 78 C64 114 32 58 -10 96 Z" opacity="0.7" />
          <path d="M-10 46 C40 20 70 60 110 34 C150 10 176 40 210 18 L210 28 C176 52 150 24 110 48 C70 74 40 34 -10 60 Z" opacity="0.4" />
        </g>
      )}
      {a.backdrop === 'night' && <path d="M60 30 A12 12 0 1 0 72 48 A9.5 9.5 0 1 1 60 30 Z" fill="#f8fafc" opacity="0.92" />}
      {SUNNY.has(a.backdrop) && (
        <g fill="#fff">
          <circle cx="60" cy="42" r="24" opacity="0.18" />
          <circle cx="60" cy="42" r="11" opacity="0.92" />
        </g>
      )}
      <path
        d="M0 128 L26 96 L46 110 L74 74 L96 96 L128 66 L156 92 L200 70 V280 H0 Z"
        fill="#fff"
        opacity={night ? 0.09 : 0.2}
      />
      <path
        d="M74 74 L82 84 L77 82.5 L73 86 L69 82 L66 83 Z M128 66 L137 76 L132 74.5 L127.5 78 L123 74 L120 75 Z"
        fill="#fff"
        opacity={night ? 0.3 : 0.6}
      />
      <path d="M0 168 L36 130 L62 150 L100 112 L138 146 L172 124 L200 138 V280 H0 Z" fill="#fff" opacity={night ? 0.14 : 0.28} />
      <path d="M-5 236 C50 228 150 228 205 236 V285 H-5 Z" fill={url('ground')} />
      {a.backdrop === 'storm' && (
        <g fill="#fff">
          {STORM.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} opacity="0.85" />
          ))}
        </g>
      )}
      {live && (
        <g fill="#fff">
          {SNOWFALL.map((f, i) => (
            <circle
              key={i}
              className="flake"
              cx={f.x}
              cy="-6"
              r={f.r}
              opacity="0.85"
              style={{ animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}
            />
          ))}
        </g>
      )}
    </g>
  );
}

// ---------- gear ----------

function GearShapes({ gear }) {
  return gear === 'board' ? (
    <rect x="140" y="82" width="28" height="174" rx="14" />
  ) : (
    SKIS.map((d) => <path key={d} d={d} />)
  );
}

function Graphic({ kind, accent }) {
  switch (kind) {
    case 'clean':
      return (
        <g fill={accent}>
          <rect x="130" y="112" width="40" height="4.5" />
          <rect x="130" y="120" width="40" height="1.6" />
          <rect x="130" y="234" width="40" height="4.5" />
        </g>
      );
    case 'stripes':
      return (
        <g>
          {[0, 1, 2, 3, 4].map((k) => (
            <path
              key={k}
              d={`M130 ${130 + k * 13} L170 ${112 + k * 13} L170 ${119 + k * 13} L130 ${137 + k * 13} Z`}
              fill={k % 2 ? '#fff' : accent}
              opacity={k % 2 ? 0.9 : 1}
            />
          ))}
        </g>
      );
    case 'peak':
      return (
        <g>
          <circle cx="153" cy="170" r="6" fill={accent} />
          <path d="M128 228 L140 204 L146 213 L154 192 L172 228 Z" fill="#fff" opacity="0.94" />
          <path d="M154 192 L172 228 L161 228 L156.5 205 Z" fill="#000" opacity="0.12" />
          <path d="M128 228 H172 V258 H128 Z" fill={accent} opacity="0.85" />
        </g>
      );
    case 'flame':
      return (
        <g>
          <path d="M128 260 L128 214 Q136 226 138 204 Q145 220 148 192 Q153 214 157 198 Q162 222 172 206 L172 260 Z" fill={accent} />
          <path d="M134 260 Q136 236 141 228 Q145 240 149 220 Q154 238 158 230 Q161 246 166 260 Z" fill="#facc15" opacity="0.92" />
        </g>
      );
    case 'stars':
      return (
        <g fill="#fff">
          <path d={starPath(151, 118, 6.5)} fill={accent} />
          <path d={starPath(144, 150, 4)} opacity="0.95" />
          <path d={starPath(157, 176, 5)} opacity="0.95" />
          <path d={starPath(145, 208, 3.5)} fill={accent} />
          <path d={starPath(156, 232, 4.5)} opacity="0.95" />
        </g>
      );
    default:
      return null;
  }
}

function Gear({ a, p, url }) {
  const board = a.gear === 'board';
  return (
    <g>
      <g fill={p.gear} stroke={darken(p.gear, 0.38)} strokeWidth="1.3">
        <GearShapes gear={a.gear} />
      </g>
      <g clipPath={url('gearclip')}>
        <Graphic kind={a.graphic} accent={p.accent} />
      </g>
      {board ? (
        <g>
          <path d="M144.5 96 V242" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
          {[146, 198].map((y) => (
            <g key={y}>
              <rect x="138.5" y={y} width="31" height="10" rx="3.5" fill="#111827" />
              <rect x="142" y={y + 2.5} width="24" height="5" rx="2.5" fill={p.accent} opacity="0.9" />
            </g>
          ))}
        </g>
      ) : (
        <g>
          <path d="M141 68 V250 M154 68 V250" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.2" />
          <g fill="#111827">
            <rect x="137" y="178" width="13" height="8" rx="2.5" />
            <rect x="150" y="178" width="13" height="8" rx="2.5" />
            <rect x="137" y="200" width="13" height="7" rx="2.5" />
            <rect x="150" y="200" width="13" height="7" rx="2.5" />
          </g>
          <g fill={p.accent}>
            <rect x="139" y="180.5" width="9" height="3" rx="1.5" />
            <rect x="152" y="180.5" width="9" height="3" rx="1.5" />
          </g>
        </g>
      )}
    </g>
  );
}

// ---------- body ----------

function Legs({ a, p }) {
  const board = a.gear === 'board';
  const line = darken(p.pants, 0.3);
  const boot = board ? '#2b2622' : darken(p.gear, 0.1);
  return (
    <g>
      <path d={PANTS[a.gear]} fill={p.pants} />
      <path d="M100 200 V184" stroke={line} strokeOpacity="0.6" strokeWidth="1" />
      <path d="M79 184 L77.5 234 M121 184 L122.5 234" stroke="#fff" strokeOpacity="0.1" strokeWidth="5" strokeLinecap="round" />
      {board && <rect x="121" y="198" width="11" height="15" rx="2" fill="none" stroke={line} strokeOpacity="0.55" strokeWidth="1.1" />}
      {[null, MIRROR].map((t) => (
        <g key={t || 'l'} transform={t || undefined}>
          <path d={BOOT[a.gear]} fill={boot} />
          {board ? (
            <path d="M75 240 L89 245 M75 245 L89 240" stroke="#a8a29e" strokeWidth="1.2" strokeLinecap="round" />
          ) : (
            <path d="M66 240.5 H95.5 M64.5 246.5 H96" stroke={p.accent} strokeWidth="1.8" strokeLinecap="round" />
          )}
          <rect x="59" y="252" width="39" height="3.5" rx="1.75" fill="#0f172a" opacity="0.8" />
        </g>
      ))}
    </g>
  );
}

function Pattern({ kind, p }) {
  const { accent, jacket } = p;
  switch (kind) {
    case 'stripe':
      return (
        <g fill={accent}>
          <rect x="40" y="127" width="120" height="9" />
          <rect x="40" y="139" width="120" height="2.5" />
        </g>
      );
    case 'two-tone':
      return <path d="M40 80 H160 V116 Q100 129 40 116 Z" fill={accent} />;
    case 'chevron':
      return <path d="M40 112 L100 140 L160 112 V123 L100 151 L40 123 Z" fill={accent} />;
    case 'camo':
      return CAMO.map((d, i) => <path key={i} d={d} fill={i % 2 ? mix(accent, jacket, 0.35) : darken(jacket, 0.3)} />);
    default:
      return null;
  }
}

function Jacket({ a, p, url }) {
  const j = p.jacket;
  const jd = darken(j, 0.16);
  const line = darken(j, 0.34);
  const zip = <path d="M100 104 V177" stroke={line} strokeWidth="1.2" />;
  const pull = (y) => <rect x="98.6" y={y} width="2.8" height="6" rx="1" fill={p.accent} />;

  return (
    <g>
      <path d={TORSO} fill={j} />
      <path d={SLEEVE} fill={j} />
      <path d={SLEEVE} fill={j} transform={MIRROR} />
      <g clipPath={url('jacketclip')}>
        <Pattern kind={a.pattern} p={p} />
        {a.outfit === 'retro' && (
          <g>
            <path d="M40 140 L160 106 L160 117 L40 151 Z" fill={p.accent} />
            <path d="M40 155 L160 121 L160 127 L40 161 Z" fill="#fff" opacity="0.88" />
          </g>
        )}
        {a.outfit === 'puffer' &&
          [117, 132, 147, 162].map((y) => (
            <g key={y}>
              <path d={`M50 ${y - 7} Q100 ${y - 1} 150 ${y - 7}`} stroke="#fff" strokeOpacity="0.14" strokeWidth="4" fill="none" />
              <path d={`M50 ${y} Q100 ${y + 6} 150 ${y}`} stroke={line} strokeOpacity="0.5" strokeWidth="1.1" fill="none" />
            </g>
          ))}
        <rect x="40" y="90" width="120" height="100" fill={url('vol')} />
      </g>
      <path d="M72 122 L70.6 166 M128 122 L129.4 166" stroke={line} strokeOpacity="0.5" strokeWidth="1" />
      <path d={HEM} fill={jd} />
      <path d={CUFF} fill={jd} />
      <path d={CUFF} fill={jd} transform={MIRROR} />

      {a.outfit === 'shell' && (
        <g>
          <path d="M85 89 Q100 96 115 89 L117.5 102 Q100 110 82.5 102 Z" fill={jd} />
          <path d="M88 93 Q100 99 112 93" stroke={line} strokeOpacity="0.45" fill="none" />
          {zip}
          {pull(104)}
          <path d="M108 122 L121 119" stroke={line} strokeOpacity="0.75" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
      {a.outfit === 'puffer' && (
        <g>
          <path d="M83 90 Q100 99 117 90 Q122.5 98 117.5 106.5 Q100 114.5 82.5 106.5 Q77.5 98 83 90 Z" fill={j} stroke={line} strokeOpacity="0.4" />
          <path d="M86 99 Q100 106 114 99" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" fill="none" />
          {zip}
          {pull(108)}
        </g>
      )}
      {(a.outfit === 'anorak' || a.outfit === 'hoodie') && (
        <g>
          <path d={POCKET} fill={jd} opacity="0.55" stroke={line} strokeOpacity="0.5" />
          <path d="M81 149 L85 167 M119 149 L115 167" stroke={line} strokeOpacity="0.5" />
        </g>
      )}
      {a.outfit === 'anorak' && (
        <g>
          <path d="M88 93 Q100 103 112 93 L114.5 100 Q100 110 85.5 100 Z" fill={jd} />
          <path d="M100 105 V128" stroke={line} strokeWidth="1.2" />
          {pull(122)}
        </g>
      )}
      {a.outfit === 'retro' && <path d="M84 92 L100 106 L116 92 L120 101 L100 113 L80 101 Z" fill={p.accent} />}
    </g>
  );
}

function Hood({ p }) {
  const j = p.jacket;
  return (
    <g>
      <path d="M77 106 C72 88 82 79 100 79 C118 79 128 88 123 106 Q100 115 77 106 Z" fill={darken(j, 0.1)} />
      <path d="M84 102 C82 90 90 85 100 85 C110 85 118 90 116 102 Q100 108 84 102 Z" fill={darken(j, 0.32)} />
    </g>
  );
}

function Drawstrings() {
  return (
    <g>
      <path d="M94.5 103 L93.5 126 M105.5 103 L106.5 126" stroke="#f8fafc" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="93.4" cy="127.6" r="1.6" fill="#f8fafc" />
      <circle cx="106.6" cy="127.6" r="1.6" fill="#f8fafc" />
    </g>
  );
}

function Gloves({ a, p }) {
  const g = p.accent;
  return (
    <g>
      {a.gear === 'ski' && (
        <g>
          <path d="M60.5 176 L57.5 254" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="57.9" cy="245" rx="5.5" ry="1.8" fill="none" stroke="#334155" strokeWidth="1.4" />
          <rect x="57.2" y="160" width="7" height="18" rx="3" fill="#111827" />
        </g>
      )}
      {[null, MIRROR].map((t) => (
        <g key={t || 'l'} transform={t || undefined}>
          <path d={GLOVE} fill={g} />
          <path d={THUMB} fill={darken(g, 0.1)} />
          <path d="M53 170 Q52.5 179 57 182" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

// ---------- head ----------

const MOUTH = '#4a1c22';
const TONGUE = '#f0717f';

function Mouth({ expression, lips }) {
  const stroke = { stroke: lips, strokeWidth: 2.1, strokeLinecap: 'round', fill: 'none' };
  switch (expression) {
    case 'grin':
      return (
        <g>
          <path d="M92.5 78.5 Q100 89 107.5 78.5 Z" fill={MOUTH} />
          <path d="M94 79.2 H106 Q105.5 81.6 100 81.8 Q94.5 81.6 94 79.2 Z" fill="#fff" />
        </g>
      );
    case 'stoked':
      return (
        <g>
          <path d="M92 77.5 H108 Q107.5 88.5 100 88.5 Q92.5 88.5 92 77.5 Z" fill={MOUTH} />
          <path d="M95 85.3 Q100 82.3 105 85.3 Q103 88.4 100 88.4 Q97 88.4 95 85.3 Z" fill={TONGUE} />
          <path d="M93 77.5 H107 V79.4 H93 Z" fill="#fff" />
        </g>
      );
    case 'wink':
      return <path d="M94 80.5 Q101 83.8 107 78.5" {...stroke} />;
    case 'cheeky':
      return (
        <g>
          <path d="M97.6 81.4 Q100 89 102.6 81.4 Z" fill={TONGUE} />
          <path d="M93.5 79.3 Q100 84.5 106.5 79.3" {...stroke} />
        </g>
      );
    default:
      return <path d="M93.5 79.5 Q100 85 106.5 79.5" {...stroke} />;
  }
}

function Eyes({ expression, brow }) {
  const eye = (x) => (
    <g key={x}>
      <ellipse cx={x} cy="68.5" rx="2.7" ry="3.3" fill="#1c1a24" />
      <circle cx={x + 1} cy="67.2" r="1" fill="#fff" />
    </g>
  );
  const arc = (x, d) => <path key={x} d={d} stroke="#1c1a24" strokeWidth="2.1" strokeLinecap="round" fill="none" />;
  const lift = expression === 'stoked' ? -2 : 0;
  return (
    <g>
      <g className="rider-eyes">
        {expression === 'stoked'
          ? [arc(91, 'M87.5 69.6 Q91 65 94.5 69.6'), arc(109, 'M105.5 69.6 Q109 65 112.5 69.6')]
          : [eye(91), expression === 'wink' ? arc(109, 'M105.5 68.4 Q109 71.6 112.5 68.4') : eye(109)]}
      </g>
      <g transform={`translate(0 ${lift})`}>
        <path d="M86.5 61.5 Q91 58.8 95.5 60.6 M104.5 60.6 Q109 58.8 113.5 61.5" stroke={brow} strokeWidth="2.1" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

function Face({ a, p }) {
  const { skin } = p;
  const facialHair = a.hair === 'bald' && a.hairColor === 'black' ? HAIR_COLORS.espresso : p.hair;
  const eyesHidden = a.eyewear === 'goggles' || a.eyewear === 'shades';
  return (
    <g>
      {[78, 122].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="68" rx="4.6" ry="6.6" fill={skin} />
          <ellipse cx={x + (x < 100 ? 0.6 : -0.6)} cy="68" rx="2" ry="3.6" fill={darken(skin, 0.14)} />
        </g>
      ))}
      <ellipse cx="100" cy="66" rx="22" ry="24" fill={skin} />
      <path d="M80 74 Q84 92 100 92 Q116 92 120 74 Q116 86.5 100 87.5 Q84 86.5 80 74 Z" fill="#000" opacity="0.06" />
      <g fill="#fb7185" opacity={a.marks === 'rosy' ? 0.42 : 0.16}>
        <circle cx="86.5" cy="77" r="4.4" />
        <circle cx="113.5" cy="77" r="4.4" />
      </g>
      {a.marks === 'freckles' && (
        <g fill={darken(skin, 0.38)} opacity="0.85">
          {[[84.5, 77], [87.6, 78.8], [85.4, 80.6], [88.6, 76.2], [115.5, 77], [112.4, 78.8], [114.6, 80.6], [111.4, 76.2]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.85" />
          ))}
        </g>
      )}
      {a.facialHair === 'stubble' && (
        <path
          d="M80 72 Q81 90 100 92.5 Q119 90 120 72 Q118 82.5 111 84.5 Q100 87.5 89 84.5 Q82 82.5 80 72 Z M91 77.5 Q100 74.3 109 77.5 L108 79.2 Q100 77 92 79.2 Z"
          fill={facialHair}
          opacity="0.3"
        />
      )}
      {a.facialHair === 'beard' && (
        <path d="M78 66 Q77 96 100 97.5 Q123 96 122 66 Q121 78 114 82 Q108 79 100 80 Q92 79 86 82 Q79 78 78 66 Z" fill={facialHair} />
      )}
      {(a.facialHair === 'moustache' || a.facialHair === 'beard') && (
        <path d="M91.5 78.6 Q95 74.8 100 76.8 Q105 74.8 108.5 78.6 Q104.5 79.6 100 78.4 Q95.5 79.6 91.5 78.6 Z" fill={facialHair} />
      )}
      <path d="M98.4 72.6 Q100 76.4 101.6 72.6" stroke={darken(skin, 0.28)} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <Mouth expression={a.expression} lips={darken(skin, 0.55)} />
      {!eyesHidden && <Eyes expression={a.expression} brow={a.hair === 'bald' ? darken(skin, 0.45) : darken(p.hair, 0.1)} />}
      {a.eyewear === 'shades' && (
        <path d="M86.5 60.5 Q91 57.8 95.5 59.6 M104.5 59.6 Q109 57.8 113.5 60.5" stroke={darken(p.hair, 0.1)} strokeWidth="2.1" strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

function Headwear({ a, p }) {
  const h = p.hat;
  const hd = darken(h, 0.2);
  const rib = (
    <path
      d="M79 49 V58 M84 48.5 V59 M89 48.2 V59.4 M94 48 V59.6 M99 48 V59.7 M104 48 V59.6 M109 48.2 V59.4 M114 48.5 V59 M119 49 V58"
      stroke="#000"
      strokeOpacity="0.14"
      strokeWidth="1.8"
    />
  );
  const beanie = (
    <g>
      <path d="M78 54 C76 33 87 25 100 25 C113 25 124 33 122 54 Z" fill={h} />
      <path d="M85 32 Q86 42 85 50 M100 26 V50 M115 32 Q114 42 115 50" stroke="#000" strokeOpacity="0.08" strokeWidth="1.5" fill="none" />
      <path d="M84 38 C88 31 95 28 102 27.5" stroke="#fff" strokeOpacity="0.3" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <rect x="75" y="47" width="50" height="13" rx="6.5" fill={hd} />
      {rib}
    </g>
  );

  switch (a.headwear) {
    case 'helmet':
      return (
        <g>
          <path d="M73 66 C70 40 84 27 100 27 C116 27 130 40 127 66 L124 72 C122 64 119 58 115 55 C107 50.5 93 50.5 85 55 C81 58 78 64 76 72 Z" fill={h} />
          <path d="M73.5 58 Q71.5 70 76 76 L80 74 Q78.2 66 79.2 58 Z" fill={darken(h, 0.32)} />
          <path d="M126.5 58 Q128.5 70 124 76 L120 74 Q121.8 66 120.8 58 Z" fill={darken(h, 0.32)} />
          <path d="M90 33 L92 40 M100 31 V39 M110 33 L108 40" stroke={darken(h, 0.35)} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M81 45 C86 36 94 32 103 31.5" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M85 55 C93 50.5 107 50.5 115 55" stroke="#000" strokeOpacity="0.22" strokeWidth="1.5" fill="none" />
        </g>
      );
    case 'beanie':
      return beanie;
    case 'pom':
      return (
        <g>
          <g fill={p.accent}>
            <circle cx="100" cy="23" r="8" />
            <circle cx="95" cy="20" r="3.5" />
            <circle cx="105" cy="19.5" r="3.5" />
            <circle cx="100" cy="17" r="3.5" />
          </g>
          {beanie}
        </g>
      );
    case 'critter':
      return (
        <g>
          {[83, 117].map((x) => (
            <g key={x}>
              <circle cx={x} cy="30" r="7.5" fill={h} />
              <circle cx={x} cy="30" r="4" fill={p.accent} />
            </g>
          ))}
          {beanie}
          <g fill={darken(h, 0.55)}>
            <circle cx="93" cy="39" r="1.6" />
            <circle cx="107" cy="39" r="1.6" />
            <ellipse cx="100" cy="42.5" rx="2.4" ry="1.6" />
          </g>
        </g>
      );
    case 'trapper': {
      const fur = '#f3e9d8';
      return (
        <g>
          <path d="M74 52 Q69.5 70 74 88 Q80 92.5 84 86 L83 54 Z" fill={hd} />
          <path d="M126 52 Q130.5 70 126 88 Q120 92.5 116 86 L117 54 Z" fill={hd} />
          <path d="M80.5 56 L81.5 85 M119.5 56 L118.5 85" stroke={fur} strokeWidth="3" strokeLinecap="round" />
          <path d="M78 52 C76 32 87 25 100 25 C113 25 124 32 122 52 Z" fill={h} />
          <path d="M84 37 C88 31 95 28 102 27.5" stroke="#fff" strokeOpacity="0.28" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M75 46 Q100 39.5 125 46 L125 56 Q100 50 75 56 Z" fill={fur} />
          <path d="M77 55.5 Q81 53 85 54.5 Q89 52 93 53.5 Q97 51.5 100 52.5 Q104 51.5 107 53.5 Q111 52 115 54.5 Q119 53 123 55.5" stroke={fur} strokeWidth="2" fill="none" />
        </g>
      );
    }
    case 'cap':
      return (
        <g>
          <path d="M78 57 C77 36 88 29 100 29 C112 29 123 36 122 57 Z" fill={h} />
          <path d="M100 29.5 V54 M89 31.5 Q86 42 86 56 M111 31.5 Q114 42 114 56" stroke="#000" strokeOpacity="0.14" strokeWidth="1.2" fill="none" />
          <circle cx="100" cy="29.8" r="2.2" fill={hd} />
          <circle cx="100" cy="45" r="4.2" fill={p.accent} />
          <path d="M73 57 Q100 49 127 57 Q129 63 121 64 Q100 58.5 79 64 Q71 63 73 57 Z" fill={hd} />
          <path d="M77 58.5 Q100 52 123 58.5" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.4" fill="none" />
        </g>
      );
    case 'headband':
      return (
        <g>
          <path d="M75 47 C88 41 112 41 125 47 L127 62 C127 72 120 76 117 72 L118 58 C110 51 90 51 82 58 L83 72 C80 76 73 72 73 62 Z" fill={h} />
          <path d="M79 47 C90 43 110 43 121 47" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.6" fill="none" />
          <path d="M76 61 Q75.5 67 78 71 M124 61 Q124.5 67 122 71" stroke={hd} strokeWidth="1.4" fill="none" />
        </g>
      );
    default:
      return null;
  }
}

function Goggles({ url, up }) {
  const g = (
    <g>
      <rect x="72" y="61" width="56" height="8" rx="2" fill="#0f172a" />
      <rect x="79.5" y="56.5" width="41" height="21.5" rx="10.5" fill="#0b1220" />
      <rect x="82" y="59" width="36" height="16.5" rx="8.2" fill={url('lens')} />
      <g clipPath={url('lensclip')}>
        <path d="M82 71 L89 65 L94 69 L101 62 L108 68 L113 65 L118 69 V76 H82 Z" fill="#fff" opacity="0.22" />
      </g>
      <path d="M86 61.5 L95 61.5 L89.5 73 L84.5 73 Z" fill="#fff" opacity="0.42" />
      <rect x="79.5" y="56.5" width="41" height="21.5" rx="10.5" fill="none" stroke="#fff" strokeOpacity="0.14" />
    </g>
  );
  return up ? <g transform="translate(100 45) scale(0.86) translate(-100 -67)">{g}</g> : g;
}

function Shades({ url }) {
  const frame = { stroke: '#0b1220', strokeWidth: 1.6 };
  return (
    <g>
      <path d="M78.5 64.5 L84 65 M121.5 64.5 L116 65" {...frame} />
      <path d="M84 63.5 H98 V69 Q98 76 91 76 Q84 76 84 69 Z" fill={url('lens')} {...frame} />
      <path d="M102 63.5 H116 V69 Q116 76 109 76 Q102 76 102 69 Z" fill={url('lens')} {...frame} />
      <path d="M98 65.5 Q100 64 102 65.5" {...frame} fill="none" />
      <path d="M86.5 65.5 L91 65.5 L87.5 72 Z M104.5 65.5 L109 65.5 L105.5 72 Z" fill="#fff" opacity="0.45" />
    </g>
  );
}

function Figure({ a, p, url }) {
  return (
    <g>
      <ellipse cx="100" cy="254.5" rx="54" ry="5.5" fill="#0f172a" opacity="0.2" />
      <Gear a={a} p={p} url={url} />
      <Legs a={a} p={p} />
      <g className="rider-upper">
        <HairBack a={a} hair={p.hair} accent={p.accent} />
        <Jacket a={a} p={p} url={url} />
        {a.outfit === 'hoodie' && <Hood p={p} />}
        <Gloves a={a} p={p} />
        <rect x="92" y="78" width="16" height="23" rx="6" fill={p.skin} />
        <ellipse cx="100" cy="92.5" rx="8" ry="3.6" fill="#000" opacity="0.14" />
        {a.outfit === 'hoodie' && <Drawstrings />}
        <g className="rider-head">
          <Face a={a} p={p} />
          <HairFront a={a} hair={p.hair} skin={p.skin} accent={p.accent} />
          <Headwear a={a} p={p} />
          {(a.eyewear === 'goggles' || a.eyewear === 'goggles-up') && <Goggles url={url} up={a.eyewear === 'goggles-up'} />}
          {a.eyewear === 'shades' && <Shades url={url} />}
        </g>
      </g>
    </g>
  );
}

/**
 * Illustrated rider drawn from an avatar config (see avatarParts.js). `view` crops the
 * 200 × 280 stage: the round "portrait" for lists, "full" for the creator, close-ups for option tiles.
 * Riders without a config (older profiles) fall back to their emoji.
 */
export default function RiderAvatar({ config, fallback = '🎿', size = 48, view = 'portrait', live = false, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const a = normalizeAvatar(config);
  if (!a) {
    return (
      <span className={`avatar-fallback ${className}`} style={{ width: size, height: size, fontSize: size * 0.52 }}>
        {fallback}
      </span>
    );
  }

  const p = palette(a);
  const [vx, vy, vw, vh] = VIEWS[view] ?? VIEWS.portrait;
  const id = (name) => `${name}${uid}`;
  const url = (name) => `url(#${name}${uid})`;
  const night = NIGHT.has(a.backdrop);
  const ground = night ? ['#94a3b8', '#334155'] : a.backdrop === 'storm' ? ['#e2e8f0', '#94a3b8'] : ['#ffffff', '#cbd5e1'];

  return (
    <svg
      className={`rider-avatar view-${view}${live ? ' is-live' : ''} ${className}`}
      width={size}
      height={(size * vh) / vw}
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
        <linearGradient id={id('ground')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ground[0]} />
          <stop offset="1" stopColor={ground[1]} />
        </linearGradient>
        <linearGradient id={id('lens')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.lens[0]} />
          <stop offset="0.55" stopColor={p.lens[1]} />
          <stop offset="1" stopColor={p.lens[0]} />
        </linearGradient>
        <linearGradient id={id('vol')} gradientUnits="userSpaceOnUse" x1="52" y1="0" x2="148" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.32" />
          <stop offset="0.24" stopColor="#000" stopOpacity="0" />
          <stop offset="0.76" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={id('aurora')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.5" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <clipPath id={id('round')}>
          <circle cx="100" cy="78" r="60" />
        </clipPath>
        <clipPath id={id('jacketclip')}>
          <path d={TORSO} />
          <path d={SLEEVE} />
          <path d={SLEEVE} transform={MIRROR} />
        </clipPath>
        <clipPath id={id('gearclip')}>
          <GearShapes gear={a.gear} />
        </clipPath>
        <clipPath id={id('lensclip')}>
          <rect x="82" y="59" width="36" height="16.5" rx="8.2" />
        </clipPath>
      </defs>
      <g clipPath={view === 'portrait' ? url('round') : undefined}>
        <Scene a={a} url={url} live={live} />
        {view === 'gear' ? <Gear a={a} p={p} url={url} /> : <Figure a={a} p={p} url={url} />}
      </g>
    </svg>
  );
}
