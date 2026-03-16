import { getDb, initDb } from '../db/database.js';

/**
 * Seed script: populates the resorts table with a curated set of well-known
 * ski resorts worldwide. In production this would be refreshed from
 * OpenStreetMap Overpass API using winter_sports tags.
 *
 * Data sourced/inspired by OpenStreetMap (© OpenStreetMap contributors).
 */
const SEED_RESORTS = [
  // --- North America ---
  { name: 'Vail', lat: 39.6403, lon: -106.3742, country: 'US', region: 'Colorado', website: 'https://www.vail.com', osm_id: 'osm_vail' },
  { name: 'Aspen Snowmass', lat: 39.2084, lon: -106.9490, country: 'US', region: 'Colorado', website: 'https://www.aspensnowmass.com', osm_id: 'osm_aspen' },
  { name: 'Breckenridge', lat: 39.4817, lon: -106.0384, country: 'US', region: 'Colorado', website: 'https://www.breckenridge.com', osm_id: 'osm_breckenridge' },
  { name: 'Park City', lat: 40.6461, lon: -111.4980, country: 'US', region: 'Utah', website: 'https://www.parkcitymountain.com', osm_id: 'osm_parkcity' },
  { name: 'Snowbird', lat: 40.5830, lon: -111.6538, country: 'US', region: 'Utah', website: 'https://www.snowbird.com', osm_id: 'osm_snowbird' },
  { name: 'Alta', lat: 40.5884, lon: -111.6386, country: 'US', region: 'Utah', website: 'https://www.alta.com', osm_id: 'osm_alta' },
  { name: 'Jackson Hole', lat: 43.5877, lon: -110.8279, country: 'US', region: 'Wyoming', website: 'https://www.jacksonhole.com', osm_id: 'osm_jacksonhole' },
  { name: 'Big Sky', lat: 45.2862, lon: -111.4013, country: 'US', region: 'Montana', website: 'https://bigskyresort.com', osm_id: 'osm_bigsky' },
  { name: 'Mammoth Mountain', lat: 37.6308, lon: -119.0326, country: 'US', region: 'California', website: 'https://www.mammothmountain.com', osm_id: 'osm_mammoth' },
  { name: 'Squaw Valley (Palisades Tahoe)', lat: 39.1968, lon: -120.2354, country: 'US', region: 'California', website: 'https://www.palisadestahoe.com', osm_id: 'osm_palisades' },
  { name: 'Heavenly', lat: 38.9353, lon: -119.9400, country: 'US', region: 'California', website: 'https://www.skiheavenly.com', osm_id: 'osm_heavenly' },
  { name: 'Steamboat Springs', lat: 40.4572, lon: -106.8045, country: 'US', region: 'Colorado', website: 'https://www.steamboat.com', osm_id: 'osm_steamboat' },
  { name: 'Telluride', lat: 37.9375, lon: -107.8123, country: 'US', region: 'Colorado', website: 'https://tellurideskiresort.com', osm_id: 'osm_telluride' },
  { name: 'Sun Valley', lat: 43.6975, lon: -114.3514, country: 'US', region: 'Idaho', website: 'https://www.sunvalley.com', osm_id: 'osm_sunvalley' },
  { name: 'Taos Ski Valley', lat: 36.5961, lon: -105.4546, country: 'US', region: 'New Mexico', website: 'https://www.skitaos.com', osm_id: 'osm_taos' },
  { name: 'Killington', lat: 43.6045, lon: -72.8201, country: 'US', region: 'Vermont', website: 'https://www.killington.com', osm_id: 'osm_killington' },
  { name: 'Stowe', lat: 44.5303, lon: -72.7814, country: 'US', region: 'Vermont', website: 'https://www.stowe.com', osm_id: 'osm_stowe' },
  { name: 'Whistler Blackcomb', lat: 50.1163, lon: -122.9574, country: 'CA', region: 'British Columbia', website: 'https://www.whistlerblackcomb.com', osm_id: 'osm_whistler' },
  { name: 'Banff Sunshine', lat: 51.0784, lon: -115.7731, country: 'CA', region: 'Alberta', website: 'https://www.skibanff.com', osm_id: 'osm_banffsunshine' },
  { name: 'Lake Louise', lat: 51.4254, lon: -116.1773, country: 'CA', region: 'Alberta', website: 'https://www.skilouise.com', osm_id: 'osm_lakelouise' },
  { name: 'Revelstoke', lat: 51.0014, lon: -118.1644, country: 'CA', region: 'British Columbia', website: 'https://www.revelstokemountainresort.com', osm_id: 'osm_revelstoke' },
  { name: 'Mont-Tremblant', lat: 46.2094, lon: -74.5850, country: 'CA', region: 'Quebec', website: 'https://www.tremblant.ca', osm_id: 'osm_tremblant' },

  // --- Europe ---
  { name: 'Chamonix', lat: 45.9237, lon: 6.8694, country: 'FR', region: 'Haute-Savoie', website: 'https://www.chamonix.com', osm_id: 'osm_chamonix' },
  { name: 'Val d\'Isère', lat: 45.4485, lon: 6.9806, country: 'FR', region: 'Savoie', website: 'https://www.valdisere.com', osm_id: 'osm_valdisere' },
  { name: 'Courchevel', lat: 45.4153, lon: 6.6347, country: 'FR', region: 'Savoie', website: 'https://www.courchevel.com', osm_id: 'osm_courchevel' },
  { name: 'Les Deux Alpes', lat: 45.0170, lon: 6.1225, country: 'FR', region: 'Isère', website: 'https://www.les2alpes.com', osm_id: 'osm_les2alpes' },
  { name: 'Méribel', lat: 45.3970, lon: 6.5660, country: 'FR', region: 'Savoie', website: 'https://www.meribel.net', osm_id: 'osm_meribel' },
  { name: 'Zermatt', lat: 46.0207, lon: 7.7491, country: 'CH', region: 'Valais', website: 'https://www.zermatt.ch', osm_id: 'osm_zermatt' },
  { name: 'St. Moritz', lat: 46.4908, lon: 9.8355, country: 'CH', region: 'Graubünden', website: 'https://www.stmoritz.com', osm_id: 'osm_stmoritz' },
  { name: 'Verbier', lat: 46.0964, lon: 7.2283, country: 'CH', region: 'Valais', website: 'https://www.verbier.ch', osm_id: 'osm_verbier' },
  { name: 'Davos Klosters', lat: 46.8027, lon: 9.8360, country: 'CH', region: 'Graubünden', website: 'https://www.davos.ch', osm_id: 'osm_davos' },
  { name: 'St. Anton am Arlberg', lat: 47.1292, lon: 10.2683, country: 'AT', region: 'Tyrol', website: 'https://www.stantonamarlberg.com', osm_id: 'osm_stanton' },
  { name: 'Kitzbühel', lat: 47.4559, lon: 12.3927, country: 'AT', region: 'Tyrol', website: 'https://www.kitzbuehel.com', osm_id: 'osm_kitzbuhel' },
  { name: 'Innsbruck Nordkette', lat: 47.3070, lon: 11.3884, country: 'AT', region: 'Tyrol', website: 'https://www.nordkette.com', osm_id: 'osm_nordkette' },
  { name: 'Sölden', lat: 46.9656, lon: 10.8760, country: 'AT', region: 'Tyrol', website: 'https://www.soelden.com', osm_id: 'osm_soelden' },
  { name: 'Ischgl', lat: 47.0140, lon: 10.2930, country: 'AT', region: 'Tyrol', website: 'https://www.ischgl.com', osm_id: 'osm_ischgl' },
  { name: 'Cortina d\'Ampezzo', lat: 46.5369, lon: 12.1357, country: 'IT', region: 'Veneto', website: 'https://www.cortina.dolomiti.com', osm_id: 'osm_cortina' },
  { name: 'Val Gardena', lat: 46.5580, lon: 11.6760, country: 'IT', region: 'South Tyrol', website: 'https://www.valgardena.it', osm_id: 'osm_valgardena' },
  { name: 'Cervinia', lat: 45.9325, lon: 7.6317, country: 'IT', region: 'Aosta Valley', website: 'https://www.cervinia.it', osm_id: 'osm_cervinia' },
  { name: 'Garmisch-Partenkirchen', lat: 47.5004, lon: 11.0950, country: 'DE', region: 'Bavaria', website: 'https://www.gapa.de', osm_id: 'osm_garmisch' },
  { name: 'Sierra Nevada', lat: 37.0956, lon: -3.3963, country: 'ES', region: 'Andalusia', website: 'https://sierranevada.es', osm_id: 'osm_sierranevada' },
  { name: 'Åre', lat: 63.3984, lon: 13.0744, country: 'SE', region: 'Jämtland', website: 'https://www.skistar.com/are', osm_id: 'osm_are' },
  { name: 'Hemsedal', lat: 60.8612, lon: 8.3952, country: 'NO', region: 'Viken', website: 'https://www.hemsedal.com', osm_id: 'osm_hemsedal' },
  { name: 'Levi', lat: 67.8039, lon: 24.8141, country: 'FI', region: 'Lapland', website: 'https://www.levi.fi', osm_id: 'osm_levi' },

  // --- Asia / Oceania ---
  { name: 'Niseko', lat: 42.8625, lon: 140.6987, country: 'JP', region: 'Hokkaido', website: 'https://www.niseko.ne.jp', osm_id: 'osm_niseko' },
  { name: 'Hakuba', lat: 36.6983, lon: 137.8322, country: 'JP', region: 'Nagano', website: 'https://www.hakubavalley.com', osm_id: 'osm_hakuba' },
  { name: 'Nozawa Onsen', lat: 36.9221, lon: 138.6294, country: 'JP', region: 'Nagano', website: 'https://nozawaski.com', osm_id: 'osm_nozawa' },
  { name: 'Yongpyong', lat: 37.6439, lon: 128.6808, country: 'KR', region: 'Gangwon', website: 'https://www.yongpyong.co.kr', osm_id: 'osm_yongpyong' },
  { name: 'Thredbo', lat: -36.5054, lon: 148.3044, country: 'AU', region: 'New South Wales', website: 'https://www.thredbo.com.au', osm_id: 'osm_thredbo' },
  { name: 'Perisher', lat: -36.3717, lon: 148.4093, country: 'AU', region: 'New South Wales', website: 'https://www.perisher.com.au', osm_id: 'osm_perisher' },
  { name: 'Coronet Peak', lat: -45.0871, lon: 168.7282, country: 'NZ', region: 'Otago', website: 'https://www.coronetpeak.co.nz', osm_id: 'osm_coronetpeak' },
  { name: 'The Remarkables', lat: -45.0467, lon: 168.8147, country: 'NZ', region: 'Otago', website: 'https://www.theremarkables.co.nz', osm_id: 'osm_remarkables' },

  // --- South America ---
  { name: 'Valle Nevado', lat: -33.3558, lon: -70.2546, country: 'CL', region: 'Santiago Metro', website: 'https://www.vallenevado.com', osm_id: 'osm_vallenevado' },
  { name: 'Portillo', lat: -32.8325, lon: -70.1270, country: 'CL', region: 'Valparaíso', website: 'https://www.skiportillo.com', osm_id: 'osm_portillo' },
  { name: 'Cerro Catedral', lat: -41.1649, lon: -71.4432, country: 'AR', region: 'Río Negro', website: 'https://www.catedralaltapatagonia.com', osm_id: 'osm_catedral' },
  { name: 'Las Leñas', lat: -35.1625, lon: -70.0761, country: 'AR', region: 'Mendoza', website: 'https://www.laslenas.com', osm_id: 'osm_laslenas' },

  // --- More US Resorts ---
  { name: 'Deer Valley', lat: 40.6374, lon: -111.4783, country: 'US', region: 'Utah', website: 'https://www.deervalley.com', osm_id: 'osm_deervalley' },
  { name: 'Brighton', lat: 40.5980, lon: -111.5833, country: 'US', region: 'Utah', website: 'https://www.brightonresort.com', osm_id: 'osm_brighton' },
  { name: 'Solitude', lat: 40.6199, lon: -111.5916, country: 'US', region: 'Utah', website: 'https://www.solitudemountain.com', osm_id: 'osm_solitude' },
  { name: 'Copper Mountain', lat: 39.5022, lon: -106.1497, country: 'US', region: 'Colorado', website: 'https://www.coppercolorado.com', osm_id: 'osm_copper' },
  { name: 'Winter Park', lat: 39.8841, lon: -105.7625, country: 'US', region: 'Colorado', website: 'https://www.winterparkresort.com', osm_id: 'osm_winterpark' },
  { name: 'Keystone', lat: 39.6045, lon: -105.9497, country: 'US', region: 'Colorado', website: 'https://www.keystoneresort.com', osm_id: 'osm_keystone' },
  { name: 'Crested Butte', lat: 38.8988, lon: -106.9650, country: 'US', region: 'Colorado', website: 'https://www.skicb.com', osm_id: 'osm_crestedbutte' },
  { name: 'Arapahoe Basin', lat: 39.6426, lon: -105.8718, country: 'US', region: 'Colorado', website: 'https://www.arapahoebasin.com', osm_id: 'osm_abasin' },
  { name: 'Snowmass', lat: 39.2131, lon: -106.9458, country: 'US', region: 'Colorado', website: 'https://www.aspensnowmass.com', osm_id: 'osm_snowmass' },
  { name: 'Squaw Creek (Palisades)', lat: 39.1942, lon: -120.2430, country: 'US', region: 'California', website: 'https://www.palisadestahoe.com', osm_id: 'osm_squawcreek' },
  { name: 'Northstar', lat: 39.2746, lon: -120.1210, country: 'US', region: 'California', website: 'https://www.northstarcalifornia.com', osm_id: 'osm_northstar' },
  { name: 'Kirkwood', lat: 38.6850, lon: -120.0653, country: 'US', region: 'California', website: 'https://www.kirkwood.com', osm_id: 'osm_kirkwood' },
  { name: 'Sugar Bowl', lat: 39.3046, lon: -120.3327, country: 'US', region: 'California', website: 'https://www.sugarbowl.com', osm_id: 'osm_sugarbowl' },
  { name: 'Mt. Bachelor', lat: 43.9792, lon: -121.6886, country: 'US', region: 'Oregon', website: 'https://www.mtbachelor.com', osm_id: 'osm_mtbachelor' },
  { name: 'Crystal Mountain', lat: 46.9350, lon: -121.5045, country: 'US', region: 'Washington', website: 'https://www.crystalmountainresort.com', osm_id: 'osm_crystalmtn' },
  { name: 'Stevens Pass', lat: 47.7453, lon: -121.0890, country: 'US', region: 'Washington', website: 'https://www.stevenspass.com', osm_id: 'osm_stevenspass' },
  { name: 'Whitefish Mountain', lat: 48.4816, lon: -114.3538, country: 'US', region: 'Montana', website: 'https://skiwhitefish.com', osm_id: 'osm_whitefish' },
  { name: 'Bridger Bowl', lat: 45.8168, lon: -110.8975, country: 'US', region: 'Montana', website: 'https://www.bridgerbowl.com', osm_id: 'osm_bridgerbowl' },
  { name: 'Sugarbush', lat: 44.1360, lon: -72.9012, country: 'US', region: 'Vermont', website: 'https://www.sugarbush.com', osm_id: 'osm_sugarbush' },
  { name: 'Jay Peak', lat: 44.9260, lon: -72.5276, country: 'US', region: 'Vermont', website: 'https://www.jaypeakresort.com', osm_id: 'osm_jaypeak' },
  { name: 'Sunday River', lat: 44.4734, lon: -70.8567, country: 'US', region: 'Maine', website: 'https://www.sundayriver.com', osm_id: 'osm_sundayriver' },
  { name: 'Sugarloaf', lat: 45.0314, lon: -70.3131, country: 'US', region: 'Maine', website: 'https://www.sugarloaf.com', osm_id: 'osm_sugarloaf' },
  { name: 'Whiteface Mountain', lat: 44.3655, lon: -73.9026, country: 'US', region: 'New York', website: 'https://www.whiteface.com', osm_id: 'osm_whiteface' },
  { name: 'Gore Mountain', lat: 43.6724, lon: -74.0063, country: 'US', region: 'New York', website: 'https://www.goremountain.com', osm_id: 'osm_goremtn' },

  // --- More Canada ---
  { name: 'Big White', lat: 49.7226, lon: -118.9326, country: 'CA', region: 'British Columbia', website: 'https://www.bigwhite.com', osm_id: 'osm_bigwhite' },
  { name: 'Sun Peaks', lat: 50.8837, lon: -119.9000, country: 'CA', region: 'British Columbia', website: 'https://www.sunpeaksresort.com', osm_id: 'osm_sunpeaks' },
  { name: 'Fernie', lat: 49.4627, lon: -115.0894, country: 'CA', region: 'British Columbia', website: 'https://skifernie.com', osm_id: 'osm_fernie' },
  { name: 'Kicking Horse', lat: 51.2970, lon: -117.0481, country: 'CA', region: 'British Columbia', website: 'https://kickinghorseresort.com', osm_id: 'osm_kickinghorse' },
  { name: 'Marmot Basin', lat: 52.8052, lon: -118.0835, country: 'CA', region: 'Alberta', website: 'https://www.skimarmot.com', osm_id: 'osm_marmot' },
  { name: 'Tremblant', lat: 46.2113, lon: -74.5856, country: 'CA', region: 'Quebec', website: 'https://www.tremblant.ca', osm_id: 'osm_tremblant2' },
  { name: 'Le Massif de Charlevoix', lat: 47.2788, lon: -70.6316, country: 'CA', region: 'Quebec', website: 'https://www.lemassif.com', osm_id: 'osm_lemassif' },
];

async function seed() {
  initDb();
  const db = getDb();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO resorts (name, lat, lon, country, region, website, osm_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((resorts) => {
    for (const r of resorts) {
      insert.run(r.name, r.lat, r.lon, r.country, r.region, r.website, r.osm_id);
    }
  });

  insertMany(SEED_RESORTS);

  const count = db.prepare('SELECT COUNT(*) as count FROM resorts').get();
  console.log(`Seeded ${count.count} ski resorts.`);
}

seed();
