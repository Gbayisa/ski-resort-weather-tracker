import { useCallback, useEffect, useState } from 'react';

export const ROUTES = ['discover', 'meet', 'profile'];

const read = () => {
  const r = window.location.hash.replace(/^#\/?/, '');
  return ROUTES.includes(r) ? r : 'discover';
};

/** Minimal hash router so tabs have URLs and the phone's back button works. */
export function useHashRoute() {
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((r) => {
    window.location.hash = r === 'discover' ? '/' : `/${r}`;
  }, []);

  return [route, navigate];
}
