// North America grades runs green/blue/black; Europe grades blue/red/black.
const NA = new Set(['US', 'CA']);

export function terrainLevels(terrain, country) {
  const na = NA.has(country);
  return [
    { pct: terrain.pctEasy, label: na ? 'Green' : 'Blue', cls: na ? 'green' : 'blue' },
    { pct: terrain.pctIntermediate, label: na ? 'Blue' : 'Red', cls: na ? 'blue' : 'red' },
    { pct: terrain.pctAdvanced, label: 'Black', cls: 'black' },
  ].filter((l) => l.pct != null && l.pct > 0);
}

export default function TerrainBar({ terrain, country }) {
  const levels = terrainLevels(terrain, country);
  return (
    <div className="terrain">
      {levels.length > 0 && (
        <>
          <div className="terrain-bar" role="img" aria-label={levels.map((l) => `${l.pct}% ${l.label}`).join(', ')}>
            {levels.map((l) => (
              <span key={l.label} className={`terrain-seg run-${l.cls}`} style={{ width: `${l.pct}%` }} />
            ))}
          </div>
          <div className="terrain-legend">
            {levels.map((l) => (
              <span key={l.label}>
                <i className={`run-dot run-${l.cls}`} /> {l.pct}% {l.label}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="terrain-facts">
        {terrain.pisteKm != null && <span>{terrain.pisteKm} km pistes</span>}
        {terrain.lifts != null && <span>{terrain.lifts} lifts</span>}
        {terrain.snowparks > 0 && <span>{terrain.snowparks} snow park{terrain.snowparks > 1 ? 's' : ''}</span>}
      </div>
    </div>
  );
}
