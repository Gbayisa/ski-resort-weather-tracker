import { getDb } from './database.js';

let catalogue = null;

/**
 * Every resort, held in memory: searches scan the whole catalogue, and it only changes when
 * it is re-seeded. Reading ~3,700 rows from a networked database on every search would not scale.
 */
export function allResorts() {
  if (!catalogue) {
    catalogue = getDb()
      .all('SELECT * FROM resorts ORDER BY id')
      .catch((err) => {
        catalogue = null;
        throw err;
      });
  }
  return catalogue;
}

export function invalidateResorts() {
  catalogue = null;
}
