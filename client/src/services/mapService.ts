
import { PlaceDetails } from '../types';
import { apiService } from './apiService';
import { debounce } from '../utils/debounce';

export interface ReverseGeocodingResponse {
  lat: number;
  lng: number;
  ref_id: string;
  distance: number;
  address: string;
  name: string;
  display: string;
  boundaries: {
    type: number;
    id: number;
    name: string;
    prefix: string;
    full_name: string;
  }[];
  categories: any[];
}

// Internal function for actual reverse geocoding
const getReverseGeocodingInternal = async (
  lng: number,
  lat: number
): Promise<PlaceDetails> => {
  try {
    console.log(`[MapService] Making reverse geocoding request for: ${lat}, ${lng}`);
    const data: ReverseGeocodingResponse[] = await apiService.get('/reverse/v3', {
      lng: lng.toString(),
      lat: lat.toString()
    });
    
    if (!data.length) {
      throw new Error('No location data found');
    }
    
    // Convert the API response to our PlaceDetails format
    const placeDetails: PlaceDetails = {
      display: data[0].display,
      name: data[0].name,
      hs_num: data[0].name.split(' ')[0] || '',
      street: data[0].name.split(' ').slice(1).join(' ') || '',
      address: data[0].address,
      city_id: data[0].boundaries.find(b => b.type === 0)?.id || 0,
      city: data[0].boundaries.find(b => b.type === 0)?.name || '',
      district_id: data[0].boundaries.find(b => b.type === 1)?.id || 0,
      district: data[0].boundaries.find(b => b.type === 1)?.name || '',
      ward_id: data[0].boundaries.find(b => b.type === 2)?.id || 0,
      ward: data[0].boundaries.find(b => b.type === 2)?.name || '',
      lat: data[0].lat,
      lng: data[0].lng,
      ref_id: data[0].ref_id || ''
    };
    
    return placeDetails;
  } catch (error) {
    console.error('Error getting reverse geocoding:', error);
    throw error;
  }
};

// Debounced version to prevent excessive API calls during drag
const debouncedReverseGeocoding = debounce(getReverseGeocodingInternal, 300);

// Promise cache for debounced calls
let lastPromise: Promise<PlaceDetails> | null = null;
let lastCoordinates: { lat: number; lng: number } | null = null;

export const getReverseGeocoding = async (
  lng: number,
  lat: number
): Promise<PlaceDetails> => {
  // Check if this is the same coordinates as last call
  if (lastCoordinates && lastCoordinates.lat === lat && lastCoordinates.lng === lng && lastPromise) {
    console.log(`[MapService] Returning cached promise for: ${lat}, ${lng}`);
    return lastPromise;
  }

  // Update last coordinates
  lastCoordinates = { lat, lng };

  // Create new promise
  lastPromise = new Promise<PlaceDetails>((resolve, reject) => {
    // Use debounced function
    const debouncedCall = debounce(async () => {
      try {
        const result = await getReverseGeocodingInternal(lng, lat);
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        // Clear cache after completion
        lastPromise = null;
        lastCoordinates = null;
      }
    }, 300);

    debouncedCall();
  });

  return lastPromise;
};
