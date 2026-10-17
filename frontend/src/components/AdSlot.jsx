import { useEffect } from 'react';

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;

/**
 * Renders a Google AdSense unit only when VITE_ADSENSE_CLIENT is configured
 * (and the AdSense script is added to index.html). Otherwise renders nothing,
 * so there are never empty placeholder boxes in the UI.
 */
export default function AdSlot({ slot }) {
  useEffect(() => {
    if (!CLIENT) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ad blockers or a missing script must never break the page
    }
  }, []);

  if (!CLIENT) return null;
  return (
    <div className="ad-slot">
      <span className="ad-label">Sponsored</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
