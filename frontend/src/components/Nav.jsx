import { useEffect, useState } from 'react';
import { Compass, Users, User, Snowflake } from 'lucide-react';

const TABS = [
  { key: 'discover', label: 'Discover', icon: Compass },
  { key: 'meet', label: 'Meet riders', short: 'Meet', icon: Users },
  { key: 'profile', label: 'Profile', icon: User },
];

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function TopBar({ route, navigate, me, overHero }) {
  const scrolled = useScrolled();
  const checkedIn = !!me?.checkin;
  return (
    <header className={`topbar ${scrolled || !overHero ? 'is-solid' : ''}`}>
      <a
        className="brand"
        href="#/"
        onClick={(e) => {
          e.preventDefault();
          navigate('discover');
        }}
      >
        <span className="brand-mark">
          <Snowflake size={18} strokeWidth={2.5} />
        </span>
        <span>
          Powder<span className="grad-text">Radar</span>
        </span>
      </a>
      <nav className="topnav" aria-label="Main">
        {TABS.map(({ key, label }) => (
          <a
            key={key}
            href={key === 'discover' ? '#/' : `#/${key}`}
            className={route === key ? 'is-active' : ''}
            aria-current={route === key ? 'page' : undefined}
          >
            {label}
            {key === 'meet' && checkedIn && <span className="live-dot" aria-label="checked in" />}
          </a>
        ))}
      </nav>
      <a className="topbar-avatar" href="#/profile" aria-label="Your profile">
        {me?.rider?.avatar || <User size={18} />}
      </a>
    </header>
  );
}

export function BottomNav({ route, me }) {
  return (
    <nav className="bottomnav" aria-label="Main">
      {TABS.map(({ key, label, short, icon: Icon }) => (
        <a
          key={key}
          href={key === 'discover' ? '#/' : `#/${key}`}
          className={route === key ? 'is-active' : ''}
          aria-current={route === key ? 'page' : undefined}
        >
          <span className="bottomnav-icon">
            {key === 'profile' && me?.rider ? <span className="bottomnav-avatar">{me.rider.avatar}</span> : <Icon size={22} />}
            {key === 'meet' && me?.checkin && <span className="live-dot" />}
          </span>
          {short || label}
        </a>
      ))}
    </nav>
  );
}
