
export const ENV = {
  VIETMAP_API_KEY: import.meta.env.VITE_VIETMAP_API_KEY || '506862bb03a3d71632bdeb7674a3625328cb7e5a9b011841',
  VIETMAP_BASE_URL: import.meta.env.VITE_VIETMAP_BASE_URL || 'https://maps.vietmap.vn/api',
  HMAC_SECRET: import.meta.env.VITE_HMAC_SECRET || 'your-hmac-secret-key',
  FOCUS_COORDINATES: import.meta.env.VITE_FOCUS_COORDINATES || '21.0285,105.8342'
};
