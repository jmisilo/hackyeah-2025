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

  async getRoute(from: LatLng, to: LatLng, profile: 'walking' | 'driving' = 'walking'): Promise<RouteResponse> {
    const url = `${this.baseUrl}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full`;
    
    console.log(`🗺️ OSRM request: ${profile} route from [${from.lat}, ${from.lng}] to [${to.lat}, ${to.lng}]`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(` OSRM routing failed: ${response.status} ${response.statusText}`);
        throw new Error(`OSRM routing failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`OSRM response: ${data.routes?.length || 0} routes found`);
      return data;
    } catch (error) {
      console.error(' OSRM network error:', error);
      throw error;
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
