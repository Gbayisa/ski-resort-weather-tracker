import { OPEN_HEADWEAR } from './avatarParts.js';
import { bezier, darken, lighten, mirrorPoints, mix, smoothPath, strand } from './geometry.js';

/** Where hair ends, in stage units: jaw, shoulders, chest. */
const END = { short: 90, medium: 114, long: 138 };

const CROWN = 'M76 68 C72 46 84 34 100 34 C116 34 128 46 124 68 C122 60 118 54 112 51 C106 48.5 94 48.5 88 51 C82 54 78 60 76 68 Z';
const SLEEK = 'M77 66 C74 46 85 37 100 37 C115 37 126 46 123 66 C121 59 117 54 111 51.5 C105 49.5 95 49.5 89 51.5 C83 54 79 59 77 66 Z';
const BUZZ = 'M78 64 C76 47 86 40 100 40 C114 40 124 47 122 64 C120 58 116 53.5 110.5 51.5 C104.5 49.5 95.5 49.5 89.5 51.5 C84 53.5 80 58 78 64 Z';
const CROP =
  'M76 64 C74 50 79 42 86 39 L88 33 L93 37 L97 30 L101 35 L106 30 L109 36 L114 34 L114 40 C121 44 126 52 124 64 C121 58 117 53 111 50.5 C105 48.5 95 48.5 89 50.5 C83 53 79 58 76 64 Z';
const SWEEP_FRINGE = 'M122 55 C113 45 95 43 85 50 C80 54 78 60 78 67 C84 60 92 57 101 57.5 C109 58 116 57 122 55 Z';
const SIDEBURN = 'M77.6 58 Q76.6 64 78.4 70 L80.6 69 Q79.6 63 80.8 58 Z';
const MOHAWK = 'M93 51 C92 45 90 39 88 31 L94 35 L95 23 L100 32 L104 21 L106 33 L112 28 L108 39 C107 44 107 48 107 51 Z';
const SHINE = 'M86 42.5 C92 37.5 102 36.5 110 38.5';
const PART = 'M100 35 Q99.4 42 100 49.5';

const samples = (from, to) => Math.max(6, Math.round((to - from) / 6));

/** Centre line of the lock that frames the left of the face. */
const lockCentre = (end) => bezier([80.5, 50], [72.5, 62], [73.5, 50 + (end - 50) * 0.7], [79.5, end], samples(50, end));
const lockWidths = (n, scale) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return (3 + 3 * Math.min(1, t / 0.25) - 1.8 * Math.max(0, (t - 0.4) / 0.6)) * scale;
  });
/** Fat in the upper middle, tapering to a point: tails and pigtails. */
const tailWidths = (n, base) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return (base + base * Math.sin(Math.PI * Math.min(1, t * 1.3))) * (1 - 0.45 * t);
  });

function Locks({ end, hair, dark, wave, scale }) {
  const centre = lockCentre(end);
  const widths = lockWidths(centre.length, scale);
  return [centre, mirrorPoints(centre)].map((c, i) => {
    const { outline, mid } = strand(c, widths, wave);
    return (
      <g key={i}>
        <path d={outline} fill={hair} />
        <path d={smoothPath(mid, false)} stroke={dark} strokeOpacity="0.45" strokeWidth="0.9" fill="none" />
      </g>
    );
  });
}

function CurlyLocks({ end, hair, dark }) {
  const centre = lockCentre(end);
  const widths = lockWidths(centre.length, 1.05);
  return [centre, mirrorPoints(centre)].map((c, side) => (
    <g key={side} fill={hair} stroke={dark} strokeOpacity="0.35" strokeWidth="0.8">
      {c.slice(1).map(([x, y], i) => (
        <circle key={i} cx={x + (i % 2 ? 1.8 : -1.8)} cy={y} r={widths[i + 1] + 1.2} />
      ))}
    </g>
  ));
}

function Braids({ end, hair, dark, accent }) {
  const centre = lockCentre(end);
  const braids = [-2.8, 2.8].flatMap((dx) => {
    const c = centre.map(([x, y]) => [x + dx, y]);
    return [c, mirrorPoints(c)];
  });
  return braids.map((c, i) => {
    const [ex, ey] = c[c.length - 1];
    return (
      <g key={i}>
        <g fill={hair} stroke={dark} strokeOpacity="0.5" strokeWidth="0.8">
          {c.slice(1).map(([x, y], j) => (
            <ellipse key={j} cx={x} cy={y} rx="3.1" ry="3.5" />
          ))}
        </g>
        <rect x={ex - 2.4} y={ey + 1.5} width="4.8" height="2.6" rx="1.2" fill={accent} />
        <path d={`M${ex - 2} ${ey + 4} L${ex} ${ey + 9} L${ex + 2} ${ey + 4} Z`} fill={hair} />
      </g>
    );
  });
}

function Pigtails({ end, hair, dark, accent }) {
  const centre = bezier([78, 62], [67, 64], [62.5, 62 + (end - 62) * 0.55], [67, end], samples(62, end));
  const widths = tailWidths(centre.length, 3.6);
  return [centre, mirrorPoints(centre)].map((c, i) => {
    const { outline, mid } = strand(c, widths);
    const [tx, ty] = c[0];
    return (
      <g key={i}>
        <path d={outline} fill={hair} />
        <path d={smoothPath(mid.slice(1), false)} stroke={dark} strokeOpacity="0.4" strokeWidth="0.9" fill="none" />
        <circle cx={tx + (i ? 1 : -1)} cy={ty + 2} r="3.1" fill={accent} />
      </g>
    );
  });
}

function AfroBall({ size, hair, dark }) {
  const R = { short: 28, medium: 33, long: 38 }[size];
  const cy = 58;
  return (
    <g>
      <g fill={hair}>
        <circle cx="100" cy={cy} r={R} />
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return <circle key={i} cx={100 + R * Math.cos(a)} cy={cy + R * Math.sin(a)} r="6.5" />;
        })}
      </g>
      <path
        d={`M${100 - R * 0.6} ${cy - R * 0.4} q3 -3 6 0 M${100 + R * 0.35} ${cy - R * 0.62} q3 -3 6 0 M${100 + R * 0.7} ${cy - R * 0.05} q3 -3 6 0 M${100 - R * 0.85} ${cy + R * 0.2} q3 -3 6 0`}
        stroke={dark}
        strokeOpacity="0.45"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Hair that sits behind the head and body: curtains, afro volume, ponytail. */
export function HairBack({ a, hair, accent }) {
  const end = END[a.hairLength];
  const dark = darken(hair, 0.22);
  const open = OPEN_HEADWEAR.has(a.headwear);

  switch (a.hair) {
    case 'straight':
    case 'wavy':
    case 'braids':
    case 'curly': {
      const bottom = Math.min(end, 112);
      const pts = [[78, 46], [70.5, 66], [69.5, bottom - 6], [76, bottom], [124, bottom], [130.5, bottom - 6], [129.5, 66], [122, 46]];
      return (
        <g fill={dark}>
          <path d={smoothPath(pts)} />
          {a.hair === 'curly' &&
            Array.from({ length: Math.floor((bottom - 58) / 8) }, (_, i) => (
              <g key={i}>
                <circle cx="71" cy={62 + i * 8} r="7" />
                <circle cx="129" cy={62 + i * 8} r="7" />
              </g>
            ))}
        </g>
      );
    }
    case 'afro': {
      if (open) return <AfroBall size={a.hairLength} hair={hair} dark={dark} />;
      const r = { short: 8, medium: 10, long: 12.5 }[a.hairLength];
      return (
        <g fill={hair}>
          <ellipse cx="100" cy="82" rx="27" ry="13" fill={dark} />
          <circle cx="75.5" cy="73" r={r} />
          <circle cx="124.5" cy="73" r={r} />
          <circle cx="79" cy={74 + r} r={r * 0.85} />
          <circle cx="121" cy={74 + r} r={r * 0.85} />
        </g>
      );
    }
    case 'ponytail': {
      const centre = bezier([118, 46], [142, 42], [152, 60 + (end - 60) * 0.45], [146, end + 4], samples(46, end));
      const { outline, mid } = strand(centre, tailWidths(centre.length, 4));
      return (
        <g>
          <path d={outline} fill={hair} />
          <path d={smoothPath(mid.slice(1), false)} stroke={dark} strokeOpacity="0.45" strokeWidth="1" fill="none" />
          <circle cx="120.5" cy="47" r="3.3" fill={accent} />
        </g>
      );
    }
    default:
      return null;
  }
}

/** Hair in front of the face: the crown (when no hat hides it), locks, fringes, pigtails, braids. */
export function HairFront({ a, hair, skin, accent }) {
  const end = END[a.hairLength];
  const dark = darken(hair, 0.22);
  const shine = lighten(hair, 0.35);
  const open = OPEN_HEADWEAR.has(a.headwear);
  const crownShine = <path d={SHINE} stroke={shine} strokeOpacity="0.55" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  const crown = (d, extra = null) =>
    open && (
      <g>
        <path d={d} fill={hair} />
        {extra}
        {crownShine}
      </g>
    );
  const part = <path d={PART} stroke={dark} strokeOpacity="0.6" strokeWidth="0.9" fill="none" />;

  switch (a.hair) {
    case 'buzz':
      return open && <path d={BUZZ} fill={mix(hair, skin, 0.35)} />;
    case 'crop':
      return (
        <g>
          {crown(CROP)}
          <path d={SIDEBURN} fill={hair} />
          <path d={SIDEBURN} fill={hair} transform="translate(200 0) scale(-1 1)" />
        </g>
      );
    case 'sweep':
      return (
        <g>
          {crown(CROWN)}
          <path d={SWEEP_FRINGE} fill={hair} />
          <path d="M118 53 C110 47 97 47 88 52" stroke={shine} strokeOpacity="0.5" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'straight':
    case 'wavy':
      return (
        <g>
          <Locks end={end} hair={hair} dark={dark} wave={a.hair === 'wavy' ? 2.2 : 0} scale={a.hairLength === 'short' ? 1.12 : 1} />
          {crown(CROWN, part)}
        </g>
      );
    case 'curly':
      return (
        <g>
          <CurlyLocks end={end} hair={hair} dark={dark} />
          {open && (
            <g fill={hair} stroke={dark} strokeOpacity="0.35" strokeWidth="0.8">
              <path d={CROWN} stroke="none" />
              {Array.from({ length: 11 }, (_, i) => {
                const t = Math.PI * (1.08 + (i / 10) * 0.84);
                return <circle key={i} cx={100 + 25 * Math.cos(t)} cy={57 + 23 * Math.sin(t)} r="6.6" />;
              })}
              {[87, 95, 104, 112].map((x) => (
                <circle key={x} cx={x} cy={x === 87 || x === 112 ? 52.5 : 50.5} r="4.6" />
              ))}
            </g>
          )}
        </g>
      );
    case 'afro':
      return crown(CROWN);
    case 'braids':
      return (
        <g>
          <Braids end={end} hair={hair} dark={dark} accent={accent} />
          {crown(
            CROWN,
            <path d={`${PART} M92 37.5 Q89.5 43 88.5 50.5 M108 37.5 Q110.5 43 111.5 50.5`} stroke={dark} strokeOpacity="0.6" strokeWidth="0.9" fill="none" />
          )}
        </g>
      );
    case 'ponytail':
      return crown(SLEEK, <path d="M90 49 Q94 41 104 38.5 M96 50 Q100 43 110 41" stroke={shine} strokeOpacity="0.35" strokeWidth="1" fill="none" />);
    case 'pigtails':
      return (
        <g>
          <Pigtails end={end} hair={hair} dark={dark} accent={accent} />
          {crown(CROWN, part)}
        </g>
      );
    case 'bun':
      return (
        open && (
          <g>
            <circle cx="100" cy="31" r="9.5" fill={hair} />
            <path d="M94 29 Q100 24 106 30" stroke={shine} strokeOpacity="0.5" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d={SLEEK} fill={hair} />
            <path d="M93 39.5 Q100 42.5 107 39.5" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
            {crownShine}
          </g>
        )
      );
    case 'mohawk':
      return (
        open && (
          <g>
            <path d={BUZZ} fill={mix(hair, skin, 0.6)} />
            <path d={MOHAWK} fill={hair} />
            <path d="M97 48 L97.5 30 M102.5 48 L103 28" stroke={shine} strokeOpacity="0.4" strokeWidth="1" />
          </g>
        )
      );
    case 'bald':
      return open && <ellipse cx="90.5" cy="49" rx="6" ry="3.2" fill="#fff" opacity="0.22" transform="rotate(-28 90.5 49)" />;
    default:
      return null;
  }
}
