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
 * Compute snowfall totals for the past N days from hourly data.
 */
export function historicalSnowfall(hourlyData, forecastDate, days = 3) {
  const result = [];
  const baseDate = new Date(forecastDate + 'T00:00:00');
  for (let d = 1; d <= days; d++) {
    const pastDate = new Date(baseDate);
    pastDate.setDate(pastDate.getDate() - d);
    const dateStr = pastDate.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      snowfall: dayTotalSnowfall(hourlyData, dateStr),
    });
  }
  return result.reverse();
}
