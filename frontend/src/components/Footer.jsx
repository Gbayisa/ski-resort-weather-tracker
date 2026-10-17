export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <span>⛷️ PowderRadar</span>
        <span aria-hidden="true">·</span>
        <span>Know before you go</span>
      </div>

      <div className="attribution">
        <p>
          Forecasts are model estimates and drive times exclude traffic. Always check road,
          weather and avalanche conditions with official sources before heading out.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Weather data by{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo.com
          </a>{' '}
          (CC BY 4.0). Resort and road data ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap contributors
          </a>{' '}
          (
          <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener noreferrer">
            ODbL
          </a>
          ), routing by{' '}
          <a href="https://project-osrm.org/" target="_blank" rel="noopener noreferrer">
            OSRM
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
