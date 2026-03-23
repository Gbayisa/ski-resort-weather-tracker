/**
 * Haversine formula to compute distance between two lat/lon points.
 * Returns distance in kilometers.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Derive sky condition label from average cloud cover percentage.
 */
export function skyCondition(avgCloudCover) {
  if (avgCloudCover < 25) return 'sunny';
  if (avgCloudCover <= 70) return 'partly cloudy';
  return 'cloudy';
}

/**
 * Derive visibility label from numeric km value.
 */
export function visibilityLabel(visKm) {
  if (visKm < 1) return 'low';
  if (visKm <= 5) return 'medium';
  return 'high';
}

/**
 * Standard environmental lapse rate: ~6.5°C per 1000m elevation gain.
 * Adjusts a base temperature for a given elevation difference.
 */
export function adjustTemperatureForElevation(baseTemp, baseElevation, targetElevation) {
  const LAPSE_RATE = 6.5; // °C per 1000m
  const elevDiff = targetElevation - baseElevation;
  return Math.round((baseTemp - (elevDiff / 1000) * LAPSE_RATE) * 10) / 10;
}

/** Snow/rain threshold: precipitation falls as snow at or below this temperature (°C). */
const SNOW_THRESHOLD_TEMP_C = 1.0;

/**
 * Open-Meteo conversion factor: divide snowfall cm by this to get liquid-equivalent mm.
 * Equivalently, multiply precipitation mm by this to estimate snowfall cm.
 * Source: Open-Meteo docs — "For the water equivalent in millimeter, divide by 7."
 */
const PRECIP_TO_SNOW_FACTOR = 7;

/**
 * Compute snowfall at a given altitude.
 * If temperature at that altitude is at/below the snow threshold (1°C),
 * precipitation falls as snow. If the API reports 0 snowfall (rain at base)
 * but the altitude is cold enough, convert precipitation to snowfall using
 * Open-Meteo's factor: 1 mm liquid ≈ 7 cm snow.
 */
function computeSnowfallAtAlt(snowfall, precipitation, tempAtAlt) {
  if (tempAtAlt === null || tempAtAlt === undefined) {
    return Math.round(snowfall * 10) / 10;
  }
  if (tempAtAlt <= SNOW_THRESHOLD_TEMP_C) {
    if (snowfall > 0) return Math.round(snowfall * 10) / 10;
    // Base is raining but altitude is cold enough for snow
    return Math.round(precipitation * PRECIP_TO_SNOW_FACTOR * 10) / 10;
  }
  // Above snow threshold — rain at this altitude
  return 0;
}

/**
 * Parse hourly forecast data into morning and afternoon blocks.
 * Morning: 06:00–11:59, Afternoon: 12:00–17:59
 */
export function parseForecastBlocks(hourlyData, forecastDate) {
  const morning = { hours: [], snowfall: 0, windSpeeds: [], visibilities: [], cloudCovers: [] };
  const afternoon = { hours: [], snowfall: 0, windSpeeds: [], visibilities: [], cloudCovers: [] };

  if (!hourlyData || !hourlyData.time) return { morning: null, afternoon: null };

  for (let i = 0; i < hourlyData.time.length; i++) {
    const time = hourlyData.time[i];
    if (!time.startsWith(forecastDate)) continue;

    const hour = parseInt(time.split('T')[1].split(':')[0], 10);
    const snow = hourlyData.snowfall?.[i] ?? 0;
    const wind = hourlyData.wind_speed_10m?.[i] ?? 0;
    const vis = hourlyData.visibility?.[i] ?? 10000;
    const cloud = hourlyData.cloud_cover?.[i] ?? 0;

    const visKm = vis / 1000; // Open-Meteo returns visibility in meters

    if (hour >= 6 && hour <= 11) {
      morning.hours.push(hour);
      morning.snowfall += snow;
      morning.windSpeeds.push(wind);
      morning.visibilities.push(visKm);
      morning.cloudCovers.push(cloud);
    } else if (hour >= 12 && hour <= 17) {
      afternoon.hours.push(hour);
      afternoon.snowfall += snow;
      afternoon.windSpeeds.push(wind);
      afternoon.visibilities.push(visKm);
      afternoon.cloudCovers.push(cloud);
    }
  }

  function summarize(block) {
    if (block.hours.length === 0) return null;
    const avgWind = block.windSpeeds.reduce((a, b) => a + b, 0) / block.windSpeeds.length;
    const worstVis = Math.min(...block.visibilities);
    const avgCloud = block.cloudCovers.reduce((a, b) => a + b, 0) / block.cloudCovers.length;
    return {
      snowfall: Math.round(block.snowfall * 10) / 10,
      windSpeed: Math.round(avgWind * 10) / 10,
      visibility: Math.round(worstVis * 10) / 10,
      visibilityLabel: visibilityLabel(worstVis),
      skyCondition: skyCondition(avgCloud),
      avgCloudCover: Math.round(avgCloud),
    };
  }

  return {
    morning: summarize(morning),
    afternoon: summarize(afternoon),
  };
}

/**
 * Parse hourly forecast data into a full-day hourly timeline.
 * Returns an array of hourly entries for the given date (0-23h).
 * Each entry includes: hour, snowfall, precipitation, temperature,
 * wind speed, visibility, cloud cover, sky condition, snow depth, freezing level.
 */
export function parseHourlyTimeline(hourlyData, forecastDate, elevations) {
  if (!hourlyData || !hourlyData.time) return [];

  const { base: baseElev = 0, mid: midElev = 0, peak: peakElev = 0 } = elevations || {};

  const timeline = [];

  for (let i = 0; i < hourlyData.time.length; i++) {
    const time = hourlyData.time[i];
    if (!time.startsWith(forecastDate)) continue;

    const hour = parseInt(time.split('T')[1].split(':')[0], 10);
    const snowfall = hourlyData.snowfall?.[i] ?? 0;
    const precipitation = hourlyData.precipitation?.[i] ?? 0;
    const temp2m = hourlyData.temperature_2m?.[i] ?? null;
    const wind = hourlyData.wind_speed_10m?.[i] ?? 0;
    const vis = hourlyData.visibility?.[i] ?? 10000;
    const cloud = hourlyData.cloud_cover?.[i] ?? 0;
    const snowDepth = hourlyData.snow_depth?.[i] ?? 0;
    const freezingLevel = hourlyData.freezing_level_height?.[i] ?? null;

    const visKm = vis / 1000;
    // Open-Meteo returns data for the grid-cell elevation; we compute altitude-specific temperatures
    // using the standard lapse rate from the Open-Meteo grid-cell elevation (~resort lat/lon surface).
    // Open-Meteo's default elevation is the model grid-cell elevation.
    const apiElevation = hourlyData._apiElevation ?? baseElev;

    const tempBase = temp2m !== null ? adjustTemperatureForElevation(temp2m, apiElevation, baseElev) : null;
    const tempMid = temp2m !== null ? adjustTemperatureForElevation(temp2m, apiElevation, midElev) : null;
    const tempPeak = temp2m !== null ? adjustTemperatureForElevation(temp2m, apiElevation, peakElev) : null;

    // Open-Meteo returns snow_depth in meters — convert to cm
    // Snow depth increases at higher/colder elevations
    const snowDepthCm = snowDepth * 100;
    const snowDepthBase = Math.round(snowDepthCm);
    const snowDepthMid = Math.round(snowDepthCm * (1 + Math.max(0, (midElev - baseElev)) / 2000));
    const snowDepthPeak = Math.round(snowDepthCm * (1 + Math.max(0, (peakElev - baseElev)) / 1500));

    timeline.push({
      hour,
      // Altitude-specific snowfall: above the snow threshold precipitation falls as snow
      snowfall: {
        base: Math.round(snowfall * 10) / 10,
        mid: computeSnowfallAtAlt(snowfall, precipitation, tempMid),
        peak: computeSnowfallAtAlt(snowfall, precipitation, tempPeak),
      },
      precipitation: Math.round(precipitation * 10) / 10,
      temperature: {
        base: tempBase,
        mid: tempMid,
        peak: tempPeak,
      },
      windSpeed: Math.round(wind * 10) / 10,
      visibility: Math.round(visKm * 10) / 10,
      visibilityLabel: visibilityLabel(visKm),
      cloudCover: Math.round(cloud),
      skyCondition: skyCondition(cloud),
      snowDepth: {
        base: snowDepthBase,
        mid: snowDepthMid,
        peak: snowDepthPeak,
      },
      freezingLevel: freezingLevel !== null ? Math.round(freezingLevel) : null,
    });
  }

  return timeline;
}

/**
 * Compute total snowfall for a given date from hourly data.
 */
export function dayTotalSnowfall(hourlyData, forecastDate) {
  if (!hourlyData || !hourlyData.time) return 0;
  let total = 0;
  for (let i = 0; i < hourlyData.time.length; i++) {
    if (hourlyData.time[i].startsWith(forecastDate)) {
      total += hourlyData.snowfall?.[i] ?? 0;
    }
  }
  return Math.round(total * 10) / 10;
}

/**
 * Compute total precipitation for a given date from hourly data.
 */
export function dayTotalPrecipitation(hourlyData, forecastDate) {
  if (!hourlyData || !hourlyData.time) return 0;
  let total = 0;
  for (let i = 0; i < hourlyData.time.length; i++) {
    if (hourlyData.time[i].startsWith(forecastDate)) {
      total += hourlyData.precipitation?.[i] ?? 0;
    }
  }
  return Math.round(total * 10) / 10;
}

/**
 * Compute snowfall totals for the past N days from hourly data.
 * Optionally computes altitude-adjusted snowfall at mid level.
 */
export function historicalSnowfall(hourlyData, forecastDate, days = 3, elevations, apiElevation) {
  const result = [];
  const baseDate = new Date(forecastDate + 'T00:00:00');
  const { base: baseElev = 0, mid: midElev = 0, peak: peakElev = 0 } = elevations || {};
  const _apiElevation = apiElevation ?? baseElev;

  for (let d = 1; d <= days; d++) {
    const pastDate = new Date(baseDate);
    pastDate.setDate(pastDate.getDate() - d);
    const dateStr = pastDate.toISOString().split('T')[0];

    let snowMid = 0;
    if (hourlyData && hourlyData.time) {
      for (let i = 0; i < hourlyData.time.length; i++) {
        if (!hourlyData.time[i].startsWith(dateStr)) continue;
        const sf = hourlyData.snowfall?.[i] ?? 0;
        const precip = hourlyData.precipitation?.[i] ?? 0;
        const temp2m = hourlyData.temperature_2m?.[i] ?? null;
        const tempMid =
          temp2m !== null
            ? adjustTemperatureForElevation(temp2m, _apiElevation, midElev)
            : null;
        snowMid += computeSnowfallAtAlt(sf, precip, tempMid);
      }
    }

    result.push({
      date: dateStr,
      snowfall: dayTotalSnowfall(hourlyData, dateStr),
      snowfallMid: Math.round(snowMid * 10) / 10,
    });
  }
  return result.reverse();
}

/**
 * Compute rolling 24-hour snowfall totals ending at the given current time.
 * Returns altitude-specific values for base, mid, and peak.
 *
 * Note: Open-Meteo returns hourly timestamps in the resort's local timezone
 * without a UTC offset (e.g. "2026-03-23T14:00"). This function treats those
 * timestamps as UTC for comparison, which introduces an error equal to the
 * resort's UTC offset (typically ±12 h maximum). For a rolling 24 h display
 * this is an acceptable approximation; resorts in extreme time zones or during
 * daylight-saving transitions may see a shift of up to a few hours.
 */
export function snowfallLast24Hours(hourlyData, currentTimeISO, elevations, apiElevation) {
  if (!hourlyData || !hourlyData.time) return { base: 0, mid: 0, peak: 0 };

  const { base: baseElev = 0, mid: midElev = 0, peak: peakElev = 0 } = elevations || {};
  const _apiElevation = apiElevation ?? baseElev;

  const now = new Date(currentTimeISO);
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Build comparable strings from UTC components (hourly data has no tz offset)
  const toHourStr = (d) => {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hour = String(d.getUTCHours()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:00`;
  };

  const cutoffStr = toHourStr(cutoff);
  const nowStr = toHourStr(now);

  let snowBase = 0, snowMid = 0, snowPeak = 0;

  for (let i = 0; i < hourlyData.time.length; i++) {
    const t = hourlyData.time[i];
    if (t <= cutoffStr || t > nowStr) continue;

    const sf = hourlyData.snowfall?.[i] ?? 0;
    const precip = hourlyData.precipitation?.[i] ?? 0;
    const temp2m = hourlyData.temperature_2m?.[i] ?? null;
    const tempMid =
      temp2m !== null ? adjustTemperatureForElevation(temp2m, _apiElevation, midElev) : null;
    const tempPeak =
      temp2m !== null ? adjustTemperatureForElevation(temp2m, _apiElevation, peakElev) : null;

    snowBase += sf;
    snowMid += computeSnowfallAtAlt(sf, precip, tempMid);
    snowPeak += computeSnowfallAtAlt(sf, precip, tempPeak);
  }

  return {
    base: Math.round(snowBase * 10) / 10,
    mid: Math.round(snowMid * 10) / 10,
    peak: Math.round(snowPeak * 10) / 10,
  };
}
