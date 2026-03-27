export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <span>🏔️ Ski Resort Weather Tracker</span>
        <span>|</span>
        <a href="/privacy-policy.html">Privacy Policy</a>
      </div>

      <div className="attribution">
        <p>
          Weather data provided by{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo.com
          </a>
          .{' '}
          Open-Meteo provides free APIs for non-commercial use. Sites or apps with advertising
          are considered commercial use under their{' '}
          <a href="https://open-meteo.com/en/terms" target="_blank" rel="noopener noreferrer">
            terms of service
          </a>
          .
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Ski resort data derived from{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OpenStreetMap contributors
          </a>
          . Data available under the{' '}
          <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer">
            ODbL
          </a>
          .
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
          For production use with ads: ensure a Google AdSense account is active and a certified CMP
          is integrated for EU/EEA/UK/Switzerland consent requirements. Open-Meteo commercial API
          license required for ad-supported sites.
        </p>
      </div>
    </footer>
  );
}
