/** Instagram glyph — lucide-react no longer ships brand icons. */
export function InstagramIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Opens the profile in the Instagram app on phones (universal link), or instagram.com elsewhere. */
export default function InstagramLink({ handle, className = '' }) {
  if (!handle) return null;
  return (
    <a
      className={`ig-link ${className}`}
      href={`https://www.instagram.com/${encodeURIComponent(handle)}/`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`@${handle} on Instagram`}
    >
      <InstagramIcon size={14} />@{handle}
    </a>
  );
}
