/**
 * High-precision location service with GPS-level accuracy and fallbacks
 * Uses multiple strategies to get the most accurate location possible
 */

export interface LocationResult {
  lat: number
  lng: number
  accuracy: number // in meters
  source: 'gps' | 'network' | 'ip' | 'fallback'
  address?: string
  city?: string
  country?: string
}

interface GeolocationOptions {
  enableHighAccuracy: boolean
  timeout: number
  maximumAge: number
}

/**
 * Get user location with maximum precision
 * Tries GPS first, then falls back to network/IP-based location
 */
export async function getHighPrecisionLocation(): Promise<LocationResult> {
  // Strategy 1: Try high-accuracy GPS (most precise, but may be slow)
  try {
    const gpsLocation = await getGPSLocation({
      enableHighAccuracy: true,
      timeout: 15000, // Longer timeout for GPS
      maximumAge: 0, // Always get fresh location
    })
    
    if (gpsLocation.accuracy <= 50) {
      // GPS accuracy under 50m is excellent
      console.log('✅ GPS location acquired:', gpsLocation.accuracy, 'm accuracy')
      return gpsLocation
    }
  } catch (error) {
    console.log('GPS location failed, trying network fallback:', error)
  }

  // Strategy 2: Try network-based geolocation (faster, less accurate)
  try {
    const networkLocation = await getGPSLocation({
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000, // Accept location up to 5 minutes old
    })
    
    console.log('✅ Network location acquired:', networkLocation.accuracy, 'm accuracy')
    return networkLocation
  } catch (error) {
    console.log('Network location failed, trying IP geolocation:', error)
  }

  // Strategy 3: IP-based geolocation (least accurate, but always works)
  try {
    const ipLocation = await getIPLocation()
    console.log('✅ IP-based location acquired (fallback)')
    return ipLocation
  } catch (error) {
    console.error('All location methods failed:', error)
    throw new Error('Unable to determine your location. Please enable location services.')
  }
}

/**
 * Get GPS location using browser Geolocation API
 */
function getGPSLocation(options: GeolocationOptions): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation API not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = position.coords
        const source = options.enableHighAccuracy ? 'gps' : 'network'
        
        // Try to get address via reverse geocoding
        let address: string | undefined
        try {
          const reverseGeocodeResult = await reverseGeocodeNominatim({
            lat: coords.latitude,
            lng: coords.longitude,
          })
          address = reverseGeocodeResult.address
        } catch (error) {
          console.log('Reverse geocoding failed, continuing without address')
        }

        resolve({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy || 100, // Default to 100m if not provided
          source,
          address,
        })
      },
      (error) => {
        reject(new Error(`Geolocation failed: ${error.message}`))
      },
      options
    )
  })
}

/**
 * Get location using IP-based geolocation (fallback)
 * Uses ipapi.co (free tier) or ip-api.com as fallback
 */
async function getIPLocation(): Promise<LocationResult> {
  // Try ipapi.co first (more reliable)
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lng: data.longitude,
          accuracy: 10000, // IP geolocation is typically 5-10km accurate
          source: 'ip',
          city: data.city,
          country: data.country_name,
          address: `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`.trim(),
        }
      }
    }
  } catch (error) {
    console.log('ipapi.co failed, trying ip-api.com:', error)
  }

  // Fallback to ip-api.com
  try {
    const response = await fetch('http://ip-api.com/json/', {
      signal: AbortSignal.timeout(5000),
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.lat && data.lon) {
        return {
          lat: data.lat,
          lng: data.lon,
          accuracy: 10000,
          source: 'ip',
          city: data.city,
          country: data.country,
          address: `${data.city || ''}, ${data.regionName || ''}, ${data.country || ''}`.trim(),
        }
      }
    }
  } catch (error) {
    console.error('IP geolocation failed:', error)
  }

  throw new Error('IP geolocation unavailable')
}

/**
 * Reverse geocode coordinates to address using Nominatim (OpenStreetMap)
 * Free, open-source, and accurate alternative to Google Geocoding
 */
export async function reverseGeocodeNominatim(
  coords: { lat: number; lng: number }
): Promise<{ address: string; city?: string; country?: string }> {
  try {
    // Use Nominatim reverse geocoding API
    const params = new URLSearchParams({
      lat: coords.lat.toString(),
      lon: coords.lng.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: '18', // High detail level
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': 'Senergy App', // Required by Nominatim
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }

    const address = data.display_name || ''
    const addressParts = data.address || {}
    
    return {
      address,
      city: addressParts.city || addressParts.town || addressParts.village,
      country: addressParts.country,
    }
  } catch (error) {
    console.error('Nominatim reverse geocoding failed:', error)
    // Fallback: return basic coordinates-based address
    return {
      address: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
    }
  }
}

/**
 * Watch user's position for continuous updates (useful for real-time tracking)
 */
export function watchPosition(
  callback: (location: LocationResult) => void,
  errorCallback?: (error: Error) => void
): number | null {
  if (!navigator.geolocation) {
    errorCallback?.(new Error('Geolocation API not supported'))
    return null
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const coords = position.coords
      
      // Try to get address
      let address: string | undefined
      try {
        const reverseGeocodeResult = await reverseGeocodeNominatim({
          lat: coords.latitude,
          lng: coords.longitude,
        })
        address = reverseGeocodeResult.address
      } catch (error) {
        // Continue without address
      }

      callback({
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy || 100,
        source: 'gps',
        address,
      })
    },
    (error) => {
      errorCallback?.(new Error(`Geolocation watch failed: ${error.message}`))
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  )

  return watchId
}

/**
 * Stop watching position
 */
export function clearWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
}




