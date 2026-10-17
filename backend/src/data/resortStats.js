/**
 * Terrain statistics for major resorts, keyed by osm_id.
 * Approximate figures compiled from resort-published stats (piste maps / official sites).
 * Percentages are share of marked terrain: easy (green/blue-EU), intermediate (blue-NA/red-EU),
 * advanced (black & expert). easy + inter + adv should sum to 100.
 * pisteKm may refer to the full connected ski area where resorts share a domain.
 * parks = number of terrain/snow parks. Fields may be null when not reliably known.
 */
export const RESORT_STATS = {
  // --- USA ---
  osm_vail: { pisteKm: 234, lifts: 31, parks: 3, easy: 18, inter: 29, adv: 53 },
  osm_aspen: { pisteKm: 237, lifts: 40, parks: 3, easy: 5, inter: 48, adv: 47 },
  osm_snowmass: { pisteKm: 150, lifts: 20, parks: 3, easy: 5, inter: 48, adv: 47 },
  osm_breckenridge: { pisteKm: 153, lifts: 35, parks: 4, easy: 11, inter: 31, adv: 58 },
  osm_steamboat: { pisteKm: 165, lifts: 18, parks: 4, easy: 14, inter: 42, adv: 44 },
  osm_telluride: { pisteKm: 148, lifts: 19, parks: 2, easy: 23, inter: 36, adv: 41 },
  osm_copper: { pisteKm: 126, lifts: 24, parks: 3, easy: 21, inter: 25, adv: 54 },
  osm_winterpark: { pisteKm: 166, lifts: 23, parks: 7, easy: 8, inter: 36, adv: 56 },
  osm_keystone: { pisteKm: 128, lifts: 20, parks: 1, easy: 19, inter: 32, adv: 49 },
  osm_abasin: { pisteKm: 34, lifts: 9, parks: 1, easy: 7, inter: 20, adv: 73 },
  osm_jacksonhole: { pisteKm: 116, lifts: 13, parks: 2, easy: 10, inter: 40, adv: 50 },
  osm_bigsky: { pisteKm: 300, lifts: 39, parks: 5, easy: 15, inter: 25, adv: 60 },
  osm_parkcity: { pisteKm: 250, lifts: 41, parks: 6, easy: 8, inter: 42, adv: 50 },
  osm_snowbird: { pisteKm: 140, lifts: 11, parks: 1, easy: 27, inter: 38, adv: 35 },
  osm_alta: { pisteKm: 119, lifts: 6, parks: 0, easy: 15, inter: 30, adv: 55 },
  osm_deervalley: { pisteKm: 103, lifts: 21, parks: 0, easy: 27, inter: 41, adv: 32 },
  osm_mammoth: { pisteKm: 150, lifts: 25, parks: 10, easy: 25, inter: 40, adv: 35 },
  osm_palisades: { pisteKm: 270, lifts: 29, parks: 4, easy: 25, inter: 45, adv: 30 },
  osm_heavenly: { pisteKm: 150, lifts: 28, parks: 3, easy: 20, inter: 45, adv: 35 },
  osm_northstar: { pisteKm: 100, lifts: 20, parks: 5, easy: 13, inter: 60, adv: 27 },
  osm_kirkwood: { pisteKm: 75, lifts: 15, parks: 1, easy: 12, inter: 30, adv: 58 },
  osm_mtbachelor: { pisteKm: 110, lifts: 15, parks: 5, easy: 15, inter: 35, adv: 50 },
  osm_crystalmtn: { pisteKm: 80, lifts: 11, parks: 1, easy: 10, inter: 54, adv: 36 },
  osm_stevenspass: { pisteKm: 50, lifts: 10, parks: 2, easy: 11, inter: 54, adv: 35 },
  osm_mtbaker: { pisteKm: 40, lifts: 10, parks: 1, easy: 24, inter: 45, adv: 31 },
  osm_killington: { pisteKm: 125, lifts: 22, parks: 6, easy: 25, inter: 35, adv: 40 },
  osm_stowe: { pisteKm: 65, lifts: 12, parks: 3, easy: 16, inter: 59, adv: 25 },
  osm_sugarbush: { pisteKm: 85, lifts: 16, parks: 2, easy: 20, inter: 45, adv: 35 },
  osm_jaypeak: { pisteKm: 50, lifts: 9, parks: 2, easy: 20, inter: 40, adv: 40 },
  osm_okemo: { pisteKm: 80, lifts: 20, parks: 6, easy: 31, inter: 38, adv: 31 },
  osm_sundayriver: { pisteKm: 90, lifts: 18, parks: 6, easy: 33, inter: 37, adv: 30 },
  osm_sugarloaf: { pisteKm: 95, lifts: 13, parks: 4, easy: 25, inter: 29, adv: 46 },
  osm_whiteface: { pisteKm: 40, lifts: 11, parks: 2, easy: 20, inter: 43, adv: 37 },
  osm_taos: { pisteKm: 65, lifts: 14, parks: 2, easy: 24, inter: 25, adv: 51 },

  // --- Canada ---
  osm_whistler: { pisteKm: 200, lifts: 37, parks: 5, easy: 18, inter: 55, adv: 27 },
  osm_revelstoke: { pisteKm: 75, lifts: 8, parks: 1, easy: 12, inter: 43, adv: 45 },
  osm_bigwhite: { pisteKm: 119, lifts: 16, parks: 2, easy: 18, inter: 54, adv: 28 },
  osm_sunpeaks: { pisteKm: 138, lifts: 13, parks: 2, easy: 10, inter: 58, adv: 32 },
  osm_fernie: { pisteKm: 145, lifts: 10, parks: 1, easy: 12, inter: 38, adv: 50 },
  osm_kickinghorse: { pisteKm: 128, lifts: 5, parks: 0, easy: 20, inter: 20, adv: 60 },
  osm_lakelouise: { pisteKm: 145, lifts: 11, parks: 1, easy: 25, inter: 45, adv: 30 },
  osm_banffsunshine: { pisteKm: 137, lifts: 12, parks: 1, easy: 20, inter: 55, adv: 25 },
  osm_tremblant: { pisteKm: 96, lifts: 14, parks: 4, easy: 22, inter: 32, adv: 46 },

  // --- France ---
  osm_chamonix: { pisteKm: 115, lifts: 47, parks: 2, easy: 33, inter: 42, adv: 25 },
  osm_valdisere: { pisteKm: 300, lifts: 75, parks: 2, easy: 46, inter: 38, adv: 16 },
  osm_tignes: { pisteKm: 300, lifts: 75, parks: 1, easy: 40, inter: 42, adv: 18 },
  osm_courchevel: { pisteKm: 150, lifts: 58, parks: 2, easy: 45, inter: 37, adv: 18 },
  osm_les2alpes: { pisteKm: 200, lifts: 47, parks: 1, easy: 48, inter: 35, adv: 17 },
  osm_meribel: { pisteKm: 150, lifts: 45, parks: 2, easy: 42, inter: 40, adv: 18 },
  osm_alpedhuez: { pisteKm: 250, lifts: 67, parks: 1, easy: 44, inter: 35, adv: 21 },
  osm_laplagne: { pisteKm: 225, lifts: 70, parks: 2, easy: 52, inter: 32, adv: 16 },
  osm_lesarcs: { pisteKm: 200, lifts: 52, parks: 2, easy: 47, inter: 36, adv: 17 },
  osm_morzine: { pisteKm: 120, lifts: 47, parks: 1, easy: 44, inter: 42, adv: 14 },
  osm_avoriaz: { pisteKm: 75, lifts: 35, parks: 5, easy: 45, inter: 40, adv: 15 },
  osm_megeve: { pisteKm: 325, lifts: 79, parks: 1, easy: 42, inter: 44, adv: 14 },
  osm_flaine: { pisteKm: 140, lifts: 22, parks: 1, easy: 44, inter: 40, adv: 16 },
  osm_laclusaz: { pisteKm: 125, lifts: 49, parks: 2, easy: 47, inter: 37, adv: 16 },
  osm_serrechevalier: { pisteKm: 250, lifts: 60, parks: 1, easy: 46, inter: 36, adv: 18 },

  // --- Switzerland ---
  osm_zermatt: { pisteKm: 360, lifts: 52, parks: 1, easy: 21, inter: 61, adv: 18 },
  osm_verbier: { pisteKm: 410, lifts: 67, parks: 1, easy: 33, inter: 43, adv: 24 },
  osm_stmoritz: { pisteKm: 350, lifts: 58, parks: 1, easy: 20, inter: 70, adv: 10 },
  osm_davos: { pisteKm: 300, lifts: 57, parks: 2, easy: 30, inter: 48, adv: 22 },
  osm_grindelwald: { pisteKm: 211, lifts: 26, parks: 2, easy: 30, inter: 50, adv: 20 },
  osm_saasfee: { pisteKm: 100, lifts: 22, parks: 1, easy: 25, inter: 50, adv: 25 },
  osm_engelberg: { pisteKm: 82, lifts: 24, parks: 1, easy: 30, inter: 42, adv: 28 },
  osm_flimslaax: { pisteKm: 224, lifts: 28, parks: 4, easy: 29, inter: 45, adv: 26 },
  osm_cransmontana: { pisteKm: 140, lifts: 24, parks: 1, easy: 38, inter: 50, adv: 12 },
  osm_arosa: { pisteKm: 225, lifts: 43, parks: 1, easy: 33, inter: 47, adv: 20 },

  // --- Austria ---
  osm_stanton: { pisteKm: 302, lifts: 88, parks: 1, easy: 43, inter: 41, adv: 16 },
  osm_lechzurs: { pisteKm: 302, lifts: 88, parks: 1, easy: 43, inter: 41, adv: 16 },
  osm_kitzbuhel: { pisteKm: 188, lifts: 57, parks: 1, easy: 54, inter: 33, adv: 13 },
  osm_soelden: { pisteKm: 144, lifts: 31, parks: 1, easy: 48, inter: 32, adv: 20 },
  osm_ischgl: { pisteKm: 239, lifts: 45, parks: 1, easy: 20, inter: 61, adv: 19 },
  osm_mayrhofen: { pisteKm: 142, lifts: 57, parks: 2, easy: 28, inter: 56, adv: 16 },
  osm_saalbach: { pisteKm: 270, lifts: 70, parks: 3, easy: 52, inter: 36, adv: 12 },
  osm_zellamsee: { pisteKm: 77, lifts: 28, parks: 1, easy: 40, inter: 48, adv: 12 },
  osm_kaprun: { pisteKm: 61, lifts: 21, parks: 2, easy: 33, inter: 44, adv: 23 },
  osm_obertauern: { pisteKm: 100, lifts: 26, parks: 1, easy: 60, inter: 35, adv: 5 },
  osm_schladming: { pisteKm: 123, lifts: 44, parks: 2, easy: 33, inter: 56, adv: 11 },
  osm_serfaus: { pisteKm: 214, lifts: 68, parks: 3, easy: 47, inter: 41, adv: 12 },
  osm_badgastein: { pisteKm: 170, lifts: 41, parks: 1, easy: 35, inter: 50, adv: 15 },

  // --- Italy ---
  osm_cortina: { pisteKm: 120, lifts: 34, parks: 1, easy: 42, inter: 45, adv: 13 },
  osm_valgardena: { pisteKm: 175, lifts: 79, parks: 2, easy: 30, inter: 60, adv: 10 },
  osm_cervinia: { pisteKm: 150, lifts: 19, parks: 1, easy: 25, inter: 62, adv: 13 },
  osm_livigno: { pisteKm: 115, lifts: 31, parks: 4, easy: 38, inter: 50, adv: 12 },
  osm_madonnacampiglio: { pisteKm: 150, lifts: 57, parks: 2, easy: 42, inter: 45, adv: 13 },
  osm_altabadia: { pisteKm: 130, lifts: 53, parks: 1, easy: 52, inter: 38, adv: 10 },
  osm_kronplatz: { pisteKm: 121, lifts: 32, parks: 2, easy: 36, inter: 49, adv: 15 },
  osm_sestriere: { pisteKm: 400, lifts: 70, parks: 2, easy: 30, inter: 50, adv: 20 },
  osm_courmayeur: { pisteKm: 57, lifts: 18, parks: 1, easy: 26, inter: 53, adv: 21 },

  // --- Spain & Andorra ---
  osm_grandvalira: { pisteKm: 210, lifts: 66, parks: 3, easy: 40, inter: 40, adv: 20 },
  osm_baqueira: { pisteKm: 165, lifts: 36, parks: 1, easy: 42, inter: 42, adv: 16 },
  osm_sierranevada: { pisteKm: 110, lifts: 19, parks: 1, easy: 40, inter: 45, adv: 15 },
  osm_formigal: { pisteKm: 137, lifts: 21, parks: 2, easy: 38, inter: 44, adv: 18 },

  // --- Scandinavia ---
  osm_are: { pisteKm: 89, lifts: 42, parks: 3, easy: 45, inter: 40, adv: 15 },
  osm_hemsedal: { pisteKm: 44, lifts: 21, parks: 3, easy: 45, inter: 35, adv: 20 },
  osm_trysil: { pisteKm: 68, lifts: 31, parks: 3, easy: 45, inter: 40, adv: 15 },
  osm_levi: { pisteKm: 43, lifts: 27, parks: 2, easy: 50, inter: 40, adv: 10 },
  osm_ruka: { pisteKm: 21, lifts: 22, parks: 3, easy: 45, inter: 45, adv: 10 },

  // --- Japan ---
  osm_niseko: { pisteKm: 47, lifts: 30, parks: 3, easy: 30, inter: 40, adv: 30 },
  osm_hakuba: { pisteKm: 137, lifts: 100, parks: 5, easy: 30, inter: 45, adv: 25 },
  osm_nozawa: { pisteKm: 50, lifts: 19, parks: 2, easy: 40, inter: 30, adv: 30 },
  osm_furano: { pisteKm: 25, lifts: 9, parks: 1, easy: 40, inter: 40, adv: 20 },
  osm_rusutsu: { pisteKm: 42, lifts: 18, parks: 2, easy: 30, inter: 40, adv: 30 },
};
