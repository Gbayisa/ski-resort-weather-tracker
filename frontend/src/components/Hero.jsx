export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-stars" />
      <div className="hero-aurora" />
      <div className="hero-content">
        <div className="hero-icon">⛷️</div>
        <h1>
          Powder<span className="hero-title-accent">Radar</span>
        </h1>
        <p className="hero-tagline">Ski Resort Weather Tracker</p>
        <p>
          Real drive times, live snow forecasts and terrain profiles for 297 resorts
          worldwide — know before you go.
        </p>
      </div>

      {/* Layered mountain silhouettes (parallax drift) */}
      <svg
        className="hero-mountains hero-mountains-back"
        viewBox="0 0 1440 260"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,260 L0,170 L140,90 L260,160 L390,60 L520,150 L640,80 L760,170 L900,70 L1030,160 L1160,90 L1300,170 L1440,110 L1440,260 Z"
          fill="rgba(148, 187, 233, 0.45)"
        />
      </svg>
      <svg
        className="hero-mountains hero-mountains-mid"
        viewBox="0 0 1440 260"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,260 L0,200 L180,110 L330,190 L470,90 L620,180 L790,100 L950,190 L1120,110 L1280,190 L1440,140 L1440,260 Z"
          fill="rgba(59, 110, 165, 0.75)"
        />
        {/* snow caps: triangles hugging each peak with a jagged lower edge */}
        <path d="M154,123 L180,110 L206,124 L198,120 L190,127 L180,119 L170,126 L162,119 Z" fill="rgba(255,255,255,0.7)" />
        <path d="M444,108 L470,90 L496,106 L487,101 L478,109 L468,100 L458,107 L450,102 Z" fill="rgba(255,255,255,0.7)" />
        <path d="M764,112 L790,100 L816,115 L806,109 L797,116 L788,108 L778,114 L771,109 Z" fill="rgba(255,255,255,0.7)" />
        <path d="M1094,122 L1120,110 L1146,123 L1137,117 L1128,124 L1119,116 L1109,122 L1101,117 Z" fill="rgba(255,255,255,0.7)" />
      </svg>
      <svg
        className="hero-mountains hero-mountains-front"
        viewBox="0 0 1440 260"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,260 L0,230 L200,150 L380,225 L560,130 L740,220 L930,140 L1110,225 L1290,160 L1440,215 L1440,260 Z"
          fill="#12263f"
        />
        <path d="M530,146 L560,130 L590,145 L579,139 L569,147 L559,138 L548,145 L539,140 Z" fill="rgba(255,255,255,0.85)" />
        <path d="M900,153 L930,140 L960,154 L949,147 L939,155 L929,146 L918,153 L909,147 Z" fill="rgba(255,255,255,0.85)" />
      </svg>
    </header>
  );
}
