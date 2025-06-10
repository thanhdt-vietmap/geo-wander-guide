import { AESEncrypt } from '../utils/AESEncrypt';

interface WayPoint {
  name: string;
  lat: number;
  lng: number;
  ref_id?: string;
}

export class RouteShareService {
  private static shareUrlCache = new Map<string, string>();
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Generate a shareable URL with route waypoints and vehicle type (encrypted)
   */
  static generateShareUrl(waypoints: WayPoint[], vehicle: string): string {
    const validWaypoints = waypoints.filter(wp => wp.lat !== 0 && wp.lng !== 0);
    
    if (validWaypoints.length < 2) {
      throw new Error('At least 2 valid waypoints are required to generate a share URL');
    }

    // Create cache key
    const cacheKey = `${JSON.stringify(validWaypoints)}_${vehicle}`;
    
    // Return cached URL if exists
    if (this.shareUrlCache.has(cacheKey)) {
      console.log('[RouteShareService] Using cached share URL');
      return this.shareUrlCache.get(cacheKey)!;
    }

    console.log('[RouteShareService] Generating new share URL');

    // Create route data object
    const routeData = {
      points: validWaypoints.map(wp => [wp.lat.toFixed(6), wp.lng.toFixed(6)]),
      vehicle: vehicle
    };

    let shareUrl: string;

    try {
      // Encrypt the route data
      const encryptedData = AESEncrypt.encryptObject(routeData);
      
      const baseUrl = window.location.origin + window.location.pathname;
      const url = new URL(baseUrl);
      url.searchParams.set('r', encryptedData);

      shareUrl = url.toString();
    } catch (error) {
      console.error('Error generating encrypted share URL:', error);
      // Fallback to unencrypted format
      const pointsParam = validWaypoints
        .map(wp => `${wp.lat.toFixed(6)},${wp.lng.toFixed(6)}`)
        .join('|');

      const baseUrl = window.location.origin + window.location.pathname;
      const url = new URL(baseUrl);
      url.searchParams.set('points', pointsParam);
      url.searchParams.set('vehicle', vehicle);

      shareUrl = url.toString();
    }

    // Cache the URL
    this.shareUrlCache.set(cacheKey, shareUrl);
    
    // Clear cache after duration
    setTimeout(() => {
      this.shareUrlCache.delete(cacheKey);
      console.log('[RouteShareService] Cache expired for share URL');
    }, this.CACHE_DURATION);

    return shareUrl;
  }

  /**
   * Copy route URL to clipboard
   */
  static async copyRouteToClipboard(waypoints: WayPoint[], vehicle: string): Promise<void> {
    try {
      const shareUrl = this.generateShareUrl(waypoints, vehicle);
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      throw new Error('Failed to copy route to clipboard');
    }
  }

  /**
   * Share route using Web Share API (if available) or fallback to clipboard
   */
  static async shareRoute(waypoints: WayPoint[], vehicle: string): Promise<void> {
    const shareUrl = this.generateShareUrl(waypoints, vehicle);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chia sẻ tuyến đường',
          text: 'Xem tuyến đường này trên VietMap Live Map',
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or sharing failed, fallback to clipboard
        await this.copyRouteToClipboard(waypoints, vehicle);
        throw new Error('Đã sao chép liên kết vào clipboard');
      }
    } else {
      // Web Share API not available, use clipboard
      await this.copyRouteToClipboard(waypoints, vehicle);
      throw new Error('Đã sao chép liên kết vào clipboard');
    }
  }

  /**
   * Parse waypoints from URL parameters (supports both encrypted and legacy formats)
   */
  static parseWaypointsFromUrl(): { waypoints: Array<{lat: number, lng: number}>, vehicle: string } | null {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Try encrypted format first
    const encryptedParam = urlParams.get('r');
    if (encryptedParam) {
      try {
        const routeData = AESEncrypt.decryptObject<{
          points: string[][];
          vehicle: string;
        }>(encryptedParam);
        
        const waypoints = routeData.points.map(point => {
          const [lat, lng] = point.map(Number);
          if (isNaN(lat) || isNaN(lng)) {
            throw new Error('Invalid coordinates');
          }
          return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
        });

        if (waypoints.length < 2) {
          throw new Error('At least 2 waypoints required');
        }

        return { waypoints, vehicle: routeData.vehicle || 'car' };
      } catch (error) {
        console.error('Error parsing encrypted route data:', error);
        // Fall through to legacy format
      }
    }

    // Legacy format support
    const pointsParam = urlParams.get('points');
    const vehicleParam = urlParams.get('vehicle') || 'car';

    if (!pointsParam) {
      return null;
    }

    try {
      const waypoints = pointsParam.split('|').map(point => {
        const [lat, lng] = point.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid coordinates');
        }
        return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
      });

      if (waypoints.length < 2) {
        throw new Error('At least 2 waypoints required');
      }

      return { waypoints, vehicle: vehicleParam };
    } catch (error) {
      console.error('Error parsing waypoints from URL:', error);
      return null;
    }
  }

  /**
   * Clear route parameters from URL (supports both encrypted and legacy formats)
   */
  static clearRouteFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('r'); // encrypted format
    url.searchParams.delete('points'); // legacy format
    url.searchParams.delete('vehicle'); // legacy format
    window.history.replaceState({}, '', url.toString());
  }
}
