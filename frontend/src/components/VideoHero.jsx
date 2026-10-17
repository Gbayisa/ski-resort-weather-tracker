import { useEffect, useRef, useState } from 'react';

/**
 * Mixkit stock footage (free for commercial use, no attribution required).
 * 720p keeps each clip at 3–6 MB; for production, self-host these files.
 */
const CLIPS = [
  [3387, 1], // aerial over a ski mountain
  [3378, 1], // skiers carving down a mountain
  [3362, 0], // skier on a snowy summit
].map(([id, thumb]) => ({
  id,
  src: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
  poster: `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-${thumb}.jpg`,
}));

/** Start the next clip this long before the current ends, so they crossfade. */
const CROSSFADE_S = 1.4;

function motionAllowed() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  const conn = navigator.connection;
  return !(conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || ''));
}

export default function VideoHero({ compact = false, children }) {
  const [playVideo] = useState(motionAllowed);
  const [index, setIndex] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (!playVideo) return;
    const v = refs.current[index];
    if (!v) return;
    v.muted = true; // iOS only autoplays muted, inline video
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [index, playVideo]);

  const advance = (i) => (e) => {
    const v = e.currentTarget;
    if (i === index && v.duration && v.duration - v.currentTime < CROSSFADE_S) {
      setIndex((index + 1) % CLIPS.length);
    }
  };

  return (
    <section className={`hero ${compact ? 'hero-compact' : ''}`}>
      <div className="hero-media" aria-hidden="true">
        {playVideo ? (
          CLIPS.map((clip, i) => {
            const isActive = i === index;
            const isNext = i === (index + 1) % CLIPS.length;
            return (
              <video
                key={clip.id}
                ref={(el) => (refs.current[i] = el)}
                className={`hero-video ${isActive ? 'is-active' : ''}`}
                src={clip.src}
                poster={clip.poster}
                muted
                playsInline
                autoPlay={i === 0}
                preload={isActive || isNext ? 'auto' : 'none'}
                onTimeUpdate={advance(i)}
                onEnded={() => isActive && setIndex((index + 1) % CLIPS.length)}
                disablePictureInPicture
              />
            );
          })
        ) : (
          <img className="hero-video is-active hero-still" src={CLIPS[0].poster} alt="" />
        )}
        <div className="hero-scrim" />
      </div>
      <div className="hero-inner">{children}</div>
    </section>
  );
}
