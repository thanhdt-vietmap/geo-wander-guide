
import { PlaceDetails } from '@/types';
import { apiService } from './apiService';

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

export const getReverseGeocoding = async (
  lng: number,
  lat: number
): Promise<PlaceDetails> => {
  try {
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
