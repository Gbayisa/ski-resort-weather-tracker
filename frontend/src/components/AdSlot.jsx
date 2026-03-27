import { useEffect, useRef } from 'react';

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;
const SLOT_MAP = {
  top: import.meta.env.VITE_ADSENSE_SLOT_TOP,
  bottom: import.meta.env.VITE_ADSENSE_SLOT_BOTTOM,
};

// Singleton guard so the script is only injected once per page load.
let adsenseScriptInjected = false;

function loadAdSenseScript() {
  if (adsenseScriptInjected || !ADSENSE_CLIENT) return;
  adsenseScriptInjected = true;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
}

export default function AdSlot({ position }) {
  const slotId = SLOT_MAP[position];
  const isConfigured = Boolean(ADSENSE_CLIENT && slotId);
  const pushed = useRef(false);

  useEffect(() => {
    if (!isConfigured || pushed.current) return;
    pushed.current = true;
    loadAdSenseScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_e) {
      if (import.meta.env.DEV) {
        console.warn('[AdSlot] adsbygoogle.push() failed:', _e);
      }
    }
  }, [isConfigured, position]);

  if (!isConfigured) {
    return (
      <div className="ad-slot" data-ad-position={position}>
        <div className="ad-slot-label">
          📢 Ad Space — {position === 'top' ? 'Leaderboard' : 'Bottom Banner'}
        </div>
        <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
          Placeholder for Google AdSense ({position})
        </div>
      </div>
    );
  }

  return (
    <div className="ad-slot ad-slot--live" data-ad-position={position}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
