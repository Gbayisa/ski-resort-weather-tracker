export default function AdSlot({ position }) {
  return (
    <div className="ad-slot" data-ad-position={position}>
      <div className="ad-slot-label">
        {/* 
          Google AdSense placeholder — replace with real ad code in production.
          For EU/EEA/UK/Switzerland: integrate a certified CMP (Consent Management Platform)
          before serving personalized ads.
          
          Example production code:
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="XXXXXXXXXX"
            data-ad-format="auto"
            data-full-width-responsive="true" />
        */}
        📢 Ad Space — {position === 'top' ? 'Leaderboard' : 'Bottom Banner'}
      </div>
      <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
        Placeholder for Google AdSense ({position})
      </div>
    </div>
  );
}
