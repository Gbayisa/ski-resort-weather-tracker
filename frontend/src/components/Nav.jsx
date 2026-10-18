import { useEffect, useState } from 'react';
import { Compass, Users, User, CableCar } from 'lucide-react';
import RiderAvatar from './avatar/RiderAvatar.jsx';

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
          <CableCar size={18} strokeWidth={2.3} />
        </span>
        <span>
          First <span className="grad-text">Lift</span>
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
        {me?.rider ? <RiderAvatar config={me.rider.avatarConfig} fallback={me.rider.avatar} size={40} /> : <User size={18} />}
      </a>
    </header>
  );
}

const TEXT_INPUT = /^(INPUT|TEXTAREA|SELECT)$/;
const NON_TEXT_TYPES = new Set(['checkbox', 'radio', 'range', 'button', 'submit']);
const isTyping = (el) => !!el && ((TEXT_INPUT.test(el.tagName) && !NON_TEXT_TYPES.has(el.type)) || el.isContentEditable);

/**
 * iOS keeps fixed bars glued to the layout viewport, so while the keyboard is
 * open a bottom tab bar floats over the content; hide it while typing, like native apps.
 */
function useTyping() {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const onFocusIn = (e) => setTyping(isTyping(e.target));
    // Defer so moving between two fields doesn't flash the bar
    const onFocusOut = () => setTimeout(() => setTyping(isTyping(document.activeElement)), 0);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);
  return typing;
}

export function BottomNav({ route, me }) {
  const typing = useTyping();
  return (
    <nav className={`bottomnav ${typing ? 'is-hidden' : ''}`} aria-label="Main">
      {TABS.map(({ key, label, short, icon: Icon }) => (
        <a
          key={key}
          href={key === 'discover' ? '#/' : `#/${key}`}
          className={route === key ? 'is-active' : ''}
          aria-current={route === key ? 'page' : undefined}
        >
          <span className="bottomnav-icon">
            {key === 'profile' && me?.rider ? (
              <RiderAvatar config={me.rider.avatarConfig} fallback={me.rider.avatar} size={26} className="bottomnav-avatar" />
            ) : (
              <Icon size={22} />
            )}
            {key === 'meet' && me?.checkin && <span className="live-dot" />}
          </span>
          {short || label}
        </a>
      ))}
    </nav>
  );
}
