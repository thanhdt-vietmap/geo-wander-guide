interface WayPoint {
  name: string;
  lat: number;
  lng: number;
  ref_id?: string;
}

export class RouteShareService {
  /**
   * Generate a shareable URL with route waypoints and vehicle type
   */
  static generateShareUrl(waypoints: WayPoint[], vehicle: string): string {
    const validWaypoints = waypoints.filter(wp => wp.lat !== 0 && wp.lng !== 0);
    
    if (validWaypoints.length < 2) {
      throw new Error('At least 2 valid waypoints are required to generate a share URL');
    }

    // Format coordinates to 6 decimal places and create points parameter
    const pointsParam = validWaypoints
      .map(wp => `${wp.lat.toFixed(6)},${wp.lng.toFixed(6)}`)
      .join('|');

    const baseUrl = window.location.origin + window.location.pathname;
    const url = new URL(baseUrl);
    url.searchParams.set('points', pointsParam);
    url.searchParams.set('vehicle', vehicle);

    return url.toString();
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
          text: 'Xem tuyến đường này trên Geo Wander Guide',
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
   * Parse waypoints from URL parameters
   */
  static parseWaypointsFromUrl(): { waypoints: Array<{lat: number, lng: number}>, vehicle: string } | null {
    const urlParams = new URLSearchParams(window.location.search);
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
   * Clear route parameters from URL
   */
  static clearRouteFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('points');
    url.searchParams.delete('vehicle');
    window.history.replaceState({}, '', url.toString());
  }
}
