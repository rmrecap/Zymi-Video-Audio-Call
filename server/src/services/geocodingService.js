import axios from 'axios';

/**
 * Geocoding Service using OpenStreetMap Nominatim (FREE)
 * Note: Nominatim requires a descriptive User-Agent header.
 */
class GeocodingService {
  /**
   * Convert an address string to coordinates [lat, lng]
   * @param {string} address 
   * @returns {Promise<{lat: number, lng: number} | null>}
   */
  static async addressToCoordinates(address) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'ZYMI-App/1.0 (contact@yourdomain.com)' // Identify your app to OSM
        }
      });

      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return {
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        };
      }
      return null;
    } catch (error) {
      console.error('[GEOCODING] Error during address lookup:', error.message);
      return null;
    }
  }

  /**
   * Reverse Geocoding: Convert coordinates to a readable address
   * @param {number} lat 
   * @param {number} lng 
   */
  static async coordinatesToAddress(lat, lng) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json'
        },
        headers: {
          'User-Agent': 'ZYMI-App/1.0'
        }
      });

      return response.data?.display_name || 'Unknown Location';
    } catch (error) {
      console.error('[GEOCODING] Error during reverse lookup:', error.message);
      return 'Unknown Location';
    }
  }
}

export default GeocodingService;
