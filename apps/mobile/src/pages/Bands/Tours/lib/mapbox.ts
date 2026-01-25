/**
 * Mapbox utilities for geocoding and route planning
 *
 * Setup: Add VITE_MAPBOX_TOKEN to your .env file
 * Get your token at: https://account.mapbox.com/access-tokens/
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type GeocodingResult = {
  coordinates: Coordinates;
  formattedAddress: string;
  confidence: number;
};

export type RouteResult = {
  distanceMiles: number;
  durationMinutes: number;
  geometry?: GeoJSON.LineString;
};

/**
 * Geocode an address to get coordinates
 */
export async function geocodeAddress(
  address: string,
  city?: string | null,
  state?: string | null,
  country?: string | null
): Promise<GeocodingResult | null> {
  if (!MAPBOX_TOKEN) {
    console.warn('[mapbox] No MAPBOX_TOKEN configured');
    return null;
  }

  // Build the search query
  const parts = [address, city, state, country].filter(Boolean);
  const query = encodeURIComponent(parts.join(', '));

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address,poi`
    );

    if (!response.ok) {
      console.error('[mapbox] Geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn('[mapbox] No geocoding results for:', parts.join(', '));
      return null;
    }

    const feature = data.features[0];
    const [lng, lat] = feature.center;

    return {
      coordinates: { lat, lng },
      formattedAddress: feature.place_name,
      confidence: feature.relevance || 0,
    };
  } catch (error) {
    console.error('[mapbox] Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate driving route between two points
 */
export async function getRoute(
  from: Coordinates,
  to: Coordinates
): Promise<RouteResult | null> {
  if (!MAPBOX_TOKEN) {
    console.warn('[mapbox] No MAPBOX_TOKEN configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full`
    );

    if (!response.ok) {
      console.error('[mapbox] Directions failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('[mapbox] No route found');
      return null;
    }

    const route = data.routes[0];

    // Convert meters to miles, seconds to minutes
    const distanceMiles = route.distance * 0.000621371;
    const durationMinutes = Math.round(route.duration / 60);

    return {
      distanceMiles: Math.round(distanceMiles * 10) / 10, // 1 decimal place
      durationMinutes,
      geometry: route.geometry,
    };
  } catch (error) {
    console.error('[mapbox] Route error:', error);
    return null;
  }
}

/**
 * Calculate routes for an entire tour (between consecutive stops)
 */
export async function calculateTourRoutes(
  stops: Array<{ id: string; venue_lat: number | null; venue_lng: number | null; date: string }>
): Promise<Map<string, RouteResult>> {
  const results = new Map<string, RouteResult>();

  // Sort stops by date
  const sortedStops = [...stops]
    .filter((s) => s.venue_lat != null && s.venue_lng != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate route between each consecutive pair
  for (let i = 0; i < sortedStops.length - 1; i++) {
    const from = sortedStops[i];
    const to = sortedStops[i + 1];

    const route = await getRoute(
      { lat: from.venue_lat!, lng: from.venue_lng! },
      { lat: to.venue_lat!, lng: to.venue_lng! }
    );

    if (route) {
      results.set(from.id, route);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get total tour mileage from stops with cached distances
 */
export function getTotalTourMiles(
  stops: Array<{ distance_to_next_miles: number | null }>
): number {
  return stops.reduce((total, stop) => {
    return total + (stop.distance_to_next_miles || 0);
  }, 0);
}

/**
 * Get total tour drive time from stops with cached times
 */
export function getTotalDriveTime(
  stops: Array<{ drive_time_to_next_minutes: number | null }>
): { hours: number; minutes: number } {
  const totalMinutes = stops.reduce((total, stop) => {
    return total + (stop.drive_time_to_next_minutes || 0);
  }, 0);

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

/**
 * Format drive time for display
 */
export function formatDriveTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Check if Mapbox is configured
 */
export function isMapboxConfigured(): boolean {
  return !!MAPBOX_TOKEN;
}

/**
 * Get warning level for a drive distance
 */
export function getDriveWarningLevel(miles: number): 'none' | 'moderate' | 'long' | 'extreme' {
  if (miles >= 800) return 'extreme';
  if (miles >= 600) return 'long';
  if (miles >= 400) return 'moderate';
  return 'none';
}

/**
 * Get warning color for drive distance
 */
export function getDriveWarningColor(miles: number): string {
  const level = getDriveWarningLevel(miles);
  switch (level) {
    case 'extreme': return '#ef4444'; // red
    case 'long': return '#f97316'; // orange
    case 'moderate': return '#eab308'; // yellow
    default: return '#6b7280'; // gray
  }
}
