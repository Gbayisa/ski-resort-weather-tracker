import { useState } from 'react';
import LocationInput from './LocationInput.jsx';

export default function SearchPanel({
  location, setLocation,
  date, setDate, minDate, maxDate,
  radius, setRadius,
  minSnowfall, setMinSnowfall,
  onSearch, loading,
}) {
  return (
    <div className="search-panel">
      <div className="search-row">
        <LocationInput location={location} setLocation={setLocation} />
        <div className="search-field" style={{ maxWidth: 200 }}>
          <label htmlFor="date-input">Forecast Date</label>
          <input
            id="date-input"
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button
            className="btn btn-primary btn-search"
            onClick={onSearch}
            disabled={!location || loading}
          >
            {loading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </div>
      </div>

      <div className="controls-row">
        <div className="slider-control">
          <label>
            Search Radius: <span className="slider-value">{radius} km</span>
          </label>
          <input
            type="range"
            min="25"
            max="500"
            step="25"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </div>
        <div className="slider-control">
          <label>
            Min Snowfall: <span className="slider-value">{minSnowfall} cm</span>
          </label>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={minSnowfall}
            onChange={(e) => setMinSnowfall(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
