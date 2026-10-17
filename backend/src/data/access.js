/**
 * Car-free resorts: you can't drive into the village, so drive times and
 * navigation target where skiers actually leave the car (routing to the
 * village itself fails or snaps to a restricted road).
 */
export const CAR_FREE_ACCESS = {
  osm_zermatt: {
    lat: 46.0665,
    lon: 7.7776,
    via: 'Täsch',
    note: 'Car-free village — park in Täsch, then the 12-min shuttle train',
  },
  osm_saasfee: {
    lat: 46.1115,
    lon: 7.93,
    via: 'Saas-Fee car park',
    note: 'Car-free village — park at the car park by the village entrance',
  },
  osm_wengen: {
    lat: 46.5985,
    lon: 7.9093,
    via: 'Lauterbrunnen',
    note: 'Car-free village — park in Lauterbrunnen, then the train up',
  },
  osm_murren: {
    lat: 46.5985,
    lon: 7.9093,
    via: 'Lauterbrunnen',
    note: 'Car-free village — park in Lauterbrunnen, then cable car and train',
  },
};

/** The point to drive to: the access car park for car-free resorts, otherwise the resort itself. */
export function driveTarget(resort) {
  const access = CAR_FREE_ACCESS[resort.osm_id];
  return access ? { ...resort, lat: access.lat, lon: access.lon } : resort;
}
