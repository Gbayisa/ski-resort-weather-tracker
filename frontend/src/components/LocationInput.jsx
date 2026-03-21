import { useState, useRef, useEffect } from 'react';
import { useGeocoding } from '../hooks/useGeocoding.js';
import { getGeolocationErrorMessage } from '../utils/geoError.js';

export default function LocationInput({ location, setLocation }) {
  const { query, setQuery, results, isSearching, handleQueryChange, clearResults } = useGeocoding();
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please type a location instead.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          name: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoLoading(false);
        clearResults();
      },
      (err) => {
        alert(getGeolocationErrorMessage(err.code));
        setGeoLoading(false);
      },
      { timeout: 10000 },
    );
  };

  const handleSelect = (item) => {
    setLocation({
      name: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}${item.country ? ', ' + item.country : ''}`,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setShowDropdown(false);
    clearResults();
  };

  const handleClear = () => {
    setLocation(null);
    setQuery('');
    clearResults();
  };

  if (location) {
    return (
      <div className="search-field">
        <label>Your Location</label>
        <div className="location-tag">
          📍 {location.name}
          <button onClick={handleClear} title="Clear location">&times;</button>
        </div>
      </div>
    );
  }

  return (
    <div className="search-field geocode-wrapper" ref={wrapperRef}>
      <label htmlFor="location-input">Location</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          id="location-input"
          type="text"
          placeholder="Search city or zip code..."
          value={query}
          onChange={(e) => {
            handleQueryChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
        <button
          className="btn btn-secondary"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          title="Use my current location"
        >
          {geoLoading ? '⏳' : '📍'} My Location
        </button>
      </div>

      {showDropdown && results.length > 0 && (
        <div className="geocode-dropdown">
          {results.map((item, i) => (
            <div key={i} className="geocode-item" onClick={() => handleSelect(item)}>
              <span className="geo-name">{item.name}</span>{' '}
              <span className="geo-detail">
                {item.admin1 ? `${item.admin1}, ` : ''}{item.country}
              </span>
            </div>
          ))}
        </div>
      )}

      {showDropdown && isSearching && (
        <div className="geocode-dropdown">
          <div className="geocode-item geo-detail">Searching...</div>
        </div>
      )}
    </div>
  );
}
