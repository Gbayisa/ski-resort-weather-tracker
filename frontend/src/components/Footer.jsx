import { MountainSnow } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <span className="brand-mark brand-mark-sm">
          <MountainSnow size={14} strokeWidth={2.3} />
        </span>
        <strong>Snowfolk</strong>
        <span className="muted">Know before you go</span>
      </div>
      <p>
        Forecasts are model estimates; snow cover is estimated and drive times exclude traffic. Always check road,
        weather and avalanche conditions with official sources before heading out.
      </p>
      <p className="footer-credits">
        Weather data by{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo.com
        </a>{' '}
        (CC BY 4.0). Resort and road data ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap contributors
        </a>{' '}
        (ODbL), ski areas via{' '}
        <a href="https://openskimap.org/" target="_blank" rel="noopener noreferrer">
          OpenSkiMap
        </a>
        , routing by{' '}
        <a href="https://project-osrm.org/" target="_blank" rel="noopener noreferrer">
          OSRM
        </a>
        . Video: Mixkit.
      </p>
    </footer>
  );
}
