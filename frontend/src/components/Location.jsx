import { useState } from 'react';
import { LocateFixed, MapPin, Search, ChevronDown, Loader2 } from 'lucide-react';
import Sheet from './Sheet.jsx';
import { useGeocoding } from '../hooks/useGeocoding.js';
import { getCurrentPosition } from '../utils/geo.js';

/** Resolve the device location into the app's location shape. */
export async function locateDevice() {
  const pos = await getCurrentPosition();
  return { name: 'My location', latitude: pos.latitude, longitude: pos.longitude, fromDevice: true };
}

/** Hero control: "From Geneva ▾", or two big first-run buttons. */
export function LocationBar({ location, onChange }) {
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      onChange(await locateDevice());
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  if (location) {
    return (
      <>
        <button className="location-pill" onClick={() => setOpen(true)} aria-label="Change starting point">
          <MapPin size={16} />
          <span className="location-pill-label">From</span>
          <strong>{location.name}</strong>
          <ChevronDown size={16} />
        </button>
        <LocationSheet open={open} onClose={() => setOpen(false)} onChange={onChange} />
      </>
    );
  }

  return (
    <div className="location-start">
      <p className="location-start-q">Where are you starting from?</p>
      <div className="location-start-actions">
        <button className="btn btn-primary btn-lg" onClick={useMyLocation} disabled={locating}>
          {locating ? <Loader2 size={18} className="spin" /> : <LocateFixed size={18} />}
          Use my location
        </button>
        <button className="btn btn-glass btn-lg" onClick={() => setOpen(true)}>
          <Search size={18} /> Enter a town
        </button>
      </div>
      {error && <p className="location-error">{error}</p>}
      <LocationSheet open={open} onClose={() => setOpen(false)} onChange={onChange} />
    </div>
  );
}

function LocationSheet({ open, onClose, onChange }) {
  const { query, results, isSearching, handleQueryChange, clearResults } = useGeocoding();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  const pick = (loc) => {
    onChange(loc);
    clearResults();
    onClose();
  };

  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      pick(await locateDevice());
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Starting from">
      <label className="search-field">
        <Search size={18} />
        <input
          autoFocus
          type="text"
          inputMode="search"
          placeholder="Town, city or postcode"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          aria-label="Search for a town"
        />
        {isSearching && <Loader2 size={18} className="spin" />}
      </label>
      <ul className="location-results">
        <li>
          <button className="location-result" onClick={useMyLocation} disabled={locating}>
            {locating ? <Loader2 size={18} className="spin" /> : <LocateFixed size={18} />}
            <span>
              <strong>Use my current location</strong>
              <small>Best for live turn-by-turn directions</small>
            </span>
          </button>
        </li>
        {results.map((r) => (
          <li key={`${r.latitude},${r.longitude}`}>
            <button
              className="location-result"
              onClick={() =>
                pick({
                  name: [r.name, r.admin1].filter(Boolean).join(', '),
                  latitude: r.latitude,
                  longitude: r.longitude,
                })
              }
            >
              <MapPin size={18} />
              <span>
                <strong>{r.name}</strong>
                <small>{[r.admin1, r.country].filter(Boolean).join(', ')}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="location-error">{error}</p>}
    </Sheet>
  );
}
