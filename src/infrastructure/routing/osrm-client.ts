export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResponse {
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
    };
    duration: number;
    distance: number;
  }>;
}

export class OSRMClient {
  private baseUrl: string;

  constructor(baseUrl = 'https://router.project-osrm.org') {
    this.baseUrl = baseUrl;
  }

  
  private calculateDistance(from: LatLng, to: LatLng): number {
    const R = 6371000; 
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  
  private createFallbackRoute(from: LatLng, to: LatLng, profile: 'walking' | 'driving' = 'walking'): RouteResponse {
    const distance = this.calculateDistance(from, to);
    
    
    const speeds = {
      walking: 1.4, 
      driving: 13.9 
    };
    
    const duration = distance / speeds[profile];
    
    console.log(`🔄 OSRM fallback: ${profile} route, distance=${Math.round(distance)}m, duration=${Math.round(duration/60)}min`);
    
    return {
      routes: [{
        geometry: {
          coordinates: [[from.lng, from.lat], [to.lng, to.lat]]
        },
        duration: duration,
        distance: distance
      }]
    };
  }

  async getRoute(from: LatLng, to: LatLng, profile: 'walking' | 'driving' = 'walking'): Promise<RouteResponse> {
    const url = `${this.baseUrl}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full`;
    
    console.log(`🗺️ OSRM request: ${profile} route from [${from.lat}, ${from.lng}] to [${to.lat}, ${to.lng}]`);
    
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        console.warn(`⚠️ OSRM routing failed: ${response.status} ${response.statusText}, using fallback`);
        return this.createFallbackRoute(from, to, profile);
      }
      
      const data = await response.json();
      console.log(`✅ OSRM response: ${data.routes?.length || 0} routes found`);
      return data;
    } catch (error) {
      console.warn('⚠️ OSRM network error, using fallback:', error);
      return this.createFallbackRoute(from, to, profile);
    }
  }

  async getRouteGeoJSON(from: LatLng, to: LatLng, profile: 'walking' | 'driving' = 'walking') {
    const routeData = await this.getRoute(from, to, profile);
    
    if (!routeData.routes || routeData.routes.length === 0) {
      console.error(' No route found in OSRM response');
      throw new Error('No route found');
    }

    const route = routeData.routes[0];
    console.log(`Route found: ${route.distance.toFixed(0)}m, ${(route.duration/60).toFixed(1)}min`);
    
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: route.geometry.coordinates,
      },
      properties: {
        duration: route.duration,
        distance: route.distance,
      },
    };
  }
}

export const osrmClient = new OSRMClient();
