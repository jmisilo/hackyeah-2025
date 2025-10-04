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

  async getRoute(from: LatLng, to: LatLng): Promise<RouteResponse> {
    const url = `${this.baseUrl}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM routing failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getRouteGeoJSON(from: LatLng, to: LatLng) {
    const routeData = await this.getRoute(from, to);
    
    if (!routeData.routes || routeData.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = routeData.routes[0];
    
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