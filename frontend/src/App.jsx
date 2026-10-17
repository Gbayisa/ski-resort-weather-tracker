import { useState, useCallback } from 'react';
import Hero from './components/Hero.jsx';
import Snowfall from './components/Snowfall.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import ResultsList from './components/ResultsList.jsx';
import AdSlot from './components/AdSlot.jsx';
import Footer from './components/Footer.jsx';
import { getRecommendations } from './api.js';
import { localISODate, localISODateOffset } from './utils/dates.js';

const getTomorrowDate = () => localISODateOffset(1);
const getMaxDate = () => localISODateOffset(7);

export default function App() {
  const [location, setLocation] = useState(null);
  const [date, setDate] = useState(getTomorrowDate());
  const [radius, setRadius] = useState(200);
  const [minSnowfall, setMinSnowfall] = useState(0);
  const [results, setResults] = useState(null);
  // The location the current results were computed from (drive times + directions origin)
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await getRecommendations({
        lat: location.latitude,
        lon: location.longitude,
        date,
        radius,
        minSnowfall,
      });
      setResults(data.results);
      setSearchedLocation(location);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [location, date, radius, minSnowfall]);

  return (
    <div className="app-container">
      <Snowfall />
      <Hero />
      <main className="main-content">
        <SearchPanel
          location={location}
          setLocation={setLocation}
          date={date}
          setDate={setDate}
          minDate={localISODate()}
          maxDate={getMaxDate()}
          radius={radius}
          setRadius={setRadius}
          minSnowfall={minSnowfall}
          setMinSnowfall={setMinSnowfall}
          onSearch={handleSearch}
          loading={loading}
        />

        <AdSlot position="top" />

        {error && <div className="error-banner">⚠️ {error}</div>}

        <ResultsList
          results={results}
          origin={searchedLocation}
          loading={loading}
          searched={searched}
          date={date}
        />

        <AdSlot position="bottom" />
      </main>
      <Footer />
    </div>
  );
}
