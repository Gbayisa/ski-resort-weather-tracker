import { getDb, initDb } from '../db/database.js';

/**
 * Seed script: populates the resorts table with a curated set of well-known
 * ski resorts worldwide. In production this would be refreshed from
 * OpenStreetMap Overpass API using winter_sports tags.
 *
 * Data sourced/inspired by OpenStreetMap (© OpenStreetMap contributors).
 */
const SEED_RESORTS = [
  // --- USA: Rocky Mountains ---
  { name: 'Vail', lat: 39.6403, lon: -106.3742, country: 'US', region: 'Colorado', website: 'https://www.vail.com', osm_id: 'osm_vail', elevation_base: 2475, elevation_peak: 3527 },
  { name: 'Aspen Snowmass', lat: 39.2084, lon: -106.9490, country: 'US', region: 'Colorado', website: 'https://www.aspensnowmass.com', osm_id: 'osm_aspen', elevation_base: 2473, elevation_peak: 3813 },
  { name: 'Breckenridge', lat: 39.4817, lon: -106.0384, country: 'US', region: 'Colorado', website: 'https://www.breckenridge.com', osm_id: 'osm_breckenridge', elevation_base: 2926, elevation_peak: 3914 },
  { name: 'Steamboat Springs', lat: 40.4572, lon: -106.8045, country: 'US', region: 'Colorado', website: 'https://www.steamboat.com', osm_id: 'osm_steamboat', elevation_base: 2103, elevation_peak: 3221 },
  { name: 'Telluride', lat: 37.9375, lon: -107.8123, country: 'US', region: 'Colorado', website: 'https://tellurideskiresort.com', osm_id: 'osm_telluride', elevation_base: 2659, elevation_peak: 4010 },
  { name: 'Copper Mountain', lat: 39.5022, lon: -106.1497, country: 'US', region: 'Colorado', website: 'https://www.coppercolorado.com', osm_id: 'osm_copper', elevation_base: 2926, elevation_peak: 3753 },
  { name: 'Winter Park', lat: 39.8841, lon: -105.7625, country: 'US', region: 'Colorado', website: 'https://www.winterparkresort.com', osm_id: 'osm_winterpark', elevation_base: 2743, elevation_peak: 3676 },
  { name: 'Keystone', lat: 39.6045, lon: -105.9497, country: 'US', region: 'Colorado', website: 'https://www.keystoneresort.com', osm_id: 'osm_keystone', elevation_base: 2835, elevation_peak: 3651 },
  { name: 'Crested Butte', lat: 38.8988, lon: -106.9650, country: 'US', region: 'Colorado', website: 'https://www.skicb.com', osm_id: 'osm_crestedbutte', elevation_base: 2858, elevation_peak: 3708 },
  { name: 'Arapahoe Basin', lat: 39.6426, lon: -105.8718, country: 'US', region: 'Colorado', website: 'https://www.arapahoebasin.com', osm_id: 'osm_abasin', elevation_base: 3286, elevation_peak: 3978 },
  { name: 'Snowmass', lat: 39.2131, lon: -106.9458, country: 'US', region: 'Colorado', website: 'https://www.aspensnowmass.com', osm_id: 'osm_snowmass', elevation_base: 2473, elevation_peak: 3813 },
  { name: 'Loveland', lat: 39.6808, lon: -105.8977, country: 'US', region: 'Colorado', website: 'https://skiloveland.com', osm_id: 'osm_loveland', elevation_base: 3225, elevation_peak: 3871 },
  { name: 'Wolf Creek', lat: 37.4731, lon: -106.7952, country: 'US', region: 'Colorado', website: 'https://wolfcreekski.com', osm_id: 'osm_wolfcreek', elevation_base: 3107, elevation_peak: 3628 },
  { name: 'Monarch Mountain', lat: 38.5040, lon: -106.3298, country: 'US', region: 'Colorado', website: 'https://www.skimonarch.com', osm_id: 'osm_monarch', elevation_base: 3170, elevation_peak: 3668 },

  // --- USA: Utah ---
  { name: 'Park City', lat: 40.6461, lon: -111.4980, country: 'US', region: 'Utah', website: 'https://www.parkcitymountain.com', osm_id: 'osm_parkcity', elevation_base: 2080, elevation_peak: 3049 },
  { name: 'Snowbird', lat: 40.5830, lon: -111.6538, country: 'US', region: 'Utah', website: 'https://www.snowbird.com', osm_id: 'osm_snowbird', elevation_base: 2365, elevation_peak: 3353 },
  { name: 'Alta', lat: 40.5884, lon: -111.6386, country: 'US', region: 'Utah', website: 'https://www.alta.com', osm_id: 'osm_alta', elevation_base: 2600, elevation_peak: 3216 },
  { name: 'Deer Valley', lat: 40.6374, lon: -111.4783, country: 'US', region: 'Utah', website: 'https://www.deervalley.com', osm_id: 'osm_deervalley', elevation_base: 2003, elevation_peak: 2917 },
  { name: 'Brighton', lat: 40.5980, lon: -111.5833, country: 'US', region: 'Utah', website: 'https://www.brightonresort.com', osm_id: 'osm_brighton', elevation_base: 2669, elevation_peak: 3261 },
  { name: 'Solitude', lat: 40.6199, lon: -111.5916, country: 'US', region: 'Utah', website: 'https://www.solitudemountain.com', osm_id: 'osm_solitude', elevation_base: 2439, elevation_peak: 3048 },
  { name: 'Sundance', lat: 40.3927, lon: -111.5888, country: 'US', region: 'Utah', website: 'https://www.sundanceresort.com', osm_id: 'osm_sundance', elevation_base: 1859, elevation_peak: 2512 },
  { name: 'Brian Head', lat: 37.6933, lon: -112.8518, country: 'US', region: 'Utah', website: 'https://www.brianhead.com', osm_id: 'osm_brianhead', elevation_base: 2926, elevation_peak: 3307 },

  // --- USA: Wyoming & Montana ---
  { name: 'Jackson Hole', lat: 43.5877, lon: -110.8279, country: 'US', region: 'Wyoming', website: 'https://www.jacksonhole.com', osm_id: 'osm_jacksonhole', elevation_base: 1924, elevation_peak: 3185 },
  { name: 'Grand Targhee', lat: 43.7871, lon: -110.9396, country: 'US', region: 'Wyoming', website: 'https://www.grandtarghee.com', osm_id: 'osm_grandtarghee', elevation_base: 2311, elevation_peak: 3048 },
  { name: 'Big Sky', lat: 45.2862, lon: -111.4013, country: 'US', region: 'Montana', website: 'https://bigskyresort.com', osm_id: 'osm_bigsky', elevation_base: 2072, elevation_peak: 3403 },
  { name: 'Whitefish Mountain', lat: 48.4816, lon: -114.3538, country: 'US', region: 'Montana', website: 'https://skiwhitefish.com', osm_id: 'osm_whitefish', elevation_base: 1300, elevation_peak: 2073 },
  { name: 'Bridger Bowl', lat: 45.8168, lon: -110.8975, country: 'US', region: 'Montana', website: 'https://www.bridgerbowl.com', osm_id: 'osm_bridgerbowl', elevation_base: 1859, elevation_peak: 2651 },
  { name: 'Red Lodge Mountain', lat: 45.1901, lon: -109.3113, country: 'US', region: 'Montana', website: 'https://www.redlodgemountain.com', osm_id: 'osm_redlodge', elevation_base: 2196, elevation_peak: 2790 },

  // --- USA: Idaho & Nevada ---
  { name: 'Sun Valley', lat: 43.6975, lon: -114.3514, country: 'US', region: 'Idaho', website: 'https://www.sunvalley.com', osm_id: 'osm_sunvalley', elevation_base: 1752, elevation_peak: 2789 },
  { name: 'Bogus Basin', lat: 43.7645, lon: -116.1021, country: 'US', region: 'Idaho', website: 'https://bogusbasin.org', osm_id: 'osm_bogusbasin', elevation_base: 1676, elevation_peak: 2286 },
  { name: 'Schweitzer', lat: 48.3701, lon: -116.6230, country: 'US', region: 'Idaho', website: 'https://www.schweitzer.com', osm_id: 'osm_schweitzer', elevation_base: 1219, elevation_peak: 1920 },
  { name: 'Tamarack', lat: 44.6872, lon: -116.0910, country: 'US', region: 'Idaho', website: 'https://www.tamarackidaho.com', osm_id: 'osm_tamarack', elevation_base: 1524, elevation_peak: 2311 },
  { name: 'Diamond Peak', lat: 39.2590, lon: -119.9340, country: 'US', region: 'Nevada', website: 'https://www.diamondpeak.com', osm_id: 'osm_diamondpeak', elevation_base: 2012, elevation_peak: 2700 },

  // --- USA: New Mexico & Arizona ---
  { name: 'Taos Ski Valley', lat: 36.5961, lon: -105.4546, country: 'US', region: 'New Mexico', website: 'https://www.skitaos.com', osm_id: 'osm_taos', elevation_base: 2804, elevation_peak: 3804 },
  { name: 'Ski Santa Fe', lat: 35.7877, lon: -105.8277, country: 'US', region: 'New Mexico', website: 'https://www.skisantafe.com', osm_id: 'osm_skisantafe', elevation_base: 3141, elevation_peak: 3683 },
  { name: 'Ski Apache', lat: 33.3893, lon: -105.7871, country: 'US', region: 'New Mexico', website: 'https://www.skiapache.com', osm_id: 'osm_skiapache', elevation_base: 2835, elevation_peak: 3505 },
  { name: 'Arizona Snowbowl', lat: 35.3298, lon: -111.7129, country: 'US', region: 'Arizona', website: 'https://www.arizonasnowbowl.com', osm_id: 'osm_azsnowbowl', elevation_base: 2798, elevation_peak: 3505 },

  // --- USA: California ---
  { name: 'Mammoth Mountain', lat: 37.6308, lon: -119.0326, country: 'US', region: 'California', website: 'https://www.mammothmountain.com', osm_id: 'osm_mammoth', elevation_base: 2424, elevation_peak: 3369 },
  { name: 'Palisades Tahoe', lat: 39.1968, lon: -120.2354, country: 'US', region: 'California', website: 'https://www.palisadestahoe.com', osm_id: 'osm_palisades', elevation_base: 1890, elevation_peak: 2760 },
  { name: 'Heavenly', lat: 38.9353, lon: -119.9400, country: 'US', region: 'California', website: 'https://www.skiheavenly.com', osm_id: 'osm_heavenly', elevation_base: 1995, elevation_peak: 3060 },
  { name: 'Northstar', lat: 39.2746, lon: -120.1210, country: 'US', region: 'California', website: 'https://www.northstarcalifornia.com', osm_id: 'osm_northstar', elevation_base: 1929, elevation_peak: 2624 },
  { name: 'Kirkwood', lat: 38.6850, lon: -120.0653, country: 'US', region: 'California', website: 'https://www.kirkwood.com', osm_id: 'osm_kirkwood', elevation_base: 2377, elevation_peak: 2987 },
  { name: 'Sugar Bowl', lat: 39.3046, lon: -120.3327, country: 'US', region: 'California', website: 'https://www.sugarbowl.com', osm_id: 'osm_sugarbowl', elevation_base: 2042, elevation_peak: 2612 },
  { name: 'Bear Valley', lat: 38.4671, lon: -120.0459, country: 'US', region: 'California', website: 'https://www.bearvalley.com', osm_id: 'osm_bearvalley', elevation_base: 2073, elevation_peak: 2637 },
  { name: 'Mt. Shasta Ski Park', lat: 41.3727, lon: -122.1928, country: 'US', region: 'California', website: 'https://www.skipark.com', osm_id: 'osm_mtshastaski', elevation_base: 1676, elevation_peak: 1951 },
  { name: 'Mountain High', lat: 34.3836, lon: -117.6436, country: 'US', region: 'California', website: 'https://www.mthigh.com', osm_id: 'osm_mtnhigh', elevation_base: 2050, elevation_peak: 2438 },
  { name: 'Big Bear Mountain', lat: 34.2346, lon: -116.8910, country: 'US', region: 'California', website: 'https://www.bigbearmountainresort.com', osm_id: 'osm_bigbear', elevation_base: 2134, elevation_peak: 2591 },

  // --- USA: Pacific Northwest ---
  { name: 'Mt. Bachelor', lat: 43.9792, lon: -121.6886, country: 'US', region: 'Oregon', website: 'https://www.mtbachelor.com', osm_id: 'osm_mtbachelor', elevation_base: 1775, elevation_peak: 2764 },
  { name: 'Mt. Hood Meadows', lat: 45.3288, lon: -121.6642, country: 'US', region: 'Oregon', website: 'https://www.skihood.com', osm_id: 'osm_mthoodmeadows', elevation_base: 1341, elevation_peak: 2225 },
  { name: 'Timberline Lodge', lat: 45.3311, lon: -121.7108, country: 'US', region: 'Oregon', website: 'https://www.timberlinelodge.com', osm_id: 'osm_timberline', elevation_base: 1524, elevation_peak: 2603 },
  { name: 'Hoodoo', lat: 44.4071, lon: -121.8656, country: 'US', region: 'Oregon', website: 'https://www.hoodoo.com', osm_id: 'osm_hoodoo', elevation_base: 1478, elevation_peak: 1689 },
  { name: 'Crystal Mountain', lat: 46.9350, lon: -121.5045, country: 'US', region: 'Washington', website: 'https://www.crystalmountainresort.com', osm_id: 'osm_crystalmtn', elevation_base: 1341, elevation_peak: 2134 },
  { name: 'Stevens Pass', lat: 47.7453, lon: -121.0890, country: 'US', region: 'Washington', website: 'https://www.stevenspass.com', osm_id: 'osm_stevenspass', elevation_base: 1231, elevation_peak: 1762 },
  { name: 'The Summit at Snoqualmie', lat: 47.4038, lon: -121.4138, country: 'US', region: 'Washington', website: 'https://www.summitatsnoqualmie.com', osm_id: 'osm_snoqualmie', elevation_base: 921, elevation_peak: 1524 },
  { name: 'Mission Ridge', lat: 47.2897, lon: -120.3994, country: 'US', region: 'Washington', website: 'https://www.missionridge.com', osm_id: 'osm_missionridge', elevation_base: 1400, elevation_peak: 2073 },
  { name: 'Mt. Baker', lat: 48.8614, lon: -121.6676, country: 'US', region: 'Washington', website: 'https://www.mtbaker.us', osm_id: 'osm_mtbaker', elevation_base: 1067, elevation_peak: 1524 },
  { name: 'Lookout Pass', lat: 47.4623, lon: -115.7012, country: 'US', region: 'Idaho', website: 'https://www.skilookout.com', osm_id: 'osm_lookoutpass', elevation_base: 1341, elevation_peak: 1737 },

  // --- USA: Vermont ---
  { name: 'Killington', lat: 43.6045, lon: -72.8201, country: 'US', region: 'Vermont', website: 'https://www.killington.com', osm_id: 'osm_killington', elevation_base: 325, elevation_peak: 1293 },
  { name: 'Stowe', lat: 44.5303, lon: -72.7814, country: 'US', region: 'Vermont', website: 'https://www.stowe.com', osm_id: 'osm_stowe', elevation_base: 390, elevation_peak: 1339 },
  { name: 'Sugarbush', lat: 44.1360, lon: -72.9012, country: 'US', region: 'Vermont', website: 'https://www.sugarbush.com', osm_id: 'osm_sugarbush', elevation_base: 427, elevation_peak: 1244 },
  { name: 'Jay Peak', lat: 44.9260, lon: -72.5276, country: 'US', region: 'Vermont', website: 'https://www.jaypeakresort.com', osm_id: 'osm_jaypeak', elevation_base: 549, elevation_peak: 1175 },
  { name: 'Mad River Glen', lat: 44.1835, lon: -72.8901, country: 'US', region: 'Vermont', website: 'https://www.madriverglen.com', osm_id: 'osm_madriverglen', elevation_base: 488, elevation_peak: 1074 },
  { name: 'Bolton Valley', lat: 44.4100, lon: -72.8594, country: 'US', region: 'Vermont', website: 'https://www.boltonvalley.com', osm_id: 'osm_boltonvalley', elevation_base: 610, elevation_peak: 975 },
  { name: 'Okemo', lat: 43.4005, lon: -72.7272, country: 'US', region: 'Vermont', website: 'https://www.okemo.com', osm_id: 'osm_okemo', elevation_base: 366, elevation_peak: 975 },

  // --- USA: New England ---
  { name: 'Sunday River', lat: 44.4734, lon: -70.8567, country: 'US', region: 'Maine', website: 'https://www.sundayriver.com', osm_id: 'osm_sundayriver', elevation_base: 244, elevation_peak: 953 },
  { name: 'Sugarloaf', lat: 45.0314, lon: -70.3131, country: 'US', region: 'Maine', website: 'https://www.sugarloaf.com', osm_id: 'osm_sugarloaf', elevation_base: 364, elevation_peak: 1292 },
  { name: 'Saddleback Mountain', lat: 44.8826, lon: -70.5145, country: 'US', region: 'Maine', website: 'https://www.saddlebackmaine.com', osm_id: 'osm_saddleback', elevation_base: 610, elevation_peak: 1253 },
  { name: 'Bretton Woods', lat: 44.2613, lon: -71.4442, country: 'US', region: 'New Hampshire', website: 'https://www.brettonwoods.com', osm_id: 'osm_brettonwoods', elevation_base: 457, elevation_peak: 933 },
  { name: 'Loon Mountain', lat: 44.0394, lon: -71.6260, country: 'US', region: 'New Hampshire', website: 'https://www.loonmtn.com', osm_id: 'osm_loon', elevation_base: 298, elevation_peak: 939 },
  { name: 'Cannon Mountain', lat: 44.1578, lon: -71.6975, country: 'US', region: 'New Hampshire', website: 'https://www.cannonmt.com', osm_id: 'osm_cannonmt', elevation_base: 594, elevation_peak: 1236 },
  { name: 'Waterville Valley', lat: 43.9676, lon: -71.5022, country: 'US', region: 'New Hampshire', website: 'https://www.waterville.com', osm_id: 'osm_watervillevalley', elevation_base: 564, elevation_peak: 1220 },
  { name: 'Wildcat Mountain', lat: 44.2566, lon: -71.2411, country: 'US', region: 'New Hampshire', website: 'https://www.skiwildcat.com', osm_id: 'osm_wildcatmt', elevation_base: 610, elevation_peak: 1348 },

  // --- USA: New York & Mid-Atlantic ---
  { name: 'Whiteface Mountain', lat: 44.3655, lon: -73.9026, country: 'US', region: 'New York', website: 'https://www.whiteface.com', osm_id: 'osm_whiteface', elevation_base: 373, elevation_peak: 1483 },
  { name: 'Gore Mountain', lat: 43.6724, lon: -74.0063, country: 'US', region: 'New York', website: 'https://www.goremountain.com', osm_id: 'osm_goremtn', elevation_base: 457, elevation_peak: 1097 },
  { name: 'Hunter Mountain', lat: 42.1765, lon: -74.2264, country: 'US', region: 'New York', website: 'https://www.huntermtn.com', osm_id: 'osm_huntermtn', elevation_base: 457, elevation_peak: 975 },
  { name: 'Windham Mountain', lat: 42.2930, lon: -74.2595, country: 'US', region: 'New York', website: 'https://windhammountain.com', osm_id: 'osm_windham', elevation_base: 457, elevation_peak: 1006 },
  { name: 'Seven Springs', lat: 40.0160, lon: -79.2934, country: 'US', region: 'Pennsylvania', website: 'https://www.7springs.com', osm_id: 'osm_7springs', elevation_base: 610, elevation_peak: 899 },
  { name: 'Snowshoe Mountain', lat: 38.4022, lon: -79.9914, country: 'US', region: 'West Virginia', website: 'https://www.snowshoemtn.com', osm_id: 'osm_snowshoe', elevation_base: 1371, elevation_peak: 1482 },

  // --- USA: Midwest ---
  { name: 'Lutsen Mountains', lat: 47.6492, lon: -90.6887, country: 'US', region: 'Minnesota', website: 'https://www.lutsen.com', osm_id: 'osm_lutsen', elevation_base: 221, elevation_peak: 552 },
  { name: 'Mount Bohemia', lat: 47.3895, lon: -88.3980, country: 'US', region: 'Michigan', website: 'https://www.mtbohemia.com', osm_id: 'osm_mtbohemia', elevation_base: 335, elevation_peak: 500 },

  // --- Canada: British Columbia ---
  { name: 'Whistler Blackcomb', lat: 50.1163, lon: -122.9574, country: 'CA', region: 'British Columbia', website: 'https://www.whistlerblackcomb.com', osm_id: 'osm_whistler', elevation_base: 653, elevation_peak: 2284 },
  { name: 'Revelstoke', lat: 51.0014, lon: -118.1644, country: 'CA', region: 'British Columbia', website: 'https://www.revelstokemountainresort.com', osm_id: 'osm_revelstoke', elevation_base: 512, elevation_peak: 2225 },
  { name: 'Big White', lat: 49.7226, lon: -118.9326, country: 'CA', region: 'British Columbia', website: 'https://www.bigwhite.com', osm_id: 'osm_bigwhite', elevation_base: 1508, elevation_peak: 2319 },
  { name: 'Sun Peaks', lat: 50.8837, lon: -119.9000, country: 'CA', region: 'British Columbia', website: 'https://www.sunpeaksresort.com', osm_id: 'osm_sunpeaks', elevation_base: 1200, elevation_peak: 2152 },
  { name: 'Fernie Alpine Resort', lat: 49.4627, lon: -115.0894, country: 'CA', region: 'British Columbia', website: 'https://skifernie.com', osm_id: 'osm_fernie', elevation_base: 1052, elevation_peak: 2134 },
  { name: 'Kicking Horse', lat: 51.2970, lon: -117.0481, country: 'CA', region: 'British Columbia', website: 'https://kickinghorseresort.com', osm_id: 'osm_kickinghorse', elevation_base: 1190, elevation_peak: 2450 },
  { name: 'Silver Star', lat: 50.3587, lon: -119.0618, country: 'CA', region: 'British Columbia', website: 'https://www.skisilverstar.com', osm_id: 'osm_silverstar', elevation_base: 1155, elevation_peak: 1915 },
  { name: 'Red Mountain', lat: 49.1039, lon: -117.8218, country: 'CA', region: 'British Columbia', website: 'https://www.redresort.com', osm_id: 'osm_redmtn', elevation_base: 1030, elevation_peak: 2075 },
  { name: 'Apex Mountain', lat: 49.4049, lon: -119.8907, country: 'CA', region: 'British Columbia', website: 'https://www.apexresort.com', osm_id: 'osm_apexmtn', elevation_base: 1580, elevation_peak: 2182 },
  { name: 'Cypress Mountain', lat: 49.3954, lon: -123.2023, country: 'CA', region: 'British Columbia', website: 'https://www.cypressmountain.com', osm_id: 'osm_cypressmtn', elevation_base: 910, elevation_peak: 1440 },
  { name: 'Grouse Mountain', lat: 49.3726, lon: -123.0822, country: 'CA', region: 'British Columbia', website: 'https://www.grousemountain.com', osm_id: 'osm_grousemtn', elevation_base: 274, elevation_peak: 1231 },

  // --- Canada: Alberta ---
  { name: 'Banff Sunshine', lat: 51.0784, lon: -115.7731, country: 'CA', region: 'Alberta', website: 'https://www.skibanff.com', osm_id: 'osm_banffsunshine', elevation_base: 1660, elevation_peak: 2730 },
  { name: 'Lake Louise', lat: 51.4254, lon: -116.1773, country: 'CA', region: 'Alberta', website: 'https://www.skilouise.com', osm_id: 'osm_lakelouise', elevation_base: 1645, elevation_peak: 2637 },
  { name: 'Marmot Basin', lat: 52.8052, lon: -118.0835, country: 'CA', region: 'Alberta', website: 'https://www.skimarmot.com', osm_id: 'osm_marmot', elevation_base: 1698, elevation_peak: 2612 },
  { name: 'Castle Mountain', lat: 49.3220, lon: -114.4042, country: 'CA', region: 'Alberta', website: 'https://www.skicastle.ca', osm_id: 'osm_castlemtn', elevation_base: 1410, elevation_peak: 2270 },

  // --- Canada: Quebec & Eastern Canada ---
  { name: 'Mont-Tremblant', lat: 46.2094, lon: -74.5850, country: 'CA', region: 'Quebec', website: 'https://www.tremblant.ca', osm_id: 'osm_tremblant', elevation_base: 230, elevation_peak: 875 },
  { name: 'Le Massif de Charlevoix', lat: 47.2788, lon: -70.6316, country: 'CA', region: 'Quebec', website: 'https://www.lemassif.com', osm_id: 'osm_lemassif', elevation_base: 50, elevation_peak: 806 },
  { name: 'Mont Saint-Anne', lat: 47.0819, lon: -70.9090, country: 'CA', region: 'Quebec', website: 'https://www.mont-sainte-anne.com', osm_id: 'osm_montsainteanne', elevation_base: 175, elevation_peak: 800 },
  { name: 'Stoneham', lat: 47.1689, lon: -71.3524, country: 'CA', region: 'Quebec', website: 'https://www.ski-stoneham.com', osm_id: 'osm_stoneham', elevation_base: 200, elevation_peak: 632 },

  // --- France ---
  { name: 'Chamonix', lat: 45.9237, lon: 6.8694, country: 'FR', region: 'Haute-Savoie', website: 'https://www.chamonix.com', osm_id: 'osm_chamonix', elevation_base: 1035, elevation_peak: 3842 },
  { name: 'Val d\'Isère', lat: 45.4485, lon: 6.9806, country: 'FR', region: 'Savoie', website: 'https://www.valdisere.com', osm_id: 'osm_valdisere', elevation_base: 1785, elevation_peak: 3456 },
  { name: 'Courchevel', lat: 45.4153, lon: 6.6347, country: 'FR', region: 'Savoie', website: 'https://www.courchevel.com', osm_id: 'osm_courchevel', elevation_base: 1300, elevation_peak: 2738 },
  { name: 'Les Deux Alpes', lat: 45.0170, lon: 6.1225, country: 'FR', region: 'Isère', website: 'https://www.les2alpes.com', osm_id: 'osm_les2alpes', elevation_base: 1300, elevation_peak: 3568 },
  { name: 'Méribel', lat: 45.3970, lon: 6.5660, country: 'FR', region: 'Savoie', website: 'https://www.meribel.net', osm_id: 'osm_meribel', elevation_base: 1400, elevation_peak: 2952 },
  { name: 'Tignes', lat: 45.4680, lon: 6.9049, country: 'FR', region: 'Savoie', website: 'https://www.tignes.net', osm_id: 'osm_tignes', elevation_base: 1550, elevation_peak: 3456 },
  { name: 'Alpe d\'Huez', lat: 45.0922, lon: 6.0699, country: 'FR', region: 'Isère', website: 'https://www.alpedhuez.com', osm_id: 'osm_alpedhuez', elevation_base: 1250, elevation_peak: 3330 },
  { name: 'La Plagne', lat: 45.5085, lon: 6.6751, country: 'FR', region: 'Savoie', website: 'https://www.la-plagne.com', osm_id: 'osm_laplagne', elevation_base: 1250, elevation_peak: 3250 },
  { name: 'Les Arcs', lat: 45.5692, lon: 6.8002, country: 'FR', region: 'Savoie', website: 'https://www.lesarcs.com', osm_id: 'osm_lesarcs', elevation_base: 1200, elevation_peak: 3226 },
  { name: 'Morzine', lat: 46.1778, lon: 6.7092, country: 'FR', region: 'Haute-Savoie', website: 'https://www.morzine-avoriaz.com', osm_id: 'osm_morzine', elevation_base: 1000, elevation_peak: 2460 },
  { name: 'Avoriaz', lat: 46.1942, lon: 6.7694, country: 'FR', region: 'Haute-Savoie', website: 'https://www.avoriaz.com', osm_id: 'osm_avoriaz', elevation_base: 1800, elevation_peak: 2466 },
  { name: 'Megève', lat: 45.8564, lon: 6.6172, country: 'FR', region: 'Haute-Savoie', website: 'https://www.megeve.com', osm_id: 'osm_megeve', elevation_base: 1113, elevation_peak: 2353 },
  { name: 'Flaine', lat: 46.0059, lon: 6.6869, country: 'FR', region: 'Haute-Savoie', website: 'https://www.flaine.com', osm_id: 'osm_flaine', elevation_base: 1600, elevation_peak: 2500 },
  { name: 'La Clusaz', lat: 45.9063, lon: 6.4228, country: 'FR', region: 'Haute-Savoie', website: 'https://www.laclusaz.com', osm_id: 'osm_laclusaz', elevation_base: 1100, elevation_peak: 2616 },
  { name: 'Les Gets', lat: 46.1583, lon: 6.6678, country: 'FR', region: 'Haute-Savoie', website: 'https://www.lesgets.com', osm_id: 'osm_lesgets', elevation_base: 1172, elevation_peak: 2002 },
  { name: 'Vars', lat: 44.5577, lon: 6.6993, country: 'FR', region: 'Hautes-Alpes', website: 'https://www.vars-ski.com', osm_id: 'osm_vars', elevation_base: 1650, elevation_peak: 2750 },
  { name: 'Font Romeu', lat: 42.5066, lon: 2.0388, country: 'FR', region: 'Pyrénées-Orientales', website: 'https://www.fontromeu.fr', osm_id: 'osm_fontromeu', elevation_base: 1700, elevation_peak: 2213 },

  // --- Switzerland ---
  { name: 'Zermatt', lat: 46.0207, lon: 7.7491, country: 'CH', region: 'Valais', website: 'https://www.zermatt.ch', osm_id: 'osm_zermatt', elevation_base: 1620, elevation_peak: 3883 },
  { name: 'St. Moritz', lat: 46.4908, lon: 9.8355, country: 'CH', region: 'Graubünden', website: 'https://www.stmoritz.com', osm_id: 'osm_stmoritz', elevation_base: 1822, elevation_peak: 3303 },
  { name: 'Verbier', lat: 46.0964, lon: 7.2283, country: 'CH', region: 'Valais', website: 'https://www.verbier.ch', osm_id: 'osm_verbier', elevation_base: 1500, elevation_peak: 3330 },
  { name: 'Davos Klosters', lat: 46.8027, lon: 9.8360, country: 'CH', region: 'Graubünden', website: 'https://www.davos.ch', osm_id: 'osm_davos', elevation_base: 1560, elevation_peak: 2844 },
  { name: 'Grindelwald', lat: 46.6241, lon: 8.0411, country: 'CH', region: 'Bern', website: 'https://www.grindelwald.ch', osm_id: 'osm_grindelwald', elevation_base: 944, elevation_peak: 2971 },
  { name: 'Wengen', lat: 46.6082, lon: 7.9218, country: 'CH', region: 'Bern', website: 'https://www.wengen.ch', osm_id: 'osm_wengen', elevation_base: 1274, elevation_peak: 2971 },
  { name: 'Mürren', lat: 46.5588, lon: 7.8928, country: 'CH', region: 'Bern', website: 'https://www.muerren.ch', osm_id: 'osm_murren', elevation_base: 1638, elevation_peak: 2971 },
  { name: 'Saas-Fee', lat: 46.1045, lon: 7.9288, country: 'CH', region: 'Valais', website: 'https://www.saas-fee.ch', osm_id: 'osm_saasfee', elevation_base: 1800, elevation_peak: 3600 },
  { name: 'Engelberg', lat: 46.8218, lon: 8.4078, country: 'CH', region: 'Obwalden', website: 'https://www.engelberg.ch', osm_id: 'osm_engelberg', elevation_base: 1050, elevation_peak: 3028 },
  { name: 'Flims Laax', lat: 46.8363, lon: 9.2836, country: 'CH', region: 'Graubünden', website: 'https://www.laax.com', osm_id: 'osm_flimslaax', elevation_base: 1100, elevation_peak: 3018 },
  { name: 'Crans-Montana', lat: 46.3090, lon: 7.4769, country: 'CH', region: 'Valais', website: 'https://www.crans-montana.ch', osm_id: 'osm_cransmontana', elevation_base: 1500, elevation_peak: 3000 },
  { name: 'Nendaz', lat: 46.1912, lon: 7.2862, country: 'CH', region: 'Valais', website: 'https://www.nendaz.ch', osm_id: 'osm_nendaz', elevation_base: 1400, elevation_peak: 3330 },
  { name: 'Arosa', lat: 46.7834, lon: 9.6768, country: 'CH', region: 'Graubünden', website: 'https://www.arosa.ch', osm_id: 'osm_arosa', elevation_base: 1775, elevation_peak: 2653 },
  { name: 'Gstaad', lat: 46.4753, lon: 7.2869, country: 'CH', region: 'Bern', website: 'https://www.gstaad.ch', osm_id: 'osm_gstaad', elevation_base: 1050, elevation_peak: 2156 },

  // --- Austria ---
  { name: 'St. Anton am Arlberg', lat: 47.1292, lon: 10.2683, country: 'AT', region: 'Tyrol', website: 'https://www.stantonamarlberg.com', osm_id: 'osm_stanton', elevation_base: 1304, elevation_peak: 2811 },
  { name: 'Kitzbühel', lat: 47.4559, lon: 12.3927, country: 'AT', region: 'Tyrol', website: 'https://www.kitzbuehel.com', osm_id: 'osm_kitzbuhel', elevation_base: 800, elevation_peak: 2000 },
  { name: 'Innsbruck Nordkette', lat: 47.3070, lon: 11.3884, country: 'AT', region: 'Tyrol', website: 'https://www.nordkette.com', osm_id: 'osm_nordkette', elevation_base: 860, elevation_peak: 2334 },
  { name: 'Sölden', lat: 46.9656, lon: 10.8760, country: 'AT', region: 'Tyrol', website: 'https://www.soelden.com', osm_id: 'osm_soelden', elevation_base: 1350, elevation_peak: 3340 },
  { name: 'Ischgl', lat: 47.0140, lon: 10.2930, country: 'AT', region: 'Tyrol', website: 'https://www.ischgl.com', osm_id: 'osm_ischgl', elevation_base: 1377, elevation_peak: 2872 },
  { name: 'Mayrhofen', lat: 47.1674, lon: 11.8657, country: 'AT', region: 'Tyrol', website: 'https://www.mayrhofen.at', osm_id: 'osm_mayrhofen', elevation_base: 630, elevation_peak: 2500 },
  { name: 'Lech Zürs', lat: 47.2083, lon: 10.1435, country: 'AT', region: 'Vorarlberg', website: 'https://www.lech-zuers.at', osm_id: 'osm_lechzurs', elevation_base: 1450, elevation_peak: 2811 },
  { name: 'Schladming', lat: 47.3972, lon: 13.6911, country: 'AT', region: 'Styria', website: 'https://www.schladming-dachstein.at', osm_id: 'osm_schladming', elevation_base: 745, elevation_peak: 2015 },
  { name: 'Zell am See', lat: 47.3253, lon: 12.7980, country: 'AT', region: 'Salzburg', website: 'https://www.zellamsee-kaprun.com', osm_id: 'osm_zellamsee', elevation_base: 757, elevation_peak: 2000 },
  { name: 'Bad Gastein', lat: 47.1169, lon: 13.1342, country: 'AT', region: 'Salzburg', website: 'https://www.gastein.com', osm_id: 'osm_badgastein', elevation_base: 1083, elevation_peak: 2686 },
  { name: 'Obertauern', lat: 47.2534, lon: 13.5700, country: 'AT', region: 'Salzburg', website: 'https://www.obertauern.com', osm_id: 'osm_obertauern', elevation_base: 1630, elevation_peak: 2313 },
  { name: 'Saalbach-Hinterglemm', lat: 47.3906, lon: 12.6367, country: 'AT', region: 'Salzburg', website: 'https://www.saalbach.com', osm_id: 'osm_saalbach', elevation_base: 1003, elevation_peak: 2096 },
  { name: 'Kaprun', lat: 47.2695, lon: 12.7613, country: 'AT', region: 'Salzburg', website: 'https://www.zellamsee-kaprun.com', osm_id: 'osm_kaprun', elevation_base: 768, elevation_peak: 3029 },
  { name: 'Serfaus Fiss Ladis', lat: 47.0392, lon: 10.6050, country: 'AT', region: 'Tyrol', website: 'https://www.serfaus-fiss-ladis.at', osm_id: 'osm_serfaus', elevation_base: 1200, elevation_peak: 2820 },

  // --- Italy ---
  { name: 'Cortina d\'Ampezzo', lat: 46.5369, lon: 12.1357, country: 'IT', region: 'Veneto', website: 'https://www.cortina.dolomiti.com', osm_id: 'osm_cortina', elevation_base: 1224, elevation_peak: 2930 },
  { name: 'Val Gardena', lat: 46.5580, lon: 11.6760, country: 'IT', region: 'South Tyrol', website: 'https://www.valgardena.it', osm_id: 'osm_valgardena', elevation_base: 1236, elevation_peak: 2518 },
  { name: 'Cervinia', lat: 45.9325, lon: 7.6317, country: 'IT', region: 'Aosta Valley', website: 'https://www.cervinia.it', osm_id: 'osm_cervinia', elevation_base: 2050, elevation_peak: 3480 },
  { name: 'Courmayeur', lat: 45.7955, lon: 6.9699, country: 'IT', region: 'Aosta Valley', website: 'https://www.courmayeur.com', osm_id: 'osm_courmayeur', elevation_base: 1210, elevation_peak: 2755 },
  { name: 'Livigno', lat: 46.5370, lon: 10.1362, country: 'IT', region: 'Lombardy', website: 'https://www.livigno.eu', osm_id: 'osm_livigno', elevation_base: 1816, elevation_peak: 2798 },
  { name: 'Madonna di Campiglio', lat: 46.2304, lon: 10.8246, country: 'IT', region: 'Trentino', website: 'https://www.campigliodolomiti.it', osm_id: 'osm_madonnacampiglio', elevation_base: 1522, elevation_peak: 2504 },
  { name: 'Sestriere', lat: 44.9591, lon: 6.8766, country: 'IT', region: 'Piedmont', website: 'https://www.vialattea.it', osm_id: 'osm_sestriere', elevation_base: 2035, elevation_peak: 2823 },
  { name: 'Alta Badia', lat: 46.5932, lon: 11.8883, country: 'IT', region: 'South Tyrol', website: 'https://www.altabadia.org', osm_id: 'osm_altabadia', elevation_base: 1324, elevation_peak: 2778 },
  { name: 'Kronplatz', lat: 46.7355, lon: 11.9447, country: 'IT', region: 'South Tyrol', website: 'https://www.kronplatz.com', osm_id: 'osm_kronplatz', elevation_base: 973, elevation_peak: 2275 },
  { name: 'Bormio', lat: 46.4672, lon: 10.3744, country: 'IT', region: 'Lombardy', website: 'https://www.bormio.eu', osm_id: 'osm_bormio', elevation_base: 1225, elevation_peak: 3012 },
  { name: 'Canazei', lat: 46.4779, lon: 11.7691, country: 'IT', region: 'Trentino', website: 'https://www.fassaski.com', osm_id: 'osm_canazei', elevation_base: 1460, elevation_peak: 2630 },

  // --- Germany ---
  { name: 'Garmisch-Partenkirchen', lat: 47.5004, lon: 11.0950, country: 'DE', region: 'Bavaria', website: 'https://www.gapa.de', osm_id: 'osm_garmisch', elevation_base: 720, elevation_peak: 2050 },
  { name: 'Oberstdorf', lat: 47.4086, lon: 10.2790, country: 'DE', region: 'Bavaria', website: 'https://www.oberstdorf.de', osm_id: 'osm_oberstdorf', elevation_base: 843, elevation_peak: 2224 },
  { name: 'Zugspitze', lat: 47.4211, lon: 10.9851, country: 'DE', region: 'Bavaria', website: 'https://www.zugspitze.de', osm_id: 'osm_zugspitze', elevation_base: 2000, elevation_peak: 2962 },
  { name: 'Reit im Winkl', lat: 47.6726, lon: 12.4689, country: 'DE', region: 'Bavaria', website: 'https://www.reitimwinkl.de', osm_id: 'osm_reitimwinkl', elevation_base: 700, elevation_peak: 1869 },

  // --- Spain & Andorra ---
  { name: 'Sierra Nevada', lat: 37.0956, lon: -3.3963, country: 'ES', region: 'Andalusia', website: 'https://sierranevada.es', osm_id: 'osm_sierranevada', elevation_base: 2100, elevation_peak: 3300 },
  { name: 'Baqueira Beret', lat: 42.6966, lon: 0.9279, country: 'ES', region: 'Catalonia', website: 'https://www.baqueira.es', osm_id: 'osm_baqueira', elevation_base: 1500, elevation_peak: 2510 },
  { name: 'Formigal', lat: 42.7601, lon: -0.3918, country: 'ES', region: 'Aragon', website: 'https://www.aramón.com', osm_id: 'osm_formigal', elevation_base: 1500, elevation_peak: 2250 },
  { name: 'Grandvalira', lat: 42.5394, lon: 1.7235, country: 'AD', region: 'Andorra', website: 'https://www.grandvalira.com', osm_id: 'osm_grandvalira', elevation_base: 1710, elevation_peak: 2640 },

  // --- Scandinavia ---
  { name: 'Åre', lat: 63.3984, lon: 13.0744, country: 'SE', region: 'Jämtland', website: 'https://www.skistar.com/are', osm_id: 'osm_are', elevation_base: 380, elevation_peak: 1274 },
  { name: 'Sälen', lat: 61.1563, lon: 13.2692, country: 'SE', region: 'Dalarna', website: 'https://www.skistar.com/salen', osm_id: 'osm_salen', elevation_base: 430, elevation_peak: 860 },
  { name: 'Vemdalen', lat: 62.4506, lon: 13.8734, country: 'SE', region: 'Härjedalen', website: 'https://www.skistar.com/vemdalen', osm_id: 'osm_vemdalen', elevation_base: 480, elevation_peak: 920 },
  { name: 'Hemsedal', lat: 60.8612, lon: 8.3952, country: 'NO', region: 'Viken', website: 'https://www.hemsedal.com', osm_id: 'osm_hemsedal', elevation_base: 620, elevation_peak: 1450 },
  { name: 'Voss', lat: 60.6282, lon: 6.4169, country: 'NO', region: 'Vestland', website: 'https://www.voss.com', osm_id: 'osm_voss', elevation_base: 420, elevation_peak: 1236 },
  { name: 'Trysil', lat: 61.3389, lon: 12.2660, country: 'NO', region: 'Innlandet', website: 'https://www.trysil.com', osm_id: 'osm_trysil', elevation_base: 415, elevation_peak: 1132 },
  { name: 'Geilo', lat: 60.5311, lon: 8.2001, country: 'NO', region: 'Viken', website: 'https://www.geilo.no', osm_id: 'osm_geilo', elevation_base: 800, elevation_peak: 1178 },
  { name: 'Levi', lat: 67.8039, lon: 24.8141, country: 'FI', region: 'Lapland', website: 'https://www.levi.fi', osm_id: 'osm_levi', elevation_base: 205, elevation_peak: 531 },
  { name: 'Ruka', lat: 66.1659, lon: 29.1461, country: 'FI', region: 'Kainuu', website: 'https://www.ruka.fi', osm_id: 'osm_ruka', elevation_base: 200, elevation_peak: 492 },
  { name: 'Ylläs', lat: 67.5536, lon: 24.2468, country: 'FI', region: 'Lapland', website: 'https://www.yllas.fi', osm_id: 'osm_yllas', elevation_base: 240, elevation_peak: 718 },

  // --- Scotland ---
  { name: 'Cairngorm Mountain', lat: 57.1184, lon: -3.6636, country: 'GB', region: 'Scotland', website: 'https://www.cairngormmountain.co.uk', osm_id: 'osm_cairngorm', elevation_base: 550, elevation_peak: 1245 },
  { name: 'Glenshee', lat: 56.8786, lon: -3.4034, country: 'GB', region: 'Scotland', website: 'https://www.ski-glenshee.co.uk', osm_id: 'osm_glenshee', elevation_base: 650, elevation_peak: 1068 },
  { name: 'Nevis Range', lat: 56.8396, lon: -5.0097, country: 'GB', region: 'Scotland', website: 'https://www.nevisrange.co.uk', osm_id: 'osm_nevisrange', elevation_base: 100, elevation_peak: 1221 },
  { name: 'Glencoe Mountain', lat: 56.6620, lon: -4.8494, country: 'GB', region: 'Scotland', website: 'https://www.glencoemountain.co.uk', osm_id: 'osm_glencoe', elevation_base: 305, elevation_peak: 1108 },

  // --- Japan ---
  { name: 'Niseko', lat: 42.8625, lon: 140.6987, country: 'JP', region: 'Hokkaido', website: 'https://www.niseko.ne.jp', osm_id: 'osm_niseko', elevation_base: 260, elevation_peak: 1308 },
  { name: 'Hakuba', lat: 36.6983, lon: 137.8322, country: 'JP', region: 'Nagano', website: 'https://www.hakubavalley.com', osm_id: 'osm_hakuba', elevation_base: 760, elevation_peak: 2696 },
  { name: 'Nozawa Onsen', lat: 36.9221, lon: 138.6294, country: 'JP', region: 'Nagano', website: 'https://nozawaski.com', osm_id: 'osm_nozawa', elevation_base: 565, elevation_peak: 1650 },
  { name: 'Furano', lat: 43.3505, lon: 142.3837, country: 'JP', region: 'Hokkaido', website: 'https://www.snowfurano.com', osm_id: 'osm_furano', elevation_base: 245, elevation_peak: 1074 },
  { name: 'Rusutsu', lat: 42.7516, lon: 140.9035, country: 'JP', region: 'Hokkaido', website: 'https://www.rusutsu.com', osm_id: 'osm_rusutsu', elevation_base: 400, elevation_peak: 994 },
  { name: 'Naeba', lat: 36.8889, lon: 138.7355, country: 'JP', region: 'Niigata', website: 'https://www.princehotels.com/naeba', osm_id: 'osm_naeba', elevation_base: 900, elevation_peak: 1789 },
  { name: 'Shiga Kogen', lat: 36.7939, lon: 138.4870, country: 'JP', region: 'Nagano', website: 'https://www.shigakogen.co.jp', osm_id: 'osm_shigakogen', elevation_base: 1340, elevation_peak: 2307 },
  { name: 'Zao Onsen', lat: 38.1482, lon: 140.4424, country: 'JP', region: 'Yamagata', website: 'https://www.zao-spa.or.jp', osm_id: 'osm_zaoonsen', elevation_base: 780, elevation_peak: 1661 },
  { name: 'Kiroro', lat: 43.1220, lon: 140.9792, country: 'JP', region: 'Hokkaido', website: 'https://www.kiroro.co.jp', osm_id: 'osm_kiroro', elevation_base: 400, elevation_peak: 1180 },

  // --- South Korea ---
  { name: 'Yongpyong', lat: 37.6439, lon: 128.6808, country: 'KR', region: 'Gangwon', website: 'https://www.yongpyong.co.kr', osm_id: 'osm_yongpyong', elevation_base: 700, elevation_peak: 1458 },
  { name: 'High1', lat: 37.1970, lon: 128.7382, country: 'KR', region: 'Gangwon', website: 'https://www.high1.com', osm_id: 'osm_high1', elevation_base: 1113, elevation_peak: 1345 },
  { name: 'Alpensia', lat: 37.6676, lon: 128.7013, country: 'KR', region: 'Gangwon', website: 'https://www.alpensia.com', osm_id: 'osm_alpensia', elevation_base: 700, elevation_peak: 1390 },

  // --- China ---
  { name: 'Genting Snow Park', lat: 40.9539, lon: 115.4453, country: 'CN', region: 'Hebei', website: 'https://www.gentingresorts.com', osm_id: 'osm_gentingsnow', elevation_base: 1580, elevation_peak: 2042 },
  { name: 'Wanlong Ski Resort', lat: 40.8784, lon: 115.4040, country: 'CN', region: 'Hebei', website: 'https://www.wanlongski.com', osm_id: 'osm_wanlong', elevation_base: 1560, elevation_peak: 2110 },
  { name: 'Yabuli Sun Mountain', lat: 44.3557, lon: 128.5720, country: 'CN', region: 'Heilongjiang', website: 'https://www.yabuli.com.cn', osm_id: 'osm_yabuli', elevation_base: 470, elevation_peak: 1374 },

  // --- Russia ---
  { name: 'Rosa Khutor', lat: 43.6628, lon: 40.2940, country: 'RU', region: 'Krasnodar Krai', website: 'https://rosaski.com', osm_id: 'osm_rosakhutor', elevation_base: 560, elevation_peak: 2320 },
  { name: 'Gazprom Ski Resort', lat: 43.6786, lon: 40.3162, country: 'RU', region: 'Krasnodar Krai', website: 'https://alpikasochi.ru', osm_id: 'osm_alpika', elevation_base: 540, elevation_peak: 2200 },
  { name: 'Sheregesh', lat: 52.9253, lon: 87.9714, country: 'RU', region: 'Kemerovo Oblast', website: 'https://www.sheregesh.ru', osm_id: 'osm_sheregesh', elevation_base: 600, elevation_peak: 1270 },

  // --- Australia ---
  { name: 'Thredbo', lat: -36.5054, lon: 148.3044, country: 'AU', region: 'New South Wales', website: 'https://www.thredbo.com.au', osm_id: 'osm_thredbo', elevation_base: 1365, elevation_peak: 2037 },
  { name: 'Perisher', lat: -36.3717, lon: 148.4093, country: 'AU', region: 'New South Wales', website: 'https://www.perisher.com.au', osm_id: 'osm_perisher', elevation_base: 1605, elevation_peak: 2034 },
  { name: 'Falls Creek', lat: -36.8650, lon: 147.2820, country: 'AU', region: 'Victoria', website: 'https://www.fallscreek.com.au', osm_id: 'osm_fallscreek', elevation_base: 1500, elevation_peak: 1842 },
  { name: 'Mt. Buller', lat: -37.1496, lon: 146.4367, country: 'AU', region: 'Victoria', website: 'https://www.mtbuller.com.au', osm_id: 'osm_mtbuller', elevation_base: 1375, elevation_peak: 1805 },
  { name: 'Hotham Alpine Resort', lat: -36.9935, lon: 147.1250, country: 'AU', region: 'Victoria', website: 'https://www.mthotham.com.au', osm_id: 'osm_mthotham', elevation_base: 1450, elevation_peak: 1861 },
  { name: 'Charlotte Pass', lat: -36.4334, lon: 148.3348, country: 'AU', region: 'New South Wales', website: 'https://www.charlottepass.com.au', osm_id: 'osm_charlottepass', elevation_base: 1765, elevation_peak: 2037 },

  // --- New Zealand ---
  { name: 'Coronet Peak', lat: -45.0871, lon: 168.7282, country: 'NZ', region: 'Otago', website: 'https://www.coronetpeak.co.nz', osm_id: 'osm_coronetpeak', elevation_base: 1168, elevation_peak: 1649 },
  { name: 'The Remarkables', lat: -45.0467, lon: 168.8147, country: 'NZ', region: 'Otago', website: 'https://www.theremarkables.co.nz', osm_id: 'osm_remarkables', elevation_base: 1586, elevation_peak: 1943 },
  { name: 'Mt. Hutt', lat: -43.4987, lon: 171.5264, country: 'NZ', region: 'Canterbury', website: 'https://www.mthutt.co.nz', osm_id: 'osm_mthutt', elevation_base: 1436, elevation_peak: 2086 },
  { name: 'Cardrona Alpine Resort', lat: -44.8766, lon: 168.9530, country: 'NZ', region: 'Otago', website: 'https://www.cardrona.com', osm_id: 'osm_cardrona', elevation_base: 1260, elevation_peak: 1894 },
  { name: 'Treble Cone', lat: -44.5740, lon: 168.8679, country: 'NZ', region: 'Otago', website: 'https://www.treblecone.com', osm_id: 'osm_treblecone', elevation_base: 1200, elevation_peak: 1960 },
  { name: 'Turoa', lat: -39.2964, lon: 175.5386, country: 'NZ', region: 'Manawatu-Wanganui', website: 'https://www.mtruapehu.com', osm_id: 'osm_turoa', elevation_base: 1600, elevation_peak: 2322 },
  { name: 'Whakapapa', lat: -39.2321, lon: 175.5637, country: 'NZ', region: 'Waikato', website: 'https://www.mtruapehu.com', osm_id: 'osm_whakapapa', elevation_base: 1630, elevation_peak: 2300 },

  // --- South America: Chile ---
  { name: 'Valle Nevado', lat: -33.3558, lon: -70.2546, country: 'CL', region: 'Santiago Metro', website: 'https://www.vallenevado.com', osm_id: 'osm_vallenevado', elevation_base: 2860, elevation_peak: 3670 },
  { name: 'Portillo', lat: -32.8325, lon: -70.1270, country: 'CL', region: 'Valparaíso', website: 'https://www.skiportillo.com', osm_id: 'osm_portillo', elevation_base: 2580, elevation_peak: 3310 },
  { name: 'El Colorado', lat: -33.3508, lon: -70.2905, country: 'CL', region: 'Santiago Metro', website: 'https://www.elcolorado.cl', osm_id: 'osm_elcolorado', elevation_base: 2430, elevation_peak: 3333 },
  { name: 'La Parva', lat: -33.3524, lon: -70.2771, country: 'CL', region: 'Santiago Metro', website: 'https://www.laparva.cl', osm_id: 'osm_laparva', elevation_base: 2662, elevation_peak: 3630 },
  { name: 'Nevados de Chillán', lat: -36.9057, lon: -71.3862, country: 'CL', region: 'Ñuble', website: 'https://www.nevadosdechillan.com', osm_id: 'osm_chillan', elevation_base: 1530, elevation_peak: 3122 },
  { name: 'Pucón (Volcán Villarrica)', lat: -39.3995, lon: -71.7944, country: 'CL', region: 'Araucanía', website: 'https://www.skipucon.cl', osm_id: 'osm_pucon', elevation_base: 1415, elevation_peak: 2450 },

  // --- South America: Argentina ---
  { name: 'Cerro Catedral', lat: -41.1649, lon: -71.4432, country: 'AR', region: 'Río Negro', website: 'https://www.catedralaltapatagonia.com', osm_id: 'osm_catedral', elevation_base: 1030, elevation_peak: 2100 },
  { name: 'Las Leñas', lat: -35.1625, lon: -70.0761, country: 'AR', region: 'Mendoza', website: 'https://www.laslenas.com', osm_id: 'osm_laslenas', elevation_base: 2240, elevation_peak: 3430 },
  { name: 'Chapelco', lat: -40.3249, lon: -71.3756, country: 'AR', region: 'Neuquén', website: 'https://www.chapelco.com.ar', osm_id: 'osm_chapelco', elevation_base: 1250, elevation_peak: 1980 },
  { name: 'Cerro Castor', lat: -54.7823, lon: -68.1548, country: 'AR', region: 'Tierra del Fuego', website: 'https://www.cerrocastor.com', osm_id: 'osm_cerrocastor', elevation_base: 195, elevation_peak: 1057 },
  { name: 'Caviahue', lat: -37.8744, lon: -71.0301, country: 'AR', region: 'Neuquén', website: 'https://www.caviahue-copahue.com.ar', osm_id: 'osm_caviahue', elevation_base: 1600, elevation_peak: 2100 },

  // --- Bulgaria ---
  { name: 'Borovets', lat: 42.2697, lon: 23.5960, country: 'BG', region: 'Sofia Province', website: 'https://www.borovets-bg.com', osm_id: 'osm_borovets', elevation_base: 1350, elevation_peak: 2560 },
  { name: 'Bansko', lat: 41.8398, lon: 23.4887, country: 'BG', region: 'Blagoevgrad', website: 'https://www.banskoski.com', osm_id: 'osm_bansko', elevation_base: 936, elevation_peak: 2560 },
  { name: 'Pamporovo', lat: 41.6389, lon: 24.6927, country: 'BG', region: 'Smolyan', website: 'https://www.pamporovo.bg', osm_id: 'osm_pamporovo', elevation_base: 1450, elevation_peak: 1926 },

  // --- Romania ---
  { name: 'Poiana Brasov', lat: 45.5986, lon: 25.5520, country: 'RO', region: 'Brașov', website: 'https://www.poiana-brasov.com', osm_id: 'osm_poianabrasov', elevation_base: 1020, elevation_peak: 1799 },
  { name: 'Sinaia', lat: 45.3532, lon: 25.5544, country: 'RO', region: 'Prahova', website: 'https://www.sinaia.ro', osm_id: 'osm_sinaia', elevation_base: 1000, elevation_peak: 2000 },
  { name: 'Predeal', lat: 45.5094, lon: 25.5779, country: 'RO', region: 'Brașov', website: 'https://www.predeal.ro', osm_id: 'osm_predeal', elevation_base: 1040, elevation_peak: 1440 },

  // --- Czech Republic ---
  { name: 'Špindlerův Mlýn', lat: 50.7293, lon: 15.6107, country: 'CZ', region: 'Hradec Králové', website: 'https://www.skiareal.com', osm_id: 'osm_spindleruv', elevation_base: 702, elevation_peak: 1310 },
  { name: 'Harrachov', lat: 50.7724, lon: 15.4099, country: 'CZ', region: 'Liberec', website: 'https://www.skiareal-harrachov.cz', osm_id: 'osm_harrachov', elevation_base: 660, elevation_peak: 1020 },
  { name: 'Pec pod Sněžkou', lat: 50.6924, lon: 15.7337, country: 'CZ', region: 'Hradec Králové', website: 'https://www.pecpodsnezkou.cz', osm_id: 'osm_pecpodsnezkou', elevation_base: 800, elevation_peak: 1260 },

  // --- Slovakia ---
  { name: 'Jasná Nízke Tatry', lat: 48.9363, lon: 19.5942, country: 'SK', region: 'Banská Bystrica', website: 'https://www.jasna.sk', osm_id: 'osm_jasna', elevation_base: 943, elevation_peak: 2024 },
  { name: 'Štrbské Pleso', lat: 49.1205, lon: 20.0592, country: 'SK', region: 'Prešov', website: 'https://www.vt.sk', osm_id: 'osm_strbskepleso', elevation_base: 1346, elevation_peak: 2190 },
  { name: 'Donovaly', lat: 48.8861, lon: 19.2121, country: 'SK', region: 'Banská Bystrica', website: 'https://www.parksnow.sk', osm_id: 'osm_donovaly', elevation_base: 940, elevation_peak: 1361 },

  // --- Poland ---
  { name: 'Zakopane Kasprowy Wierch', lat: 49.2321, lon: 19.9817, country: 'PL', region: 'Lesser Poland', website: 'https://www.pkl.pl', osm_id: 'osm_kasprowy', elevation_base: 1014, elevation_peak: 1987 },
  { name: 'Białka Tatrzańska', lat: 49.4012, lon: 20.1351, country: 'PL', region: 'Lesser Poland', website: 'https://www.bialka-tatrzanska.pl', osm_id: 'osm_bialka', elevation_base: 680, elevation_peak: 1300 },
  { name: 'Szczyrk Mountain Resort', lat: 49.7152, lon: 19.0465, country: 'PL', region: 'Silesia', website: 'https://www.szczyrkmountainresort.com', osm_id: 'osm_szczyrk', elevation_base: 560, elevation_peak: 1257 },

  // --- Slovenia ---
  { name: 'Kranjska Gora', lat: 46.4836, lon: 13.7905, country: 'SI', region: 'Upper Carniola', website: 'https://www.kranjska-gora.eu', osm_id: 'osm_kranjskagora', elevation_base: 810, elevation_peak: 1295 },
  { name: 'Krvavec', lat: 46.3063, lon: 14.5374, country: 'SI', region: 'Upper Carniola', website: 'https://www.rtc-krvavec.si', osm_id: 'osm_krvavec', elevation_base: 1450, elevation_peak: 1971 },
  { name: 'Vogel', lat: 46.2647, lon: 13.8451, country: 'SI', region: 'Littoral', website: 'https://www.vogel.si', osm_id: 'osm_vogel', elevation_base: 569, elevation_peak: 1800 },

  // --- Serbia ---
  { name: 'Kopaonik', lat: 43.2883, lon: 20.8143, country: 'RS', region: 'Raška', website: 'https://www.skijalistasrbije.rs', osm_id: 'osm_kopaonik', elevation_base: 1550, elevation_peak: 2017 },
  { name: 'Zlatibor', lat: 43.7287, lon: 19.7022, country: 'RS', region: 'Zlatibor', website: 'https://www.zlatibor.rs', osm_id: 'osm_zlatibor', elevation_base: 1000, elevation_peak: 1496 },

  // --- Bosnia and Herzegovina ---
  { name: 'Jahorina', lat: 43.7281, lon: 18.5687, country: 'BA', region: 'Republika Srpska', website: 'https://www.oc-jahorina.com', osm_id: 'osm_jahorina', elevation_base: 1300, elevation_peak: 1916 },
  { name: 'Bjelašnica', lat: 43.7190, lon: 18.2512, country: 'BA', region: 'Federation of BiH', website: 'https://www.bjelasnica.ba', osm_id: 'osm_bjelasnica', elevation_base: 1266, elevation_peak: 2067 },

  // --- Greece ---
  { name: 'Parnassos Ski Centre', lat: 38.5368, lon: 22.5761, country: 'GR', region: 'Central Greece', website: 'https://www.parnassos-ski.gr', osm_id: 'osm_parnassos', elevation_base: 1600, elevation_peak: 2260 },
  { name: 'Vasilitsa', lat: 40.0333, lon: 21.1333, country: 'GR', region: 'Western Macedonia', website: 'https://www.vasilitsa.com', osm_id: 'osm_vasilitsa', elevation_base: 1650, elevation_peak: 2249 },

  // --- Turkey ---
  { name: 'Uludağ', lat: 40.1144, lon: 29.1264, country: 'TR', region: 'Bursa', website: 'https://www.uludag.com.tr', osm_id: 'osm_uludag', elevation_base: 1767, elevation_peak: 2543 },
  { name: 'Palandöken', lat: 39.8571, lon: 41.2268, country: 'TR', region: 'Erzurum', website: 'https://www.palandoken.com', osm_id: 'osm_palandoken', elevation_base: 2200, elevation_peak: 3176 },
  { name: 'Kartalkaya', lat: 40.8521, lon: 31.5483, country: 'TR', region: 'Bolu', website: 'https://www.kartalkaya.com', osm_id: 'osm_kartalkaya', elevation_base: 1850, elevation_peak: 2200 },

  // --- Lebanon ---
  { name: 'Mzaar Kfardebian', lat: 34.0714, lon: 35.9852, country: 'LB', region: 'Mount Lebanon', website: 'https://www.mzaar.com', osm_id: 'osm_mzaar', elevation_base: 1850, elevation_peak: 2465 },
  { name: 'Faraya Mzaar', lat: 34.0697, lon: 35.9899, country: 'LB', region: 'Mount Lebanon', website: 'https://www.faraya.com', osm_id: 'osm_faraya', elevation_base: 1850, elevation_peak: 2465 },

  // --- Georgia (country) ---
  { name: 'Gudauri', lat: 42.4779, lon: 44.4789, country: 'GE', region: 'Mtskheta-Mtianeti', website: 'https://www.gudauri.travel', osm_id: 'osm_gudauri', elevation_base: 1990, elevation_peak: 3307 },
  { name: 'Bakuriani', lat: 41.7496, lon: 43.5244, country: 'GE', region: 'Samtskhe-Javakheti', website: 'https://www.bakuriani.ge', osm_id: 'osm_bakuriani', elevation_base: 1700, elevation_peak: 2700 },

  // --- Kazakhstan ---
  { name: 'Shymbulak', lat: 43.1502, lon: 77.0830, country: 'KZ', region: 'Almaty', website: 'https://www.shymbulak.com', osm_id: 'osm_shymbulak', elevation_base: 2260, elevation_peak: 3163 },

  // --- Iran ---
  { name: 'Dizin', lat: 36.1004, lon: 51.3923, country: 'IR', region: 'Tehran', website: 'https://www.dizin.ir', osm_id: 'osm_dizin', elevation_base: 2650, elevation_peak: 3600 },
  { name: 'Shemshak', lat: 36.0716, lon: 51.5064, country: 'IR', region: 'Tehran', website: 'https://www.shemshak.ir', osm_id: 'osm_shemshak', elevation_base: 2550, elevation_peak: 3050 },

  // --- Morocco ---
  { name: 'Oukaimeden', lat: 31.2044, lon: -7.8667, country: 'MA', region: 'Marrakesh-Safi', website: 'https://www.oukaimeden.com', osm_id: 'osm_oukaimeden', elevation_base: 2600, elevation_peak: 3258 },

  // --- South Africa ---
  { name: 'Tiffindell Ski Resort', lat: -30.7097, lon: 28.2010, country: 'ZA', region: 'Eastern Cape', website: 'https://www.tiffindell.co.za', osm_id: 'osm_tiffindell', elevation_base: 2720, elevation_peak: 3001 },

  // --- Lesotho ---
  { name: 'Afriski Mountain Resort', lat: -29.2175, lon: 28.8845, country: 'LS', region: 'Butha-Buthe', website: 'https://www.afriski.net', osm_id: 'osm_afriski', elevation_base: 3020, elevation_peak: 3222 },

  // --- India ---
  { name: 'Gulmarg', lat: 34.0462, lon: 74.3808, country: 'IN', region: 'Jammu & Kashmir', website: 'https://www.gulmarg.net', osm_id: 'osm_gulmarg', elevation_base: 2650, elevation_peak: 3980 },
  { name: 'Auli', lat: 30.5243, lon: 79.5639, country: 'IN', region: 'Uttarakhand', website: 'https://www.gmvnl.in', osm_id: 'osm_auli', elevation_base: 2519, elevation_peak: 3049 },

  // --- China (additional) ---
  { name: 'Thaiwoo Ski Resort', lat: 40.5880, lon: 115.5303, country: 'CN', region: 'Hebei', website: 'https://www.thaiwoo.com', osm_id: 'osm_thaiwoo', elevation_base: 1480, elevation_peak: 2160 },
  { name: 'Beidahu Ski Resort', lat: 43.5760, lon: 127.1690, country: 'CN', region: 'Jilin', website: 'https://www.beidahu.com', osm_id: 'osm_beidahu', elevation_base: 660, elevation_peak: 1408 },

  // --- Japan (additional) ---
  { name: 'Appi Kogen', lat: 39.9720, lon: 141.0006, country: 'JP', region: 'Iwate', website: 'https://www.appi.co.jp', osm_id: 'osm_appikogen', elevation_base: 656, elevation_peak: 1305 },
  { name: 'Myoko Kogen', lat: 37.0217, lon: 138.1063, country: 'JP', region: 'Niigata', website: 'https://www.myoko.tv', osm_id: 'osm_myokokogen', elevation_base: 740, elevation_peak: 1655 },
  { name: 'Hakkoda Ropeway', lat: 40.6501, lon: 140.8729, country: 'JP', region: 'Aomori', website: 'https://www.hakkoda-ropeway.jp', osm_id: 'osm_hakkoda', elevation_base: 650, elevation_peak: 1324 },

  // --- South Korea (additional) ---
  { name: 'Jiri Mountain Ski Resort', lat: 35.3379, lon: 127.7313, country: 'KR', region: 'South Jeolla', website: 'https://www.jirisan.go.kr', osm_id: 'osm_jirisan', elevation_base: 750, elevation_peak: 1200 },

  // --- Russia (additional) ---
  { name: 'Arkhyz', lat: 43.5698, lon: 41.2890, country: 'RU', region: 'Karachay-Cherkessia', website: 'https://www.arch-ski.ru', osm_id: 'osm_arkhyz', elevation_base: 1440, elevation_peak: 2980 },
  { name: 'Dombai', lat: 43.2700, lon: 41.7208, country: 'RU', region: 'Karachay-Cherkessia', website: 'https://www.dombai.info', osm_id: 'osm_dombai', elevation_base: 1610, elevation_peak: 3200 },

  // --- Norway (additional) ---
  { name: 'Hafjell', lat: 61.2667, lon: 10.4833, country: 'NO', region: 'Innlandet', website: 'https://www.hafjell.no', osm_id: 'osm_hafjell', elevation_base: 195, elevation_peak: 1030 },
  { name: 'Kvitfjell', lat: 61.4667, lon: 10.1167, country: 'NO', region: 'Innlandet', website: 'https://www.kvitfjell.no', osm_id: 'osm_kvitfjell', elevation_base: 520, elevation_peak: 1065 },

  // --- Sweden (additional) ---
  { name: 'Idre Fjäll', lat: 61.8714, lon: 13.1083, country: 'SE', region: 'Dalarna', website: 'https://www.idrefjall.se', osm_id: 'osm_idrefjall', elevation_base: 580, elevation_peak: 890 },
  { name: 'Romme Alpin', lat: 60.4406, lon: 15.6422, country: 'SE', region: 'Dalarna', website: 'https://www.rommealpin.se', osm_id: 'osm_rommealpin', elevation_base: 290, elevation_peak: 582 },
  { name: 'Björnrike', lat: 62.6167, lon: 14.0667, country: 'SE', region: 'Jämtland', website: 'https://www.bjornrike.com', osm_id: 'osm_bjornrike', elevation_base: 520, elevation_peak: 890 },

  // --- Finland (additional) ---
  { name: 'Pyhä-Luosto', lat: 66.9903, lon: 27.0622, country: 'FI', region: 'Lapland', website: 'https://www.pyhaluosto.fi', osm_id: 'osm_pyhaluosto', elevation_base: 245, elevation_peak: 540 },
  { name: 'Saariselkä', lat: 68.4223, lon: 27.4225, country: 'FI', region: 'Lapland', website: 'https://www.saariselka.fi', osm_id: 'osm_saariselka', elevation_base: 180, elevation_peak: 718 },

  // --- Germany (additional) ---
  { name: 'Berchtesgaden', lat: 47.6275, lon: 13.0008, country: 'DE', region: 'Bavaria', website: 'https://www.berchtesgadener-land.com', osm_id: 'osm_berchtesgaden', elevation_base: 630, elevation_peak: 1800 },
  { name: 'Oberstaufen', lat: 47.5516, lon: 10.0197, country: 'DE', region: 'Bavaria', website: 'https://www.oberstaufen.de', osm_id: 'osm_oberstaufen', elevation_base: 700, elevation_peak: 1834 },
  { name: 'Balderschwang', lat: 47.4957, lon: 10.1476, country: 'DE', region: 'Bavaria', website: 'https://www.balderschwang.de', osm_id: 'osm_balderschwang', elevation_base: 1044, elevation_peak: 1453 },
  { name: 'Feldberg Schwarzwald', lat: 47.8744, lon: 8.0056, country: 'DE', region: 'Baden-Württemberg', website: 'https://www.liftverbund-feldberg.de', osm_id: 'osm_feldberg', elevation_base: 1050, elevation_peak: 1493 },

  // --- France (additional) ---
  { name: 'Serre Chevalier', lat: 44.9197, lon: 6.5493, country: 'FR', region: 'Provence-Alpes-Côte d\'Azur', website: 'https://www.serre-chevalier.com', osm_id: 'osm_serrechevalier', elevation_base: 1200, elevation_peak: 2800 },
  { name: 'Isola 2000', lat: 44.1896, lon: 7.1630, country: 'FR', region: 'Provence-Alpes-Côte d\'Azur', website: 'https://www.isola2000.com', osm_id: 'osm_isola2000', elevation_base: 1800, elevation_peak: 2610 },
  { name: 'Pra-Loup', lat: 44.3793, lon: 6.5973, country: 'FR', region: 'Provence-Alpes-Côte d\'Azur', website: 'https://www.praloup.com', osm_id: 'osm_praloup', elevation_base: 1500, elevation_peak: 2600 },

  // --- Switzerland (additional) ---
  { name: 'Villars-sur-Ollon', lat: 46.3040, lon: 7.0530, country: 'CH', region: 'Vaud', website: 'https://www.villars.ch', osm_id: 'osm_villars', elevation_base: 1253, elevation_peak: 2120 },
  { name: 'Leysin', lat: 46.3413, lon: 7.0044, country: 'CH', region: 'Vaud', website: 'https://www.leysin.ch', osm_id: 'osm_leysin', elevation_base: 1263, elevation_peak: 2205 },
  { name: 'Champéry', lat: 46.1757, lon: 6.8688, country: 'CH', region: 'Valais', website: 'https://www.champery.ch', osm_id: 'osm_champery', elevation_base: 1050, elevation_peak: 2277 },

  // --- Austria (additional) ---
  { name: 'Rauris', lat: 47.2256, lon: 12.9986, country: 'AT', region: 'Salzburg', website: 'https://www.rauris.net', osm_id: 'osm_rauris', elevation_base: 940, elevation_peak: 2175 },
  { name: 'Hochgurgl', lat: 46.8761, lon: 11.0345, country: 'AT', region: 'Tyrol', website: 'https://www.hochgurgl.com', osm_id: 'osm_hochgurgl', elevation_base: 1793, elevation_peak: 3082 },
  { name: 'Wagrain', lat: 47.3345, lon: 13.3031, country: 'AT', region: 'Salzburg', website: 'https://www.snow-space.com', osm_id: 'osm_wagrain', elevation_base: 860, elevation_peak: 2000 },

  // --- Italy (additional) ---
  { name: 'Passo Tonale', lat: 46.2608, lon: 10.5804, country: 'IT', region: 'Trentino', website: 'https://www.passotonale.it', osm_id: 'osm_passotonale', elevation_base: 1884, elevation_peak: 3016 },

  // --- Spain (additional) ---
  { name: 'Masella', lat: 42.3167, lon: 1.9167, country: 'ES', region: 'Catalonia', website: 'https://www.masella.com', osm_id: 'osm_masella', elevation_base: 1600, elevation_peak: 2535 },

  // --- United Kingdom (additional) ---
  { name: 'The Lecht', lat: 57.3622, lon: -3.2636, country: 'GB', region: 'Scotland', website: 'https://www.lecht.co.uk', osm_id: 'osm_thelecht', elevation_base: 645, elevation_peak: 793 },

  // --- Canada (additional) ---
  { name: 'Nakiska', lat: 50.9358, lon: -115.1479, country: 'CA', region: 'Alberta', website: 'https://www.skinakiska.com', osm_id: 'osm_nakiska', elevation_base: 1525, elevation_peak: 2258 },
  { name: 'Sunshine Village', lat: 51.0773, lon: -115.7717, country: 'CA', region: 'Alberta', website: 'https://www.skibanff.com', osm_id: 'osm_sunshinevillage', elevation_base: 1660, elevation_peak: 2730 },

  // --- USA: Mid-Atlantic & Southeast ---
  { name: 'Wisp Resort', lat: 39.5337, lon: -79.3590, country: 'US', region: 'Maryland', website: 'https://www.wispresort.com', osm_id: 'osm_wisp', elevation_base: 838, elevation_peak: 945 },
  { name: 'Whitetail Resort', lat: 39.7461, lon: -77.7950, country: 'US', region: 'Pennsylvania', website: 'https://www.skiwhitetail.com', osm_id: 'osm_whitetail', elevation_base: 365, elevation_peak: 533 },
  { name: 'Seven Springs Mountain Resort', lat: 39.8884, lon: -79.3093, country: 'US', region: 'Pennsylvania', website: 'https://www.7springs.com', osm_id: 'osm_sevensprings', elevation_base: 595, elevation_peak: 905 },
  { name: 'Winterplace', lat: 37.8167, lon: -81.1500, country: 'US', region: 'West Virginia', website: 'https://www.winterplace.com', osm_id: 'osm_winterplace', elevation_base: 1100, elevation_peak: 1340 },

  // --- USA: Midwest ---
  { name: 'Boyne Mountain', lat: 45.1680, lon: -84.9185, country: 'US', region: 'Michigan', website: 'https://www.boynemountain.com', osm_id: 'osm_boynemountain', elevation_base: 335, elevation_peak: 500 },
  { name: 'Crystal Mountain Michigan', lat: 44.5073, lon: -85.8229, country: 'US', region: 'Michigan', website: 'https://www.crystalmountain.com', osm_id: 'osm_crystalmtnmi', elevation_base: 280, elevation_peak: 465 },

  // --- USA: New York & Mid-Atlantic ---
];

export { SEED_RESORTS };

export async function seed() {
  initDb();
  const db = getDb();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO resorts (name, lat, lon, country, region, website, osm_id, elevation_base, elevation_peak)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((resorts) => {
    for (const r of resorts) {
      insert.run(r.name, r.lat, r.lon, r.country, r.region, r.website, r.osm_id, r.elevation_base || 0, r.elevation_peak || 0);
    }
  });

  insertMany(SEED_RESORTS);

  const count = db.prepare('SELECT COUNT(*) as count FROM resorts').get();
  console.log(`Seeded ${count.count} ski resorts.`);
}

// Only run when executed directly (not when imported by tests or other modules)
const isMain = process.argv[1] && process.argv[1].endsWith('seedResorts.js');
if (isMain) {
  seed();
}
