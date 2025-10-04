export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  place_id: string;
}

export class NominatimClient {
  private baseUrl: string;

  constructor(baseUrl = 'https://nominatim.openstreetmap.org') {
    this.baseUrl = baseUrl;
  }

  async search(query: string, city = 'Kraków'): Promise<GeocodingResult[]> {
    const searchQuery = city ? `${query}, ${city}, Polska` : query;
    const url = new URL(`${this.baseUrl}/search`);
    
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('bounded', '1');
    url.searchParams.set('viewbox', '19.8,49.9,20.2,50.2');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'pl,en',
        'User-Agent': 'LagRadar-KRK/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      place_id: item.place_id,
    }));
  }

  async searchFirst(query: string, city = 'Kraków'): Promise<GeocodingResult> {
    const results = await this.search(query, city);
    if (results.length === 0) {
      throw new Error(`Nie znaleziono lokalizacji: ${query}`);
    }
    return results[0];
  }
}

export const nominatimClient = new NominatimClient();