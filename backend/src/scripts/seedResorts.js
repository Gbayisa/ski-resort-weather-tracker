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
  { name: 'Vail', lat: 39.6403, lon: -106.3742, country: 'US', region: 'Colorado', website: 'https://www.vail.com', osm_id: 'osm_vail' },
  { name: 'Aspen Snowmass', lat: 39.2084, lon: -106.9490, country: 'US', region: 'Colorado', website: 'https://www.aspensnowmass.com', osm_id: 'osm_aspen' },
  { name: 'Breckenridge', lat: 39.4817, lon: -106.0384, country: 'US', region: 'Colorado', website: 'https://www.breckenridge.com', osm_id: 'osm_breckenridge' },
  { name: 'Steamboat Springs', lat: 40.4572, lon: -106.8045, country: 'US', region: 'Colorado', website: 'https://www.steamboat.com', osm_id: 'osm_steamboat' },
  { name: 'Telluride', lat: 37.9375, lon: -107.8123, country: 'US', region: 'Colorado', website: 'https://tellurideskiresort.com', osm_id: 'osm_telluride' },
  { name: 'Copper Mountain', lat: 39.5022, lon: -106.1497, country: 'US', region: 'Colorado', website: 'https://www.coppercolorado.com', osm_id: 'osm_copper' },
  { name: 'Winter Park', lat: 39.8841, lon: -105.7625, country: 'US', region: 'Colorado', website: 'https://www.winterparkresort.com', osm_id: 'osm_winterpark' },
  { name: 'Keystone', lat: 39.6045, lon: -105.9497, country: 'US', region: 'Colorado', website: 'https://www.keystoneresort.com', osm_id: 'osm_keystone' },
  { name: 'Crested Butte', lat: 38.8988, lon: -106.9650, country: 'US', region: 'Colorado', website: 'https://www.skicb.com', osm_id: 'osm_crestedbutte' },
  { name: 'Arapahoe Basin', lat: 39.6426, lon: -105.8718, country: 'US', region: 'Colorado', website: 'https://www.arapahoebasin.com', osm_id: 'osm_abasin' },
  { name: 'Snowmass', lat: 39.2131, lon: -106.9458, country: 'US', region: 'Colorado', website: 'https://www.aspensnowmass.com', osm_id: 'osm_snowmass' },
  { name: 'Loveland', lat: 39.6808, lon: -105.8977, country: 'US', region: 'Colorado', website: 'https://skiloveland.com', osm_id: 'osm_loveland' },
  { name: 'Wolf Creek', lat: 37.4731, lon: -106.7952, country: 'US', region: 'Colorado', website: 'https://wolfcreekski.com', osm_id: 'osm_wolfcreek' },
  { name: 'Monarch Mountain', lat: 38.5040, lon: -106.3298, country: 'US', region: 'Colorado', website: 'https://www.skimonarch.com', osm_id: 'osm_monarch' },

  // --- USA: Utah ---
  { name: 'Park City', lat: 40.6461, lon: -111.4980, country: 'US', region: 'Utah', website: 'https://www.parkcitymountain.com', osm_id: 'osm_parkcity' },
  { name: 'Snowbird', lat: 40.5830, lon: -111.6538, country: 'US', region: 'Utah', website: 'https://www.snowbird.com', osm_id: 'osm_snowbird' },
  { name: 'Alta', lat: 40.5884, lon: -111.6386, country: 'US', region: 'Utah', website: 'https://www.alta.com', osm_id: 'osm_alta' },
  { name: 'Deer Valley', lat: 40.6374, lon: -111.4783, country: 'US', region: 'Utah', website: 'https://www.deervalley.com', osm_id: 'osm_deervalley' },
  { name: 'Brighton', lat: 40.5980, lon: -111.5833, country: 'US', region: 'Utah', website: 'https://www.brightonresort.com', osm_id: 'osm_brighton' },
  { name: 'Solitude', lat: 40.6199, lon: -111.5916, country: 'US', region: 'Utah', website: 'https://www.solitudemountain.com', osm_id: 'osm_solitude' },
  { name: 'Sundance', lat: 40.3927, lon: -111.5888, country: 'US', region: 'Utah', website: 'https://www.sundanceresort.com', osm_id: 'osm_sundance' },
  { name: 'Brian Head', lat: 37.6933, lon: -112.8518, country: 'US', region: 'Utah', website: 'https://www.brianhead.com', osm_id: 'osm_brianhead' },

  // --- USA: Wyoming & Montana ---
  { name: 'Jackson Hole', lat: 43.5877, lon: -110.8279, country: 'US', region: 'Wyoming', website: 'https://www.jacksonhole.com', osm_id: 'osm_jacksonhole' },
  { name: 'Grand Targhee', lat: 43.7871, lon: -110.9396, country: 'US', region: 'Wyoming', website: 'https://www.grandtarghee.com', osm_id: 'osm_grandtarghee' },
  { name: 'Big Sky', lat: 45.2862, lon: -111.4013, country: 'US', region: 'Montana', website: 'https://bigskyresort.com', osm_id: 'osm_bigsky' },
  { name: 'Whitefish Mountain', lat: 48.4816, lon: -114.3538, country: 'US', region: 'Montana', website: 'https://skiwhitefish.com', osm_id: 'osm_whitefish' },
  { name: 'Bridger Bowl', lat: 45.8168, lon: -110.8975, country: 'US', region: 'Montana', website: 'https://www.bridgerbowl.com', osm_id: 'osm_bridgerbowl' },
  { name: 'Red Lodge Mountain', lat: 45.1901, lon: -109.3113, country: 'US', region: 'Montana', website: 'https://www.redlodgemountain.com', osm_id: 'osm_redlodge' },

  // --- USA: Idaho & Nevada ---
  { name: 'Sun Valley', lat: 43.6975, lon: -114.3514, country: 'US', region: 'Idaho', website: 'https://www.sunvalley.com', osm_id: 'osm_sunvalley' },
  { name: 'Bogus Basin', lat: 43.7645, lon: -116.1021, country: 'US', region: 'Idaho', website: 'https://bogusbasin.org', osm_id: 'osm_bogusbasin' },
  { name: 'Schweitzer', lat: 48.3701, lon: -116.6230, country: 'US', region: 'Idaho', website: 'https://www.schweitzer.com', osm_id: 'osm_schweitzer' },
  { name: 'Tamarack', lat: 44.6872, lon: -116.0910, country: 'US', region: 'Idaho', website: 'https://www.tamarackidaho.com', osm_id: 'osm_tamarack' },
  { name: 'Diamond Peak', lat: 39.2590, lon: -119.9340, country: 'US', region: 'Nevada', website: 'https://www.diamondpeak.com', osm_id: 'osm_diamondpeak' },

  // --- USA: New Mexico & Arizona ---
  { name: 'Taos Ski Valley', lat: 36.5961, lon: -105.4546, country: 'US', region: 'New Mexico', website: 'https://www.skitaos.com', osm_id: 'osm_taos' },
  { name: 'Ski Santa Fe', lat: 35.7877, lon: -105.8277, country: 'US', region: 'New Mexico', website: 'https://www.skisantafe.com', osm_id: 'osm_skisantafe' },
  { name: 'Ski Apache', lat: 33.3893, lon: -105.7871, country: 'US', region: 'New Mexico', website: 'https://www.skiapache.com', osm_id: 'osm_skiapache' },
  { name: 'Arizona Snowbowl', lat: 35.3298, lon: -111.7129, country: 'US', region: 'Arizona', website: 'https://www.arizonasnowbowl.com', osm_id: 'osm_azsnowbowl' },

  // --- USA: California ---
  { name: 'Mammoth Mountain', lat: 37.6308, lon: -119.0326, country: 'US', region: 'California', website: 'https://www.mammothmountain.com', osm_id: 'osm_mammoth' },
  { name: 'Palisades Tahoe', lat: 39.1968, lon: -120.2354, country: 'US', region: 'California', website: 'https://www.palisadestahoe.com', osm_id: 'osm_palisades' },
  { name: 'Heavenly', lat: 38.9353, lon: -119.9400, country: 'US', region: 'California', website: 'https://www.skiheavenly.com', osm_id: 'osm_heavenly' },
  { name: 'Northstar', lat: 39.2746, lon: -120.1210, country: 'US', region: 'California', website: 'https://www.northstarcalifornia.com', osm_id: 'osm_northstar' },
  { name: 'Kirkwood', lat: 38.6850, lon: -120.0653, country: 'US', region: 'California', website: 'https://www.kirkwood.com', osm_id: 'osm_kirkwood' },
  { name: 'Sugar Bowl', lat: 39.3046, lon: -120.3327, country: 'US', region: 'California', website: 'https://www.sugarbowl.com', osm_id: 'osm_sugarbowl' },
  { name: 'Bear Valley', lat: 38.4671, lon: -120.0459, country: 'US', region: 'California', website: 'https://www.bearvalley.com', osm_id: 'osm_bearvalley' },
  { name: 'Mt. Shasta Ski Park', lat: 41.3727, lon: -122.1928, country: 'US', region: 'California', website: 'https://www.skipark.com', osm_id: 'osm_mtshastaski' },
  { name: 'Mountain High', lat: 34.3836, lon: -117.6436, country: 'US', region: 'California', website: 'https://www.mthigh.com', osm_id: 'osm_mtnhigh' },
  { name: 'Big Bear Mountain', lat: 34.2346, lon: -116.8910, country: 'US', region: 'California', website: 'https://www.bigbearmountainresort.com', osm_id: 'osm_bigbear' },

  // --- USA: Pacific Northwest ---
  { name: 'Mt. Bachelor', lat: 43.9792, lon: -121.6886, country: 'US', region: 'Oregon', website: 'https://www.mtbachelor.com', osm_id: 'osm_mtbachelor' },
  { name: 'Mt. Hood Meadows', lat: 45.3288, lon: -121.6642, country: 'US', region: 'Oregon', website: 'https://www.skihood.com', osm_id: 'osm_mthoodmeadows' },
  { name: 'Timberline Lodge', lat: 45.3311, lon: -121.7108, country: 'US', region: 'Oregon', website: 'https://www.timberlinelodge.com', osm_id: 'osm_timberline' },
  { name: 'Hoodoo', lat: 44.4071, lon: -121.8656, country: 'US', region: 'Oregon', website: 'https://www.hoodoo.com', osm_id: 'osm_hoodoo' },
  { name: 'Crystal Mountain', lat: 46.9350, lon: -121.5045, country: 'US', region: 'Washington', website: 'https://www.crystalmountainresort.com', osm_id: 'osm_crystalmtn' },
  { name: 'Stevens Pass', lat: 47.7453, lon: -121.0890, country: 'US', region: 'Washington', website: 'https://www.stevenspass.com', osm_id: 'osm_stevenspass' },
  { name: 'The Summit at Snoqualmie', lat: 47.4038, lon: -121.4138, country: 'US', region: 'Washington', website: 'https://www.summitatsnoqualmie.com', osm_id: 'osm_snoqualmie' },
  { name: 'Mission Ridge', lat: 47.2897, lon: -120.3994, country: 'US', region: 'Washington', website: 'https://www.missionridge.com', osm_id: 'osm_missionridge' },
  { name: 'Mt. Baker', lat: 48.8614, lon: -121.6676, country: 'US', region: 'Washington', website: 'https://www.mtbaker.us', osm_id: 'osm_mtbaker' },
  { name: 'Lookout Pass', lat: 47.4623, lon: -115.7012, country: 'US', region: 'Idaho', website: 'https://www.skilookout.com', osm_id: 'osm_lookoutpass' },

  // --- USA: Vermont ---
  { name: 'Killington', lat: 43.6045, lon: -72.8201, country: 'US', region: 'Vermont', website: 'https://www.killington.com', osm_id: 'osm_killington' },
  { name: 'Stowe', lat: 44.5303, lon: -72.7814, country: 'US', region: 'Vermont', website: 'https://www.stowe.com', osm_id: 'osm_stowe' },
  { name: 'Sugarbush', lat: 44.1360, lon: -72.9012, country: 'US', region: 'Vermont', website: 'https://www.sugarbush.com', osm_id: 'osm_sugarbush' },
  { name: 'Jay Peak', lat: 44.9260, lon: -72.5276, country: 'US', region: 'Vermont', website: 'https://www.jaypeakresort.com', osm_id: 'osm_jaypeak' },
  { name: 'Mad River Glen', lat: 44.1835, lon: -72.8901, country: 'US', region: 'Vermont', website: 'https://www.madriverglen.com', osm_id: 'osm_madriverglen' },
  { name: 'Bolton Valley', lat: 44.4100, lon: -72.8594, country: 'US', region: 'Vermont', website: 'https://www.boltonvalley.com', osm_id: 'osm_boltonvalley' },
  { name: 'Okemo', lat: 43.4005, lon: -72.7272, country: 'US', region: 'Vermont', website: 'https://www.okemo.com', osm_id: 'osm_okemo' },

  // --- USA: New England ---
  { name: 'Sunday River', lat: 44.4734, lon: -70.8567, country: 'US', region: 'Maine', website: 'https://www.sundayriver.com', osm_id: 'osm_sundayriver' },
  { name: 'Sugarloaf', lat: 45.0314, lon: -70.3131, country: 'US', region: 'Maine', website: 'https://www.sugarloaf.com', osm_id: 'osm_sugarloaf' },
  { name: 'Saddleback Mountain', lat: 44.8826, lon: -70.5145, country: 'US', region: 'Maine', website: 'https://www.saddlebackmaine.com', osm_id: 'osm_saddleback' },
  { name: 'Bretton Woods', lat: 44.2613, lon: -71.4442, country: 'US', region: 'New Hampshire', website: 'https://www.brettonwoods.com', osm_id: 'osm_brettonwoods' },
  { name: 'Loon Mountain', lat: 44.0394, lon: -71.6260, country: 'US', region: 'New Hampshire', website: 'https://www.loonmtn.com', osm_id: 'osm_loon' },
  { name: 'Cannon Mountain', lat: 44.1578, lon: -71.6975, country: 'US', region: 'New Hampshire', website: 'https://www.cannonmt.com', osm_id: 'osm_cannonmt' },
  { name: 'Waterville Valley', lat: 43.9676, lon: -71.5022, country: 'US', region: 'New Hampshire', website: 'https://www.waterville.com', osm_id: 'osm_watervillevalley' },
  { name: 'Wildcat Mountain', lat: 44.2566, lon: -71.2411, country: 'US', region: 'New Hampshire', website: 'https://www.skiwildcat.com', osm_id: 'osm_wildcatmt' },

  // --- USA: New York & Mid-Atlantic ---
  { name: 'Whiteface Mountain', lat: 44.3655, lon: -73.9026, country: 'US', region: 'New York', website: 'https://www.whiteface.com', osm_id: 'osm_whiteface' },
  { name: 'Gore Mountain', lat: 43.6724, lon: -74.0063, country: 'US', region: 'New York', website: 'https://www.goremountain.com', osm_id: 'osm_goremtn' },
  { name: 'Hunter Mountain', lat: 42.1765, lon: -74.2264, country: 'US', region: 'New York', website: 'https://www.huntermtn.com', osm_id: 'osm_huntermtn' },
  { name: 'Windham Mountain', lat: 42.2930, lon: -74.2595, country: 'US', region: 'New York', website: 'https://windhammountain.com', osm_id: 'osm_windham' },
  { name: 'Seven Springs', lat: 40.0160, lon: -79.2934, country: 'US', region: 'Pennsylvania', website: 'https://www.7springs.com', osm_id: 'osm_7springs' },
  { name: 'Snowshoe Mountain', lat: 38.4022, lon: -79.9914, country: 'US', region: 'West Virginia', website: 'https://www.snowshoemtn.com', osm_id: 'osm_snowshoe' },

  // --- USA: Midwest ---
  { name: 'Lutsen Mountains', lat: 47.6492, lon: -90.6887, country: 'US', region: 'Minnesota', website: 'https://www.lutsen.com', osm_id: 'osm_lutsen' },
  { name: 'Mount Bohemia', lat: 47.3895, lon: -88.3980, country: 'US', region: 'Michigan', website: 'https://www.mtbohemia.com', osm_id: 'osm_mtbohemia' },

  // --- Canada: British Columbia ---
  { name: 'Whistler Blackcomb', lat: 50.1163, lon: -122.9574, country: 'CA', region: 'British Columbia', website: 'https://www.whistlerblackcomb.com', osm_id: 'osm_whistler' },
  { name: 'Revelstoke', lat: 51.0014, lon: -118.1644, country: 'CA', region: 'British Columbia', website: 'https://www.revelstokemountainresort.com', osm_id: 'osm_revelstoke' },
  { name: 'Big White', lat: 49.7226, lon: -118.9326, country: 'CA', region: 'British Columbia', website: 'https://www.bigwhite.com', osm_id: 'osm_bigwhite' },
  { name: 'Sun Peaks', lat: 50.8837, lon: -119.9000, country: 'CA', region: 'British Columbia', website: 'https://www.sunpeaksresort.com', osm_id: 'osm_sunpeaks' },
  { name: 'Fernie Alpine Resort', lat: 49.4627, lon: -115.0894, country: 'CA', region: 'British Columbia', website: 'https://skifernie.com', osm_id: 'osm_fernie' },
  { name: 'Kicking Horse', lat: 51.2970, lon: -117.0481, country: 'CA', region: 'British Columbia', website: 'https://kickinghorseresort.com', osm_id: 'osm_kickinghorse' },
  { name: 'Silver Star', lat: 50.3587, lon: -119.0618, country: 'CA', region: 'British Columbia', website: 'https://www.skisilverstar.com', osm_id: 'osm_silverstar' },
  { name: 'Red Mountain', lat: 49.1039, lon: -117.8218, country: 'CA', region: 'British Columbia', website: 'https://www.redresort.com', osm_id: 'osm_redmtn' },
  { name: 'Apex Mountain', lat: 49.4049, lon: -119.8907, country: 'CA', region: 'British Columbia', website: 'https://www.apexresort.com', osm_id: 'osm_apexmtn' },
  { name: 'Cypress Mountain', lat: 49.3954, lon: -123.2023, country: 'CA', region: 'British Columbia', website: 'https://www.cypressmountain.com', osm_id: 'osm_cypressmtn' },
  { name: 'Grouse Mountain', lat: 49.3726, lon: -123.0822, country: 'CA', region: 'British Columbia', website: 'https://www.grousemountain.com', osm_id: 'osm_grousemtn' },

  // --- Canada: Alberta ---
  { name: 'Banff Sunshine', lat: 51.0784, lon: -115.7731, country: 'CA', region: 'Alberta', website: 'https://www.skibanff.com', osm_id: 'osm_banffsunshine' },
  { name: 'Lake Louise', lat: 51.4254, lon: -116.1773, country: 'CA', region: 'Alberta', website: 'https://www.skilouise.com', osm_id: 'osm_lakelouise' },
  { name: 'Marmot Basin', lat: 52.8052, lon: -118.0835, country: 'CA', region: 'Alberta', website: 'https://www.skimarmot.com', osm_id: 'osm_marmot' },
  { name: 'Castle Mountain', lat: 49.3220, lon: -114.4042, country: 'CA', region: 'Alberta', website: 'https://www.skicastle.ca', osm_id: 'osm_castlemtn' },

  // --- Canada: Quebec & Eastern Canada ---
  { name: 'Mont-Tremblant', lat: 46.2094, lon: -74.5850, country: 'CA', region: 'Quebec', website: 'https://www.tremblant.ca', osm_id: 'osm_tremblant' },
  { name: 'Le Massif de Charlevoix', lat: 47.2788, lon: -70.6316, country: 'CA', region: 'Quebec', website: 'https://www.lemassif.com', osm_id: 'osm_lemassif' },
  { name: 'Mont Saint-Anne', lat: 47.0819, lon: -70.9090, country: 'CA', region: 'Quebec', website: 'https://www.mont-sainte-anne.com', osm_id: 'osm_montsainteanne' },
  { name: 'Stoneham', lat: 47.1689, lon: -71.3524, country: 'CA', region: 'Quebec', website: 'https://www.ski-stoneham.com', osm_id: 'osm_stoneham' },

  // --- France ---
  { name: 'Chamonix', lat: 45.9237, lon: 6.8694, country: 'FR', region: 'Haute-Savoie', website: 'https://www.chamonix.com', osm_id: 'osm_chamonix' },
  { name: 'Val d\'Isère', lat: 45.4485, lon: 6.9806, country: 'FR', region: 'Savoie', website: 'https://www.valdisere.com', osm_id: 'osm_valdisere' },
  { name: 'Courchevel', lat: 45.4153, lon: 6.6347, country: 'FR', region: 'Savoie', website: 'https://www.courchevel.com', osm_id: 'osm_courchevel' },
  { name: 'Les Deux Alpes', lat: 45.0170, lon: 6.1225, country: 'FR', region: 'Isère', website: 'https://www.les2alpes.com', osm_id: 'osm_les2alpes' },
  { name: 'Méribel', lat: 45.3970, lon: 6.5660, country: 'FR', region: 'Savoie', website: 'https://www.meribel.net', osm_id: 'osm_meribel' },
  { name: 'Tignes', lat: 45.4680, lon: 6.9049, country: 'FR', region: 'Savoie', website: 'https://www.tignes.net', osm_id: 'osm_tignes' },
  { name: 'Alpe d\'Huez', lat: 45.0922, lon: 6.0699, country: 'FR', region: 'Isère', website: 'https://www.alpedhuez.com', osm_id: 'osm_alpedhuez' },
  { name: 'La Plagne', lat: 45.5085, lon: 6.6751, country: 'FR', region: 'Savoie', website: 'https://www.la-plagne.com', osm_id: 'osm_laplagne' },
  { name: 'Les Arcs', lat: 45.5692, lon: 6.8002, country: 'FR', region: 'Savoie', website: 'https://www.lesarcs.com', osm_id: 'osm_lesarcs' },
  { name: 'Morzine', lat: 46.1778, lon: 6.7092, country: 'FR', region: 'Haute-Savoie', website: 'https://www.morzine-avoriaz.com', osm_id: 'osm_morzine' },
  { name: 'Avoriaz', lat: 46.1942, lon: 6.7694, country: 'FR', region: 'Haute-Savoie', website: 'https://www.avoriaz.com', osm_id: 'osm_avoriaz' },
  { name: 'Megève', lat: 45.8564, lon: 6.6172, country: 'FR', region: 'Haute-Savoie', website: 'https://www.megeve.com', osm_id: 'osm_megeve' },
  { name: 'Flaine', lat: 46.0059, lon: 6.6869, country: 'FR', region: 'Haute-Savoie', website: 'https://www.flaine.com', osm_id: 'osm_flaine' },
  { name: 'La Clusaz', lat: 45.9063, lon: 6.4228, country: 'FR', region: 'Haute-Savoie', website: 'https://www.laclusaz.com', osm_id: 'osm_laclusaz' },
  { name: 'Les Gets', lat: 46.1583, lon: 6.6678, country: 'FR', region: 'Haute-Savoie', website: 'https://www.lesgets.com', osm_id: 'osm_lesgets' },
  { name: 'Vars', lat: 44.5577, lon: 6.6993, country: 'FR', region: 'Hautes-Alpes', website: 'https://www.vars-ski.com', osm_id: 'osm_vars' },
  { name: 'Font Romeu', lat: 42.5066, lon: 2.0388, country: 'FR', region: 'Pyrénées-Orientales', website: 'https://www.fontromeu.fr', osm_id: 'osm_fontromeu' },

  // --- Switzerland ---
  { name: 'Zermatt', lat: 46.0207, lon: 7.7491, country: 'CH', region: 'Valais', website: 'https://www.zermatt.ch', osm_id: 'osm_zermatt' },
  { name: 'St. Moritz', lat: 46.4908, lon: 9.8355, country: 'CH', region: 'Graubünden', website: 'https://www.stmoritz.com', osm_id: 'osm_stmoritz' },
  { name: 'Verbier', lat: 46.0964, lon: 7.2283, country: 'CH', region: 'Valais', website: 'https://www.verbier.ch', osm_id: 'osm_verbier' },
  { name: 'Davos Klosters', lat: 46.8027, lon: 9.8360, country: 'CH', region: 'Graubünden', website: 'https://www.davos.ch', osm_id: 'osm_davos' },
  { name: 'Grindelwald', lat: 46.6241, lon: 8.0411, country: 'CH', region: 'Bern', website: 'https://www.grindelwald.ch', osm_id: 'osm_grindelwald' },
  { name: 'Wengen', lat: 46.6082, lon: 7.9218, country: 'CH', region: 'Bern', website: 'https://www.wengen.ch', osm_id: 'osm_wengen' },
  { name: 'Mürren', lat: 46.5588, lon: 7.8928, country: 'CH', region: 'Bern', website: 'https://www.muerren.ch', osm_id: 'osm_murren' },
  { name: 'Saas-Fee', lat: 46.1045, lon: 7.9288, country: 'CH', region: 'Valais', website: 'https://www.saas-fee.ch', osm_id: 'osm_saasfee' },
  { name: 'Engelberg', lat: 46.8218, lon: 8.4078, country: 'CH', region: 'Obwalden', website: 'https://www.engelberg.ch', osm_id: 'osm_engelberg' },
  { name: 'Flims Laax', lat: 46.8363, lon: 9.2836, country: 'CH', region: 'Graubünden', website: 'https://www.laax.com', osm_id: 'osm_flimslaax' },
  { name: 'Crans-Montana', lat: 46.3090, lon: 7.4769, country: 'CH', region: 'Valais', website: 'https://www.crans-montana.ch', osm_id: 'osm_cransmontana' },
  { name: 'Nendaz', lat: 46.1912, lon: 7.2862, country: 'CH', region: 'Valais', website: 'https://www.nendaz.ch', osm_id: 'osm_nendaz' },
  { name: 'Arosa', lat: 46.7834, lon: 9.6768, country: 'CH', region: 'Graubünden', website: 'https://www.arosa.ch', osm_id: 'osm_arosa' },
  { name: 'Gstaad', lat: 46.4753, lon: 7.2869, country: 'CH', region: 'Bern', website: 'https://www.gstaad.ch', osm_id: 'osm_gstaad' },

  // --- Austria ---
  { name: 'St. Anton am Arlberg', lat: 47.1292, lon: 10.2683, country: 'AT', region: 'Tyrol', website: 'https://www.stantonamarlberg.com', osm_id: 'osm_stanton' },
  { name: 'Kitzbühel', lat: 47.4559, lon: 12.3927, country: 'AT', region: 'Tyrol', website: 'https://www.kitzbuehel.com', osm_id: 'osm_kitzbuhel' },
  { name: 'Innsbruck Nordkette', lat: 47.3070, lon: 11.3884, country: 'AT', region: 'Tyrol', website: 'https://www.nordkette.com', osm_id: 'osm_nordkette' },
  { name: 'Sölden', lat: 46.9656, lon: 10.8760, country: 'AT', region: 'Tyrol', website: 'https://www.soelden.com', osm_id: 'osm_soelden' },
  { name: 'Ischgl', lat: 47.0140, lon: 10.2930, country: 'AT', region: 'Tyrol', website: 'https://www.ischgl.com', osm_id: 'osm_ischgl' },
  { name: 'Mayrhofen', lat: 47.1674, lon: 11.8657, country: 'AT', region: 'Tyrol', website: 'https://www.mayrhofen.at', osm_id: 'osm_mayrhofen' },
  { name: 'Lech Zürs', lat: 47.2083, lon: 10.1435, country: 'AT', region: 'Vorarlberg', website: 'https://www.lech-zuers.at', osm_id: 'osm_lechzurs' },
  { name: 'Schladming', lat: 47.3972, lon: 13.6911, country: 'AT', region: 'Styria', website: 'https://www.schladming-dachstein.at', osm_id: 'osm_schladming' },
  { name: 'Zell am See', lat: 47.3253, lon: 12.7980, country: 'AT', region: 'Salzburg', website: 'https://www.zellamsee-kaprun.com', osm_id: 'osm_zellamsee' },
  { name: 'Bad Gastein', lat: 47.1169, lon: 13.1342, country: 'AT', region: 'Salzburg', website: 'https://www.gastein.com', osm_id: 'osm_badgastein' },
  { name: 'Obertauern', lat: 47.2534, lon: 13.5700, country: 'AT', region: 'Salzburg', website: 'https://www.obertauern.com', osm_id: 'osm_obertauern' },
  { name: 'Saalbach-Hinterglemm', lat: 47.3906, lon: 12.6367, country: 'AT', region: 'Salzburg', website: 'https://www.saalbach.com', osm_id: 'osm_saalbach' },
  { name: 'Kaprun', lat: 47.2695, lon: 12.7613, country: 'AT', region: 'Salzburg', website: 'https://www.zellamsee-kaprun.com', osm_id: 'osm_kaprun' },
  { name: 'Serfaus Fiss Ladis', lat: 47.0392, lon: 10.6050, country: 'AT', region: 'Tyrol', website: 'https://www.serfaus-fiss-ladis.at', osm_id: 'osm_serfaus' },

  // --- Italy ---
  { name: 'Cortina d\'Ampezzo', lat: 46.5369, lon: 12.1357, country: 'IT', region: 'Veneto', website: 'https://www.cortina.dolomiti.com', osm_id: 'osm_cortina' },
  { name: 'Val Gardena', lat: 46.5580, lon: 11.6760, country: 'IT', region: 'South Tyrol', website: 'https://www.valgardena.it', osm_id: 'osm_valgardena' },
  { name: 'Cervinia', lat: 45.9325, lon: 7.6317, country: 'IT', region: 'Aosta Valley', website: 'https://www.cervinia.it', osm_id: 'osm_cervinia' },
  { name: 'Courmayeur', lat: 45.7955, lon: 6.9699, country: 'IT', region: 'Aosta Valley', website: 'https://www.courmayeur.com', osm_id: 'osm_courmayeur' },
  { name: 'Livigno', lat: 46.5370, lon: 10.1362, country: 'IT', region: 'Lombardy', website: 'https://www.livigno.eu', osm_id: 'osm_livigno' },
  { name: 'Madonna di Campiglio', lat: 46.2304, lon: 10.8246, country: 'IT', region: 'Trentino', website: 'https://www.campigliodolomiti.it', osm_id: 'osm_madonnacampiglio' },
  { name: 'Sestriere', lat: 44.9591, lon: 6.8766, country: 'IT', region: 'Piedmont', website: 'https://www.vialattea.it', osm_id: 'osm_sestriere' },
  { name: 'Alta Badia', lat: 46.5932, lon: 11.8883, country: 'IT', region: 'South Tyrol', website: 'https://www.altabadia.org', osm_id: 'osm_altabadia' },
  { name: 'Kronplatz', lat: 46.7355, lon: 11.9447, country: 'IT', region: 'South Tyrol', website: 'https://www.kronplatz.com', osm_id: 'osm_kronplatz' },
  { name: 'Bormio', lat: 46.4672, lon: 10.3744, country: 'IT', region: 'Lombardy', website: 'https://www.bormio.eu', osm_id: 'osm_bormio' },
  { name: 'Canazei', lat: 46.4779, lon: 11.7691, country: 'IT', region: 'Trentino', website: 'https://www.fassaski.com', osm_id: 'osm_canazei' },

  // --- Germany ---
  { name: 'Garmisch-Partenkirchen', lat: 47.5004, lon: 11.0950, country: 'DE', region: 'Bavaria', website: 'https://www.gapa.de', osm_id: 'osm_garmisch' },
  { name: 'Oberstdorf', lat: 47.4086, lon: 10.2790, country: 'DE', region: 'Bavaria', website: 'https://www.oberstdorf.de', osm_id: 'osm_oberstdorf' },
  { name: 'Zugspitze', lat: 47.4211, lon: 10.9851, country: 'DE', region: 'Bavaria', website: 'https://www.zugspitze.de', osm_id: 'osm_zugspitze' },
  { name: 'Reit im Winkl', lat: 47.6726, lon: 12.4689, country: 'DE', region: 'Bavaria', website: 'https://www.reitimwinkl.de', osm_id: 'osm_reitimwinkl' },

  // --- Spain & Andorra ---
  { name: 'Sierra Nevada', lat: 37.0956, lon: -3.3963, country: 'ES', region: 'Andalusia', website: 'https://sierranevada.es', osm_id: 'osm_sierranevada' },
  { name: 'Baqueira Beret', lat: 42.6966, lon: 0.9279, country: 'ES', region: 'Catalonia', website: 'https://www.baqueira.es', osm_id: 'osm_baqueira' },
  { name: 'Formigal', lat: 42.7601, lon: -0.3918, country: 'ES', region: 'Aragon', website: 'https://www.aramón.com', osm_id: 'osm_formigal' },
  { name: 'Grandvalira', lat: 42.5394, lon: 1.7235, country: 'AD', region: 'Andorra', website: 'https://www.grandvalira.com', osm_id: 'osm_grandvalira' },

  // --- Scandinavia ---
  { name: 'Åre', lat: 63.3984, lon: 13.0744, country: 'SE', region: 'Jämtland', website: 'https://www.skistar.com/are', osm_id: 'osm_are' },
  { name: 'Sälen', lat: 61.1563, lon: 13.2692, country: 'SE', region: 'Dalarna', website: 'https://www.skistar.com/salen', osm_id: 'osm_salen' },
  { name: 'Vemdalen', lat: 62.4506, lon: 13.8734, country: 'SE', region: 'Härjedalen', website: 'https://www.skistar.com/vemdalen', osm_id: 'osm_vemdalen' },
  { name: 'Hemsedal', lat: 60.8612, lon: 8.3952, country: 'NO', region: 'Viken', website: 'https://www.hemsedal.com', osm_id: 'osm_hemsedal' },
  { name: 'Voss', lat: 60.6282, lon: 6.4169, country: 'NO', region: 'Vestland', website: 'https://www.voss.com', osm_id: 'osm_voss' },
  { name: 'Trysil', lat: 61.3389, lon: 12.2660, country: 'NO', region: 'Innlandet', website: 'https://www.trysil.com', osm_id: 'osm_trysil' },
  { name: 'Geilo', lat: 60.5311, lon: 8.2001, country: 'NO', region: 'Viken', website: 'https://www.geilo.no', osm_id: 'osm_geilo' },
  { name: 'Levi', lat: 67.8039, lon: 24.8141, country: 'FI', region: 'Lapland', website: 'https://www.levi.fi', osm_id: 'osm_levi' },
  { name: 'Ruka', lat: 66.1659, lon: 29.1461, country: 'FI', region: 'Kainuu', website: 'https://www.ruka.fi', osm_id: 'osm_ruka' },
  { name: 'Ylläs', lat: 67.5536, lon: 24.2468, country: 'FI', region: 'Lapland', website: 'https://www.yllas.fi', osm_id: 'osm_yllas' },

  // --- Scotland ---
  { name: 'Cairngorm Mountain', lat: 57.1184, lon: -3.6636, country: 'GB', region: 'Scotland', website: 'https://www.cairngormmountain.co.uk', osm_id: 'osm_cairngorm' },
  { name: 'Glenshee', lat: 56.8786, lon: -3.4034, country: 'GB', region: 'Scotland', website: 'https://www.ski-glenshee.co.uk', osm_id: 'osm_glenshee' },
  { name: 'Nevis Range', lat: 56.8396, lon: -5.0097, country: 'GB', region: 'Scotland', website: 'https://www.nevisrange.co.uk', osm_id: 'osm_nevisrange' },
  { name: 'Glencoe Mountain', lat: 56.6620, lon: -4.8494, country: 'GB', region: 'Scotland', website: 'https://www.glencoemountain.co.uk', osm_id: 'osm_glencoe' },

  // --- Japan ---
  { name: 'Niseko', lat: 42.8625, lon: 140.6987, country: 'JP', region: 'Hokkaido', website: 'https://www.niseko.ne.jp', osm_id: 'osm_niseko' },
  { name: 'Hakuba', lat: 36.6983, lon: 137.8322, country: 'JP', region: 'Nagano', website: 'https://www.hakubavalley.com', osm_id: 'osm_hakuba' },
  { name: 'Nozawa Onsen', lat: 36.9221, lon: 138.6294, country: 'JP', region: 'Nagano', website: 'https://nozawaski.com', osm_id: 'osm_nozawa' },
  { name: 'Furano', lat: 43.3505, lon: 142.3837, country: 'JP', region: 'Hokkaido', website: 'https://www.snowfurano.com', osm_id: 'osm_furano' },
  { name: 'Rusutsu', lat: 42.7516, lon: 140.9035, country: 'JP', region: 'Hokkaido', website: 'https://www.rusutsu.com', osm_id: 'osm_rusutsu' },
  { name: 'Naeba', lat: 36.8889, lon: 138.7355, country: 'JP', region: 'Niigata', website: 'https://www.princehotels.com/naeba', osm_id: 'osm_naeba' },
  { name: 'Shiga Kogen', lat: 36.7939, lon: 138.4870, country: 'JP', region: 'Nagano', website: 'https://www.shigakogen.co.jp', osm_id: 'osm_shigakogen' },
  { name: 'Zao Onsen', lat: 38.1482, lon: 140.4424, country: 'JP', region: 'Yamagata', website: 'https://www.zao-spa.or.jp', osm_id: 'osm_zaoonsen' },
  { name: 'Kiroro', lat: 43.1220, lon: 140.9792, country: 'JP', region: 'Hokkaido', website: 'https://www.kiroro.co.jp', osm_id: 'osm_kiroro' },

  // --- South Korea ---
  { name: 'Yongpyong', lat: 37.6439, lon: 128.6808, country: 'KR', region: 'Gangwon', website: 'https://www.yongpyong.co.kr', osm_id: 'osm_yongpyong' },
  { name: 'High1', lat: 37.1970, lon: 128.7382, country: 'KR', region: 'Gangwon', website: 'https://www.high1.com', osm_id: 'osm_high1' },
  { name: 'Alpensia', lat: 37.6676, lon: 128.7013, country: 'KR', region: 'Gangwon', website: 'https://www.alpensia.com', osm_id: 'osm_alpensia' },

  // --- China ---
  { name: 'Genting Snow Park', lat: 40.9539, lon: 115.4453, country: 'CN', region: 'Hebei', website: 'https://www.gentingresorts.com', osm_id: 'osm_gentingsnow' },
  { name: 'Wanlong Ski Resort', lat: 40.8784, lon: 115.4040, country: 'CN', region: 'Hebei', website: 'https://www.wanlongski.com', osm_id: 'osm_wanlong' },
  { name: 'Yabuli Sun Mountain', lat: 44.3557, lon: 128.5720, country: 'CN', region: 'Heilongjiang', website: 'https://www.yabuli.com.cn', osm_id: 'osm_yabuli' },

  // --- Russia ---
  { name: 'Rosa Khutor', lat: 43.6628, lon: 40.2940, country: 'RU', region: 'Krasnodar Krai', website: 'https://rosaski.com', osm_id: 'osm_rosakhutor' },
  { name: 'Gazprom Ski Resort', lat: 43.6786, lon: 40.3162, country: 'RU', region: 'Krasnodar Krai', website: 'https://alpikasochi.ru', osm_id: 'osm_alpika' },
  { name: 'Sheregesh', lat: 52.9253, lon: 87.9714, country: 'RU', region: 'Kemerovo Oblast', website: 'https://www.sheregesh.ru', osm_id: 'osm_sheregesh' },

  // --- Australia ---
  { name: 'Thredbo', lat: -36.5054, lon: 148.3044, country: 'AU', region: 'New South Wales', website: 'https://www.thredbo.com.au', osm_id: 'osm_thredbo' },
  { name: 'Perisher', lat: -36.3717, lon: 148.4093, country: 'AU', region: 'New South Wales', website: 'https://www.perisher.com.au', osm_id: 'osm_perisher' },
  { name: 'Falls Creek', lat: -36.8650, lon: 147.2820, country: 'AU', region: 'Victoria', website: 'https://www.fallscreek.com.au', osm_id: 'osm_fallscreek' },
  { name: 'Mt. Buller', lat: -37.1496, lon: 146.4367, country: 'AU', region: 'Victoria', website: 'https://www.mtbuller.com.au', osm_id: 'osm_mtbuller' },
  { name: 'Hotham Alpine Resort', lat: -36.9935, lon: 147.1250, country: 'AU', region: 'Victoria', website: 'https://www.mthotham.com.au', osm_id: 'osm_mthotham' },
  { name: 'Charlotte Pass', lat: -36.4334, lon: 148.3348, country: 'AU', region: 'New South Wales', website: 'https://www.charlottepass.com.au', osm_id: 'osm_charlottepass' },

  // --- New Zealand ---
  { name: 'Coronet Peak', lat: -45.0871, lon: 168.7282, country: 'NZ', region: 'Otago', website: 'https://www.coronetpeak.co.nz', osm_id: 'osm_coronetpeak' },
  { name: 'The Remarkables', lat: -45.0467, lon: 168.8147, country: 'NZ', region: 'Otago', website: 'https://www.theremarkables.co.nz', osm_id: 'osm_remarkables' },
  { name: 'Mt. Hutt', lat: -43.4987, lon: 171.5264, country: 'NZ', region: 'Canterbury', website: 'https://www.mthutt.co.nz', osm_id: 'osm_mthutt' },
  { name: 'Cardrona Alpine Resort', lat: -44.8766, lon: 168.9530, country: 'NZ', region: 'Otago', website: 'https://www.cardrona.com', osm_id: 'osm_cardrona' },
  { name: 'Treble Cone', lat: -44.5740, lon: 168.8679, country: 'NZ', region: 'Otago', website: 'https://www.treblecone.com', osm_id: 'osm_treblecone' },
  { name: 'Turoa', lat: -39.2964, lon: 175.5386, country: 'NZ', region: 'Manawatu-Wanganui', website: 'https://www.mtruapehu.com', osm_id: 'osm_turoa' },
  { name: 'Whakapapa', lat: -39.2321, lon: 175.5637, country: 'NZ', region: 'Waikato', website: 'https://www.mtruapehu.com', osm_id: 'osm_whakapapa' },

  // --- South America: Chile ---
  { name: 'Valle Nevado', lat: -33.3558, lon: -70.2546, country: 'CL', region: 'Santiago Metro', website: 'https://www.vallenevado.com', osm_id: 'osm_vallenevado' },
  { name: 'Portillo', lat: -32.8325, lon: -70.1270, country: 'CL', region: 'Valparaíso', website: 'https://www.skiportillo.com', osm_id: 'osm_portillo' },
  { name: 'El Colorado', lat: -33.3508, lon: -70.2905, country: 'CL', region: 'Santiago Metro', website: 'https://www.elcolorado.cl', osm_id: 'osm_elcolorado' },
  { name: 'La Parva', lat: -33.3524, lon: -70.2771, country: 'CL', region: 'Santiago Metro', website: 'https://www.laparva.cl', osm_id: 'osm_laparva' },
  { name: 'Nevados de Chillán', lat: -36.9057, lon: -71.3862, country: 'CL', region: 'Ñuble', website: 'https://www.nevadosdechillan.com', osm_id: 'osm_chillan' },
  { name: 'Pucón (Volcán Villarrica)', lat: -39.3995, lon: -71.7944, country: 'CL', region: 'Araucanía', website: 'https://www.skipucon.cl', osm_id: 'osm_pucon' },

  // --- South America: Argentina ---
  { name: 'Cerro Catedral', lat: -41.1649, lon: -71.4432, country: 'AR', region: 'Río Negro', website: 'https://www.catedralaltapatagonia.com', osm_id: 'osm_catedral' },
  { name: 'Las Leñas', lat: -35.1625, lon: -70.0761, country: 'AR', region: 'Mendoza', website: 'https://www.laslenas.com', osm_id: 'osm_laslenas' },
  { name: 'Chapelco', lat: -40.3249, lon: -71.3756, country: 'AR', region: 'Neuquén', website: 'https://www.chapelco.com.ar', osm_id: 'osm_chapelco' },
  { name: 'Cerro Castor', lat: -54.7823, lon: -68.1548, country: 'AR', region: 'Tierra del Fuego', website: 'https://www.cerrocastor.com', osm_id: 'osm_cerrocastor' },
  { name: 'Caviahue', lat: -37.8744, lon: -71.0301, country: 'AR', region: 'Neuquén', website: 'https://www.caviahue-copahue.com.ar', osm_id: 'osm_caviahue' },

  // --- Bulgaria ---
  { name: 'Borovets', lat: 42.2697, lon: 23.5960, country: 'BG', region: 'Sofia Province', website: 'https://www.borovets-bg.com', osm_id: 'osm_borovets' },
  { name: 'Bansko', lat: 41.8398, lon: 23.4887, country: 'BG', region: 'Blagoevgrad', website: 'https://www.banskoski.com', osm_id: 'osm_bansko' },
  { name: 'Pamporovo', lat: 41.6389, lon: 24.6927, country: 'BG', region: 'Smolyan', website: 'https://www.pamporovo.bg', osm_id: 'osm_pamporovo' },

  // --- Romania ---
  { name: 'Poiana Brasov', lat: 45.5986, lon: 25.5520, country: 'RO', region: 'Brașov', website: 'https://www.poiana-brasov.com', osm_id: 'osm_poianabrasov' },
  { name: 'Sinaia', lat: 45.3532, lon: 25.5544, country: 'RO', region: 'Prahova', website: 'https://www.sinaia.ro', osm_id: 'osm_sinaia' },
  { name: 'Predeal', lat: 45.5094, lon: 25.5779, country: 'RO', region: 'Brașov', website: 'https://www.predeal.ro', osm_id: 'osm_predeal' },

  // --- Czech Republic ---
  { name: 'Špindlerův Mlýn', lat: 50.7293, lon: 15.6107, country: 'CZ', region: 'Hradec Králové', website: 'https://www.skiareal.com', osm_id: 'osm_spindleruv' },
  { name: 'Harrachov', lat: 50.7724, lon: 15.4099, country: 'CZ', region: 'Liberec', website: 'https://www.skiareal-harrachov.cz', osm_id: 'osm_harrachov' },
  { name: 'Pec pod Sněžkou', lat: 50.6924, lon: 15.7337, country: 'CZ', region: 'Hradec Králové', website: 'https://www.pecpodsnezkou.cz', osm_id: 'osm_pecpodsnezkou' },

  // --- Slovakia ---
  { name: 'Jasná Nízke Tatry', lat: 48.9363, lon: 19.5942, country: 'SK', region: 'Banská Bystrica', website: 'https://www.jasna.sk', osm_id: 'osm_jasna' },
  { name: 'Štrbské Pleso', lat: 49.1205, lon: 20.0592, country: 'SK', region: 'Prešov', website: 'https://www.vt.sk', osm_id: 'osm_strbskepleso' },
  { name: 'Donovaly', lat: 48.8861, lon: 19.2121, country: 'SK', region: 'Banská Bystrica', website: 'https://www.parksnow.sk', osm_id: 'osm_donovaly' },

  // --- Poland ---
  { name: 'Zakopane Kasprowy Wierch', lat: 49.2321, lon: 19.9817, country: 'PL', region: 'Lesser Poland', website: 'https://www.pkl.pl', osm_id: 'osm_kasprowy' },
  { name: 'Białka Tatrzańska', lat: 49.4012, lon: 20.1351, country: 'PL', region: 'Lesser Poland', website: 'https://www.bialka-tatrzanska.pl', osm_id: 'osm_bialka' },
  { name: 'Szczyrk Mountain Resort', lat: 49.7152, lon: 19.0465, country: 'PL', region: 'Silesia', website: 'https://www.szczyrkmountainresort.com', osm_id: 'osm_szczyrk' },

  // --- Slovenia ---
  { name: 'Kranjska Gora', lat: 46.4836, lon: 13.7905, country: 'SI', region: 'Upper Carniola', website: 'https://www.kranjska-gora.eu', osm_id: 'osm_kranjskagora' },
  { name: 'Krvavec', lat: 46.3063, lon: 14.5374, country: 'SI', region: 'Upper Carniola', website: 'https://www.rtc-krvavec.si', osm_id: 'osm_krvavec' },
  { name: 'Vogel', lat: 46.2647, lon: 13.8451, country: 'SI', region: 'Littoral', website: 'https://www.vogel.si', osm_id: 'osm_vogel' },

  // --- Serbia ---
  { name: 'Kopaonik', lat: 43.2883, lon: 20.8143, country: 'RS', region: 'Raška', website: 'https://www.skijalistasrbije.rs', osm_id: 'osm_kopaonik' },
  { name: 'Zlatibor', lat: 43.7287, lon: 19.7022, country: 'RS', region: 'Zlatibor', website: 'https://www.zlatibor.rs', osm_id: 'osm_zlatibor' },

  // --- Bosnia and Herzegovina ---
  { name: 'Jahorina', lat: 43.7281, lon: 18.5687, country: 'BA', region: 'Republika Srpska', website: 'https://www.oc-jahorina.com', osm_id: 'osm_jahorina' },
  { name: 'Bjelašnica', lat: 43.7190, lon: 18.2512, country: 'BA', region: 'Federation of BiH', website: 'https://www.bjelasnica.ba', osm_id: 'osm_bjelasnica' },

  // --- Greece ---
  { name: 'Parnassos Ski Centre', lat: 38.5368, lon: 22.5761, country: 'GR', region: 'Central Greece', website: 'https://www.parnassos-ski.gr', osm_id: 'osm_parnassos' },
  { name: 'Vasilitsa', lat: 40.0333, lon: 21.1333, country: 'GR', region: 'Western Macedonia', website: 'https://www.vasilitsa.com', osm_id: 'osm_vasilitsa' },

  // --- Turkey ---
  { name: 'Uludağ', lat: 40.1144, lon: 29.1264, country: 'TR', region: 'Bursa', website: 'https://www.uludag.com.tr', osm_id: 'osm_uludag' },
  { name: 'Palandöken', lat: 39.8571, lon: 41.2268, country: 'TR', region: 'Erzurum', website: 'https://www.palandoken.com', osm_id: 'osm_palandoken' },
  { name: 'Kartalkaya', lat: 40.8521, lon: 31.5483, country: 'TR', region: 'Bolu', website: 'https://www.kartalkaya.com', osm_id: 'osm_kartalkaya' },

  // --- Lebanon ---
  { name: 'Mzaar Kfardebian', lat: 34.0714, lon: 35.9852, country: 'LB', region: 'Mount Lebanon', website: 'https://www.mzaar.com', osm_id: 'osm_mzaar' },
  { name: 'Faraya Mzaar', lat: 34.0697, lon: 35.9899, country: 'LB', region: 'Mount Lebanon', website: 'https://www.faraya.com', osm_id: 'osm_faraya' },

  // --- Georgia (country) ---
  { name: 'Gudauri', lat: 42.4779, lon: 44.4789, country: 'GE', region: 'Mtskheta-Mtianeti', website: 'https://www.gudauri.travel', osm_id: 'osm_gudauri' },
  { name: 'Bakuriani', lat: 41.7496, lon: 43.5244, country: 'GE', region: 'Samtskhe-Javakheti', website: 'https://www.bakuriani.ge', osm_id: 'osm_bakuriani' },

  // --- Kazakhstan ---
  { name: 'Shymbulak', lat: 43.1502, lon: 77.0830, country: 'KZ', region: 'Almaty', website: 'https://www.shymbulak.com', osm_id: 'osm_shymbulak' },

  // --- Iran ---
  { name: 'Dizin', lat: 36.1004, lon: 51.3923, country: 'IR', region: 'Tehran', website: 'https://www.dizin.ir', osm_id: 'osm_dizin' },
  { name: 'Shemshak', lat: 36.0716, lon: 51.5064, country: 'IR', region: 'Tehran', website: 'https://www.shemshak.ir', osm_id: 'osm_shemshak' },

  // --- Morocco ---
  { name: 'Oukaimeden', lat: 31.2044, lon: -7.8667, country: 'MA', region: 'Marrakesh-Safi', website: 'https://www.oukaimeden.com', osm_id: 'osm_oukaimeden' },

  // --- South Africa ---
  { name: 'Tiffindell Ski Resort', lat: -30.7097, lon: 28.2010, country: 'ZA', region: 'Eastern Cape', website: 'https://www.tiffindell.co.za', osm_id: 'osm_tiffindell' },

  // --- Lesotho ---
  { name: 'Afriski Mountain Resort', lat: -29.2175, lon: 28.8845, country: 'LS', region: 'Butha-Buthe', website: 'https://www.afriski.net', osm_id: 'osm_afriski' },

  // --- India ---
  { name: 'Gulmarg', lat: 34.0462, lon: 74.3808, country: 'IN', region: 'Jammu & Kashmir', website: 'https://www.gulmarg.net', osm_id: 'osm_gulmarg' },
  { name: 'Auli', lat: 30.5243, lon: 79.5639, country: 'IN', region: 'Uttarakhand', website: 'https://www.gmvnl.in', osm_id: 'osm_auli' },

  // --- China (additional) ---
  { name: 'Thaiwoo Ski Resort', lat: 40.5880, lon: 115.5303, country: 'CN', region: 'Hebei', website: 'https://www.thaiwoo.com', osm_id: 'osm_thaiwoo' },
  { name: 'Beidahu Ski Resort', lat: 43.5760, lon: 127.1690, country: 'CN', region: 'Jilin', website: 'https://www.beidahu.com', osm_id: 'osm_beidahu' },

  // --- Japan (additional) ---
  { name: 'Appi Kogen', lat: 39.9720, lon: 141.0006, country: 'JP', region: 'Iwate', website: 'https://www.appi.co.jp', osm_id: 'osm_appikogen' },
  { name: 'Myoko Kogen', lat: 37.0217, lon: 138.1063, country: 'JP', region: 'Niigata', website: 'https://www.myoko.tv', osm_id: 'osm_myokokogen' },
  { name: 'Hakkoda Ropeway', lat: 40.6501, lon: 140.8729, country: 'JP', region: 'Aomori', website: 'https://www.hakkoda-ropeway.jp', osm_id: 'osm_hakkoda' },

  // --- South Korea (additional) ---
  { name: 'Jiri Mountain Ski Resort', lat: 35.3379, lon: 127.7313, country: 'KR', region: 'South Jeolla', website: 'https://www.jirisan.go.kr', osm_id: 'osm_jirisan' },

  // --- Russia (additional) ---
  { name: 'Arkhyz', lat: 43.5698, lon: 41.2890, country: 'RU', region: 'Karachay-Cherkessia', website: 'https://www.arch-ski.ru', osm_id: 'osm_arkhyz' },
  { name: 'Dombai', lat: 43.2700, lon: 41.7208, country: 'RU', region: 'Karachay-Cherkessia', website: 'https://www.dombai.info', osm_id: 'osm_dombai' },

  // --- Norway (additional) ---
  { name: 'Hafjell', lat: 61.2667, lon: 10.4833, country: 'NO', region: 'Innlandet', website: 'https://www.hafjell.no', osm_id: 'osm_hafjell' },
  { name: 'Kvitfjell', lat: 61.4667, lon: 10.1167, country: 'NO', region: 'Innlandet', website: 'https://www.kvitfjell.no', osm_id: 'osm_kvitfjell' },

  // --- Sweden (additional) ---
  { name: 'Idre Fjäll', lat: 61.8714, lon: 13.1083, country: 'SE', region: 'Dalarna', website: 'https://www.idrefjall.se', osm_id: 'osm_idrefjall' },
  { name: 'Romme Alpin', lat: 60.4406, lon: 15.6422, country: 'SE', region: 'Dalarna', website: 'https://www.rommealpin.se', osm_id: 'osm_rommealpin' },
  { name: 'Björnrike', lat: 62.6167, lon: 14.0667, country: 'SE', region: 'Jämtland', website: 'https://www.bjornrike.com', osm_id: 'osm_bjornrike' },

  // --- Finland (additional) ---
  { name: 'Pyhä-Luosto', lat: 66.9903, lon: 27.0622, country: 'FI', region: 'Lapland', website: 'https://www.pyhaluosto.fi', osm_id: 'osm_pyhaluosto' },
  { name: 'Saariselkä', lat: 68.4223, lon: 27.4225, country: 'FI', region: 'Lapland', website: 'https://www.saariselka.fi', osm_id: 'osm_saariselka' },

  // --- Germany (additional) ---
  { name: 'Berchtesgaden', lat: 47.6275, lon: 13.0008, country: 'DE', region: 'Bavaria', website: 'https://www.berchtesgadener-land.com', osm_id: 'osm_berchtesgaden' },
  { name: 'Oberstaufen', lat: 47.5516, lon: 10.0197, country: 'DE', region: 'Bavaria', website: 'https://www.oberstaufen.de', osm_id: 'osm_oberstaufen' },
  { name: 'Balderschwang', lat: 47.4957, lon: 10.1476, country: 'DE', region: 'Bavaria', website: 'https://www.balderschwang.de', osm_id: 'osm_balderschwang' },
  { name: 'Feldberg Schwarzwald', lat: 47.8744, lon: 8.0056, country: 'DE', region: 'Baden-Württemberg', website: 'https://www.liftverbund-feldberg.de', osm_id: 'osm_feldberg' },

  // --- France (additional) ---
  { name: 'Serre Chevalier', lat: 44.9197, lon: 6.5493, country: 'FR', region: 'Provence-Alpes-Côte d\'Azur', website: 'https://www.serre-chevalier.com', osm_id: 'osm_serrechevalier' },
  { name: 'Isola 2000', lat: 44.1896, lon: 7.1630, country: 'FR', region: 'Provence-Alpes-Côte d\'Azur', website: 'https://www.isola2000.com', osm_id: 'osm_isola2000' },
  { name: 'Pra-Loup', lat: 44.3793, lon: 6.5973, country: 'FR', region: 'Provence-Alpes-Côte d\'Azur', website: 'https://www.praloup.com', osm_id: 'osm_praloup' },

  // --- Switzerland (additional) ---
  { name: 'Villars-sur-Ollon', lat: 46.3040, lon: 7.0530, country: 'CH', region: 'Vaud', website: 'https://www.villars.ch', osm_id: 'osm_villars' },
  { name: 'Leysin', lat: 46.3413, lon: 7.0044, country: 'CH', region: 'Vaud', website: 'https://www.leysin.ch', osm_id: 'osm_leysin' },
  { name: 'Champéry', lat: 46.1757, lon: 6.8688, country: 'CH', region: 'Valais', website: 'https://www.champery.ch', osm_id: 'osm_champery' },

  // --- Austria (additional) ---
  { name: 'Rauris', lat: 47.2256, lon: 12.9986, country: 'AT', region: 'Salzburg', website: 'https://www.rauris.net', osm_id: 'osm_rauris' },
  { name: 'Hochgurgl', lat: 46.8761, lon: 11.0345, country: 'AT', region: 'Tyrol', website: 'https://www.hochgurgl.com', osm_id: 'osm_hochgurgl' },
  { name: 'Wagrain', lat: 47.3345, lon: 13.3031, country: 'AT', region: 'Salzburg', website: 'https://www.snow-space.com', osm_id: 'osm_wagrain' },

  // --- Italy (additional) ---
  { name: 'Passo Tonale', lat: 46.2608, lon: 10.5804, country: 'IT', region: 'Trentino', website: 'https://www.passotonale.it', osm_id: 'osm_passotonale' },

  // --- Spain (additional) ---
  { name: 'Masella', lat: 42.3167, lon: 1.9167, country: 'ES', region: 'Catalonia', website: 'https://www.masella.com', osm_id: 'osm_masella' },

  // --- United Kingdom (additional) ---
  { name: 'The Lecht', lat: 57.3622, lon: -3.2636, country: 'GB', region: 'Scotland', website: 'https://www.lecht.co.uk', osm_id: 'osm_thelecht' },

  // --- Canada (additional) ---
  { name: 'Nakiska', lat: 50.9358, lon: -115.1479, country: 'CA', region: 'Alberta', website: 'https://www.skinakiska.com', osm_id: 'osm_nakiska' },
  { name: 'Sunshine Village', lat: 51.0773, lon: -115.7717, country: 'CA', region: 'Alberta', website: 'https://www.skibanff.com', osm_id: 'osm_sunshinevillage' },

  // --- USA: Mid-Atlantic & Southeast ---
  { name: 'Wisp Resort', lat: 39.5337, lon: -79.3590, country: 'US', region: 'Maryland', website: 'https://www.wispresort.com', osm_id: 'osm_wisp' },
  { name: 'Whitetail Resort', lat: 39.7461, lon: -77.7950, country: 'US', region: 'Pennsylvania', website: 'https://www.skiwhitetail.com', osm_id: 'osm_whitetail' },
  { name: 'Seven Springs Mountain Resort', lat: 39.8884, lon: -79.3093, country: 'US', region: 'Pennsylvania', website: 'https://www.7springs.com', osm_id: 'osm_sevensprings' },
  { name: 'Winterplace', lat: 37.8167, lon: -81.1500, country: 'US', region: 'West Virginia', website: 'https://www.winterplace.com', osm_id: 'osm_winterplace' },

  // --- USA: Midwest ---
  { name: 'Boyne Mountain', lat: 45.1680, lon: -84.9185, country: 'US', region: 'Michigan', website: 'https://www.boynemountain.com', osm_id: 'osm_boynemountain' },
  { name: 'Crystal Mountain Michigan', lat: 44.5073, lon: -85.8229, country: 'US', region: 'Michigan', website: 'https://www.crystalmountain.com', osm_id: 'osm_crystalmtnmi' },

  // --- USA: New York & Mid-Atlantic ---
];

export { SEED_RESORTS };

export async function seed() {
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

// Only run when executed directly (not when imported by tests or other modules)
const isMain = process.argv[1] && process.argv[1].endsWith('seedResorts.js');
if (isMain) {
  seed();
}
