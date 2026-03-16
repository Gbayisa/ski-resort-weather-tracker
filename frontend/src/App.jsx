import { useState, useCallback } from 'react';
import Hero from './components/Hero.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import ResultsList from './components/ResultsList.jsx';
import AdSlot from './components/AdSlot.jsx';
import Footer from './components/Footer.jsx';
import { getRecommendations } from './api.js';

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getMaxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().split('T')[0];
}

export default function App() {
  const [location, setLocation] = useState(null);
  const [date, setDate] = useState(getTomorrowDate());
  const [radius, setRadius] = useState(200);
  const [minSnowfall, setMinSnowfall] = useState(0);
  const [results, setResults] = useState(null);
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
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [location, date, radius, minSnowfall]);

  return (
    <div className="app-container">
      <Hero />
      <main className="main-content">
        <SearchPanel
          location={location}
          setLocation={setLocation}
          date={date}
          setDate={setDate}
          minDate={new Date().toISOString().split('T')[0]}
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
