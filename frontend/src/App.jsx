import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VideoHero from './components/VideoHero.jsx';
import { LocationBar } from './components/Location.jsx';
import TripPlanner, { DEFAULT_DRIVE } from './components/TripPlanner.jsx';
import Results from './components/Results.jsx';
import MeetView from './components/meet/MeetView.jsx';
import ProfileView from './components/ProfileView.jsx';
import { TopBar, BottomNav } from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import { discover, meetApi } from './api.js';
import { usePersistentState } from './hooks/usePersistentState.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { localISODate, defaultDayOffset, tripDates } from './utils/dates.js';

/** While the server is still fetching forecasts for some resorts, re-ask this often (≈1 min max). */
const PENDING_POLL_MS = 8000;
const PENDING_POLL_MAX = 8;

/** Fetch ranked resorts whenever the query changes; keeps the last result while refreshing. */
function useDiscover(location, query) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  const [poll, setPoll] = useState(0);
  const key = location ? JSON.stringify([location.latitude, location.longitude, query]) : null;

  useEffect(() => setPoll(0), [key]);

  useEffect(() => {
    if (!key) return undefined;
    const controller = new AbortController();
    const background = poll > 0;
    if (!background) setState((s) => ({ ...s, loading: true, error: null }));
    let next;
    const t = setTimeout(
      () => {
        discover({ lat: location.latitude, lon: location.longitude, ...query }, controller.signal)
          .then((data) => {
            setState({ data, loading: false, error: null });
            if (data.pendingForecasts > 0 && poll < PENDING_POLL_MAX) {
              next = setTimeout(() => setPoll((p) => p + 1), PENDING_POLL_MS);
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err.message }));
          });
      },
      background ? 0 : 120
    );
    return () => {
      clearTimeout(t);
      clearTimeout(next);
      controller.abort();
    };
    // `key` serialises location + query; `poll` re-asks while forecasts are pending
  }, [key, poll]);

  return state;
}

function useToast() {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);
  const toast = useCallback((msg) => {
    setMessage(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3200);
  }, []);
  return [message, toast];
}

export default function App() {
  const [route, navigate] = useHashRoute();
  const [location, setLocation] = usePersistentState('pr.location', null);
  const [trip, setTrip] = usePersistentState('pr.trip', 'day');
  const [style, setStyle] = usePersistentState('pr.style', 'allmountain');
  // null = automatic: the drive tolerance follows the trip length until the user picks one
  const [driveChoice, setDriveChoice] = usePersistentState('pr.drive', null);
  const [dayOffset, setDayOffset] = useState(defaultDayOffset);
  const [me, setMe] = useState(undefined);
  const [toastMessage, toast] = useToast();

  const drive = driveChoice ?? DEFAULT_DRIVE[trip];
  const today = localISODate();
  // `today` is a dependency so the dates roll over when the app stays open past midnight
  const dates = useMemo(() => tripDates(trip, dayOffset), [trip, dayOffset, today]);
  const query = useMemo(() => ({ today, dates, trip, drive, style }), [today, dates, trip, drive, style]);
  const results = useDiscover(location, query);

  useEffect(() => {
    meetApi
      .me()
      .then(setMe)
      .catch(() => setMe({ rider: null }));
  }, []);

  const changeTrip = (t) => {
    setTrip(t);
    setDriveChoice(null);
  };

  return (
    <div className={`app route-${route}`}>
      <TopBar route={route} navigate={navigate} me={me} overHero={route === 'discover'} />

      {route === 'discover' && (
        <main>
          <VideoHero compact={!!location}>
            <p className="eyebrow hero-eyebrow">Live snow · Real drive times · Riders on the mountain</p>
            <h1 className="hero-title">
              Your perfect ski day, <span className="grad-text">in three taps.</span>
            </h1>
            <LocationBar location={location} onChange={setLocation} />
          </VideoHero>

          {location && (
            <div className="discover-body">
              <TripPlanner
                trip={trip}
                onTrip={changeTrip}
                dayOffset={dayOffset}
                onDayOffset={setDayOffset}
                drive={drive}
                onDrive={setDriveChoice}
                style={style}
                onStyle={setStyle}
                outlook={results.data?.outlook}
                today={today}
                dates={dates}
              />
              <Results
                state={results}
                origin={location}
                trip={trip}
                drive={drive}
                style={style}
                dates={dates}
                onStyle={setStyle}
                onMeet={() => navigate('meet')}
                locationName={location.name}
              />
            </div>
          )}
        </main>
      )}

      {route === 'meet' && (
        <main className="page-wrap">
          <MeetView me={me} setMe={setMe} navigate={navigate} toast={toast} />
        </main>
      )}

      {route === 'profile' && (
        <main className="page-wrap">
          {me === undefined ? null : (
            <ProfileView key={me?.rider?.id ?? 'new'} me={me} setMe={setMe} navigate={navigate} toast={toast} />
          )}
        </main>
      )}

      <Footer />
      <BottomNav route={route} me={me} />
      <div className={`toast ${toastMessage ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </div>
  );
}
