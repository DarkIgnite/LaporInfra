/**
 * Location Service & Geocoding Utilities for LaporInfra
 * Supports High-Accuracy GPS, Fallback IP Geolocation, Reverse Geocoding, and Indonesian City Presets
 */

export interface UserLocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  address: string;
  city: string;
  district?: string;
  isGps: boolean;
  timestamp?: number;
}

export interface CityPreset {
  name: string;
  province: string;
  lat: number;
  lng: number;
}

export const INDONESIA_CITY_PRESETS: CityPreset[] = [
  { name: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.1818, lng: 106.8223 },
  { name: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.2615, lng: 106.8106 },
  { name: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lng: 107.6191 },
  { name: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lng: 112.7521 },
  { name: 'Semarang', province: 'Jawa Tengah', lat: -6.9666, lng: 110.4381 },
  { name: 'Yogyakarta', province: 'D.I. Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lng: 98.6722 },
  { name: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4327 },
  { name: 'Denpasar', province: 'Bali', lat: -8.6705, lng: 115.2126 },
  { name: 'Palembang', province: 'Sumatera Selatan', lat: -2.9761, lng: 104.7754 }
];

const DEFAULT_FALLBACK_LOCATION: UserLocationData = {
  lat: -6.2088,
  lng: 106.8456,
  address: 'Jl. Jenderal Sudirman, Jakarta Pusat',
  city: 'Jakarta Pusat',
  district: 'Menteng',
  isGps: false
};

// Cache reverse geocode lookups to save network calls
const reverseGeocodeCache = new Map<string, { address: string; city: string; district: string }>();

/**
 * Reverse geocodes coordinates to a human-readable Indonesian address
 */
export async function getReadableAddress(
  lat: number,
  lng: number
): Promise<{ address: string; city: string; district: string }> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'id,en',
          'User-Agent': 'LaporInfra-App/2.0'
        }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || addr.suburb || 'Jl. Lokasi Kerusakan';
      const city = addr.city || addr.town || addr.municipality || addr.city_district || addr.county || 'Kota';
      const district = addr.suburb || addr.neighbourhood || addr.village || 'Kecamatan';
      const display = `${road}, ${district}, ${city}`;

      const result = { address: display, city, district };
      reverseGeocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Reverse geocode fallback:', err);
  }

  // Fallback if network blocked
  const fallback = {
    address: `Koordinat ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    city: 'Indonesia',
    district: 'Area Pelaporan'
  };
  return fallback;
}

/**
 * Search Indonesian addresses or places via Nominatim
 */
export async function searchAddress(query: string): Promise<
  Array<{
    display_name: string;
    lat: number;
    lng: number;
    city: string;
  }>
> {
  if (!query || query.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ', Indonesia'
      )}&countrycodes=id&limit=5&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'id,en',
          'User-Agent': 'LaporInfra-App/2.0'
        }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        display_name: item.display_name.split(',').slice(0, 3).join(','),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.state || 'Indonesia'
      }));
    }
  } catch (e) {
    console.warn('Address search error:', e);
  }

  return [];
}

/**
 * Robust User Location Detector with cascading strategies:
 * 1. High Accuracy GPS (5s timeout)
 * 2. Low Accuracy GPS (4s timeout)
 * 3. IP Geolocation API fallback
 * 4. Jakarta Pusat Preset default
 */
export async function detectPreciseUserLocation(): Promise<UserLocationData> {
  // Strategy 1: Browser High Accuracy GPS
  const highAccuracyAttempt = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation tidak didukung'));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000
      });
    });

  // Strategy 2: Browser Low Accuracy GPS
  const lowAccuracyAttempt = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation tidak didukung'));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 60000
      });
    });

  let position: GeolocationPosition | null = null;

  try {
    position = await highAccuracyAttempt();
  } catch (errHigh) {
    try {
      position = await lowAccuracyAttempt();
    } catch (errLow) {
      console.info('GPS unavailable, using IP / fallback geolocation', errLow);
    }
  }

  if (position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const addr = await getReadableAddress(lat, lng);

    return {
      lat,
      lng,
      accuracy,
      address: addr.address,
      city: addr.city,
      district: addr.district,
      isGps: true,
      timestamp: Date.now()
    };
  }

  // Strategy 3: IP Geolocation API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const ipRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData.latitude && ipData.longitude) {
        const lat = ipData.latitude;
        const lng = ipData.longitude;
        const addr = await getReadableAddress(lat, lng);
        return {
          lat,
          lng,
          address: addr.address || `${ipData.city || 'Kota'}, ${ipData.region || 'Indonesia'}`,
          city: ipData.city || 'Indonesia',
          isGps: false,
          timestamp: Date.now()
        };
      }
    }
  } catch (e) {
    console.warn('IP geolocation failed:', e);
  }

  // Strategy 4: Default Fallback (Jakarta Pusat)
  return DEFAULT_FALLBACK_LOCATION;
}
