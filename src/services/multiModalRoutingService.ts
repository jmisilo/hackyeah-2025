import { 
  RoutingRequest, 
  RoutingResponse, 
  MultiModalRoute, 
  RouteSegment, 
  WalkingSegment, 
  TransitSegment,
  RoutingPreferences 
} from '../types/routing.types';
import { GTFSStop, krakowStops, krakowRoutes } from '../infrastructure/gtfs/gtfs-data';
import { osrmClient } from '../infrastructure/routing/osrm-client';

interface OSRMCacheEntry {
  result: any;
  timestamp: number;
}

export class MultiModalRoutingService {
  private static instance: MultiModalRoutingService;
  private maxWalkingDistance = 1000;
  private maxWalkingTime = 15; 
  private osrmCache = new Map<string, OSRMCacheEntry>();
  private cacheExpiryTime = 5 * 60 * 1000; 

  static getInstance(): MultiModalRoutingService {
    if (!MultiModalRoutingService.instance) {
      MultiModalRoutingService.instance = new MultiModalRoutingService();
    }
    return MultiModalRoutingService.instance;
  }

  private generateCacheKey(from: { lat: number; lng: number }, to: { lat: number; lng: number }, profile: string): string {
    return `${from.lat.toFixed(6)},${from.lng.toFixed(6)}-${to.lat.toFixed(6)},${to.lng.toFixed(6)}-${profile}`;
  }

  private async getCachedOSRMRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }, profile: 'walking' | 'driving' = 'walking') {
    const cacheKey = this.generateCacheKey(from, to, profile);
    const cached = this.osrmCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiryTime) {
      console.log(`🎯 Cache hit for OSRM route: ${profile}`);
      return cached.result;
    }

    try {
      const result = await osrmClient.getRoute(from, to, profile);
      this.osrmCache.set(cacheKey, { result, timestamp: Date.now() });
      console.log(`📡 OSRM request completed and cached: ${profile}`);
      return result;
    } catch (error) {
      console.error(`❌ OSRM request failed: ${profile}`, error);
      return null;
    }
  }

  async planRoute(request: RoutingRequest): Promise<RoutingResponse> {
    try {
      const { start, end, preferences, transportModes } = request;
      console.log('🚀 Planning route with request:', { start, end, transportModes });
      
      const defaultPreferences: RoutingPreferences = {
        minimizeWalking: false,
        minimizeTransfers: false,
        minimizeTime: true,
        avoidStairs: false,
        preferExpress: false
      };
      const finalPreferences = preferences || defaultPreferences;
      
      const maxStopsToCheck = 3; 
      
      let nearbyStartStops = this.findNearbyStops(start, finalPreferences, transportModes).slice(0, maxStopsToCheck);
      let nearbyEndStops = this.findNearbyStops(end, finalPreferences, transportModes).slice(0, maxStopsToCheck);

      console.log('📊 Initial search results:', {
        startStops: nearbyStartStops.length,
        endStops: nearbyEndStops.length
      });

      if (nearbyStartStops.length === 0 || nearbyEndStops.length === 0) {
        console.log('🔄 No stops found, increasing walking distance...');
        const originalMaxDistance = this.maxWalkingDistance;
        const originalMaxTime = this.maxWalkingTime;
        
        this.maxWalkingDistance = 1500; 
        this.maxWalkingTime = 20; 
        
        nearbyStartStops = this.findNearbyStops(start, finalPreferences, transportModes).slice(0, maxStopsToCheck);
        nearbyEndStops = this.findNearbyStops(end, finalPreferences, transportModes).slice(0, maxStopsToCheck);
        
        console.log('📊 Extended search results:', {
          startStops: nearbyStartStops.length,
          endStops: nearbyEndStops.length
        });
        
        this.maxWalkingDistance = originalMaxDistance;
        this.maxWalkingTime = originalMaxTime;
      }

      if (nearbyStartStops.length === 0 || nearbyEndStops.length === 0) {
        console.log('🔄 Still no stops, trying all transport modes...');
        const allTransportModes: ('walking' | 'bus' | 'tram')[] = ['walking', 'bus', 'tram'];
        
        this.maxWalkingDistance = 2000; 
        this.maxWalkingTime = 25; 
        
        nearbyStartStops = this.findNearbyStops(start, finalPreferences, allTransportModes).slice(0, maxStopsToCheck);
        nearbyEndStops = this.findNearbyStops(end, finalPreferences, allTransportModes).slice(0, maxStopsToCheck);
        
        console.log('📊 All-modes search results:', {
          startStops: nearbyStartStops.length,
          endStops: nearbyEndStops.length
        });
        
        this.maxWalkingDistance = 1000;
        this.maxWalkingTime = 15;
      }

      
      if (nearbyStartStops.length === 0 || nearbyEndStops.length === 0) {
        console.log('🚶 No transit stops available, planning walking-only route');
        return this.planWalkingOnlyRoute(start, end);
      }

      const bestRoute = await this.findBestMultiModalRoute(
        start, 
        end, 
        nearbyStartStops, 
        nearbyEndStops, 
        finalPreferences
      );

      
      if (!bestRoute || bestRoute.segments.length === 0) {
        console.log('🚶 Multimodal route failed, falling back to walking-only');
        return this.planWalkingOnlyRoute(start, end);
      }

      console.log('✅ Successfully planned route with', bestRoute.segments.length, 'segments');

      return {
        routes: [bestRoute],
        alternatives: [], 
        warnings: [],
        metadata: {
          requestId: this.generateRequestId(),
          processingTime: Date.now(),
          dataTimestamp: new Date(),
          algorithm: 'multimodal-dijkstra',
          version: '1.0.0'
        }
      };

    } catch (error) {
      console.error('❌ Błąd planowania trasy:', error);
      
      
      try {
        console.log('🚶 Final fallback: planning walking route');
        return await this.planWalkingOnlyRoute(request.start, request.end);
      } catch (walkingError) {
        console.error('❌ Even walking route failed:', walkingError);
        return {
          routes: [],
          alternatives: [],
          warnings: [{
            type: 'accessibility',
            message: 'Nie udało się zaplanować żadnej trasy. Sprawdź połączenie internetowe i spróbuj ponownie.',
            severity: 'error'
          }],
          metadata: {
            requestId: this.generateRequestId(),
            processingTime: Date.now(),
            dataTimestamp: new Date(),
            algorithm: 'multimodal-dijkstra',
            version: '1.0.0'
          }
        };
      }
    }
  }

  private findNearbyStops(
    point: { lat: number; lng: number }, 
    preferences: RoutingPreferences,
    transportModes: ('walking' | 'bus' | 'tram')[]
  ): Array<{ stop: GTFSStop; distance: number; walkingTime: number }> {
    console.log('🔍 findNearbyStops called with:', {
      point,
      transportModes,
      maxWalkingDistance: this.maxWalkingDistance,
      maxWalkingTime: this.maxWalkingTime
    });

    const maxDistance = this.maxWalkingDistance;
    
    
    const allowedTransportTypes = transportModes.filter(mode => mode !== 'walking') as ('bus' | 'tram')[];
    console.log('🚌 Allowed transport types:', allowedTransportTypes);
    
    const allStopsInRange = krakowStops
      .map(stop => {
        const distance = this.calculateDistance(point, stop);
        const walkingTime = this.estimateWalkingTime(distance);
        return { stop, distance, walkingTime };
      })
      .filter(item => {
        return item.distance <= maxDistance && 
               item.walkingTime <= this.maxWalkingTime;
      });

    console.log('📍 All stops in range:', allStopsInRange.length);

    const filteredStops = allStopsInRange
      .filter(({ stop }) => {
        
        if (allowedTransportTypes.length === 0) {
          console.log('🚶 No transport modes selected, showing all stops');
          return true;
        }
        
        
        const isCompatible = allowedTransportTypes.some(transportType => 
          stop.type === transportType || stop.type === 'both'
        );
        
        console.log(`🎯 Stop ${stop.name} (${stop.type}) compatible with ${allowedTransportTypes.join(', ')}: ${isCompatible}`);
        return isCompatible;
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    console.log('✅ Final filtered stops:', filteredStops.map(s => ({ name: s.stop.name, type: s.stop.type, distance: s.distance })));
    
    return filteredStops;
  }

  private async findBestMultiModalRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    startStops: Array<{ stop: GTFSStop; distance: number; walkingTime: number }>,
    endStops: Array<{ stop: GTFSStop; distance: number; walkingTime: number }>,
    preferences: RoutingPreferences
  ): Promise<MultiModalRoute> {
    const routePromises: Promise<{ route: MultiModalRoute | null; score: number }>[] = [];

    for (const startStopData of startStops) {
      for (const endStopData of endStops) {
        const routePromise = this.planRouteViaStops(
          from, 
          to, 
          startStopData, 
          endStopData, 
          preferences
        ).then(route => {
          if (route) {
            const score = this.calculateRouteScore(route, preferences);
            return { route, score };
          }
          return { route: null, score: Infinity };
        }).catch(error => {
          console.error('Error planning route via stops:', error);
          return { route: null, score: Infinity };
        });
        
        routePromises.push(routePromise);
      }
    }

    const results = await Promise.all(routePromises);
    
    let bestRoute: MultiModalRoute | null = null;
    let bestScore = Infinity;

    for (const result of results) {
      if (result.route && result.score < bestScore) {
        bestScore = result.score;
        bestRoute = result.route;
      }
    }

    if (!bestRoute) {
      const walkingRoute = await this.planWalkingOnlyRoute(from, to);
      return walkingRoute.routes[0];
    }

    return bestRoute;
  }

  private async planRouteViaStops(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    startStopData: { stop: GTFSStop; distance: number; walkingTime: number },
    endStopData: { stop: GTFSStop; distance: number; walkingTime: number },
    preferences: RoutingPreferences
  ): Promise<MultiModalRoute | null> {
    try {
      const segments: RouteSegment[] = [];
      let totalDistance = 0;
      let totalDuration = 0;

      const walkToStart = await this.createWalkingSegment(from, startStopData.stop);
      if (walkToStart) {
        segments.push(walkToStart);
        totalDistance += walkToStart.distance;
        totalDuration += walkToStart.duration;
      }

      const transitSegment = await this.createTransitSegment(
        startStopData.stop, 
        endStopData.stop, 
        preferences
      );
      if (transitSegment) {
        segments.push(transitSegment);
        totalDistance += transitSegment.distance;
        totalDuration += transitSegment.duration;
      } else {
        return null; 
      }

      const walkFromEnd = await this.createWalkingSegment(endStopData.stop, to);
      if (walkFromEnd) {
        segments.push(walkFromEnd);
        totalDistance += walkFromEnd.distance;
        totalDuration += walkFromEnd.duration;
      }

      console.log(`📊 Podsumowanie trasy: segmentów=${segments.length}, totalDistance=${totalDistance.toFixed(0)}m, totalDuration=${totalDuration}min`);
      console.log(`📊 Segmenty:`, segments.map(s => `${s.type}:${s.duration}min`).join(', '));

      return {
        id: this.generateRouteId(),
        segments,
        totalDistance,
        totalDuration,
        walkingTime: segments.filter(s => s.type === 'walking').reduce((sum, s) => sum + s.duration, 0),
        walkingDistance: segments.filter(s => s.type === 'walking').reduce((sum, s) => sum + s.distance, 0),
        transferCount: segments.filter(s => s.type === 'bus' || s.type === 'tram').length - 1,
        createdAt: new Date()
      };

    } catch (error) {
      console.error('Błąd planowania trasy przez przystanki:', error);
      return null;
    }
  }

  private async createWalkingSegment(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<WalkingSegment | null> {
    try {
      const walkingRoute = await this.getCachedOSRMRoute(from, to, 'walking');
      
      let distance: number;
      let duration: number;
      let geometry: [number, number][];

      if (walkingRoute?.routes?.[0]) {
        distance = walkingRoute.routes[0].distance;
        duration = Math.ceil(walkingRoute.routes[0].duration / 60); 
        geometry = walkingRoute.routes[0].geometry.coordinates;
        console.log(`🚶 Segment pieszy z OSRM: dystans=${distance.toFixed(0)}m, czas=${duration}min`);
      } else {
        distance = this.calculateDistance(from, to);
        duration = this.estimateWalkingTime(distance);
        geometry = this.createStraightLineGeometry(from, to);
        console.log(`🚶 Segment pieszy (fallback): dystans=${distance.toFixed(0)}m, czas=${duration}min`);
      }

      return {
        id: this.generateSegmentId(),
        type: 'walking',
        startPoint: from,
        endPoint: to,
        distance,
        duration,
        instructions: this.generateWalkingInstructions(from, to).join(', '),
        geometry: {
          type: 'LineString',
          coordinates: geometry
        },
        elevation: Math.floor(Math.random() * 20), 
        surface: 'paved' as const,
        accessibility: true,
        waypoints: [from, to]
      };

    } catch (error) {
      console.error('Błąd tworzenia segmentu pieszego:', error);
      return null;
    }
  }

  private async createTransitSegment(
    fromStop: GTFSStop,
    toStop: GTFSStop,
    preferences: RoutingPreferences
  ): Promise<TransitSegment | null> {
    
    const commonLines = fromStop.lines.filter(line => toStop.lines.includes(line));
    
    if (commonLines.length === 0) {
      return null; 
    }

    
    const bestLine = this.selectBestLine(commonLines, fromStop, toStop, preferences);
    const route = krakowRoutes.find(r => r.shortName === bestLine);

    if (!route) return null;

    const distance = this.calculateDistance(fromStop, toStop);
    const duration = this.estimateTransitTime(distance, route.type);
    
    console.log(`🚌 Tworzenie segmentu ${route.type}: linia=${route.shortName}, dystans=${distance.toFixed(0)}m, czas=${duration}min`);

    
    const geometry = await this.createTransitGeometry(fromStop, toStop);

    return {
      id: this.generateSegmentId(),
      type: route.type,
      startPoint: fromStop,
      endPoint: toStop,
      distance,
      duration,
      instructions: `Take ${route.type} line ${route.shortName} to ${route.longName}`,
      lineNumber: route.shortName,
      direction: route.longName,
      headsign: route.longName,
      boardingStop: { ...fromStop, stopIcon: fromStop.type },
      alightingStop: { ...toStop, stopIcon: toStop.type },
      intermediateStops: [],
      scheduledDeparture: new Date(Date.now() + Math.random() * 10 * 60000),
      scheduledArrival: new Date(Date.now() + duration * 60000),
      platform: `${Math.floor(Math.random() * 4) + 1}`,
      geometry: {
        type: 'LineString',
        coordinates: geometry
      },
      routeColor: route.color
    };
  }

  private async planWalkingOnlyRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<RoutingResponse> {
    const walkingSegment = await this.createWalkingSegment(from, to);
    
    if (!walkingSegment) {
      return {
          routes: [],
          alternatives: [],
          warnings: [{
            type: 'accessibility',
            message: 'Nie udało się zaplanować trasy pieszej',
            severity: 'error'
          }],
          metadata: {
            requestId: this.generateRequestId(),
            processingTime: Date.now(),
            dataTimestamp: new Date(),
            algorithm: 'walking-only',
            version: '1.0.0'
          }
        };
    }

    const route: MultiModalRoute = {
        id: this.generateRouteId(),
        segments: [walkingSegment],
        totalDistance: walkingSegment.distance,
        totalDuration: walkingSegment.duration,
        walkingTime: walkingSegment.duration,
        walkingDistance: walkingSegment.distance,
        transferCount: 0,
        createdAt: new Date()
      };

    return {
        routes: [route],
        alternatives: [],
        warnings: [],
        metadata: {
          requestId: this.generateRequestId(),
          processingTime: Date.now(),
          dataTimestamp: new Date(),
          algorithm: 'walking-only',
          version: '1.0.0'
        }
      };
  }

  
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371000; 
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private estimateWalkingTime(distance: number): number {
    
    const timeInSeconds = distance / 1.39;
    const timeInMinutes = Math.ceil(timeInSeconds / 60);
    console.log(`⏱️ Obliczanie czasu pieszego: dystans=${distance.toFixed(0)}m, czas=${timeInMinutes}min`);
    return timeInMinutes;
  }

  private estimateTransitTime(distance: number, transportType: 'bus' | 'tram'): number {
    
    const speed = transportType === 'tram' ? 20 : 15;
    const timeInMinutes = Math.ceil(distance / 1000 / speed * 60);
    console.log(`⏱️ Obliczanie czasu ${transportType}: dystans=${distance.toFixed(0)}m, prędkość=${speed}km/h, czas=${timeInMinutes}min`);
    return timeInMinutes;
  }

  private calculateRouteScore(route: MultiModalRoute, preferences: RoutingPreferences): number {
    let score = 0;
    
    
    score += route.totalDuration * (preferences.minimizeTime ? 2 : 1);
    
    
    const walkingDistance = route.segments
      .filter(s => s.type === 'walking')
      .reduce((sum, s) => sum + s.distance, 0);
    score += walkingDistance * (preferences.minimizeWalking ? 2 : 0.1);
    
    
    const transferCount = route.segments.filter(s => s.type !== 'walking').length - 1;
    score += transferCount * (preferences.minimizeTransfers ? 600 : 300);
    
    return score;
  }

  private selectBestLine(
    lines: string[],
    fromStop: GTFSStop,
    toStop: GTFSStop,
    preferences: RoutingPreferences
  ): string {
    
    
    return lines[0];
  }

  private generateWalkingInstructions(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): string[] {
    return [
      'Idź prosto',
      'Skręć w prawo',
      'Kontynuuj prosto',
      'Dotarłeś do celu'
    ];
  }

  private createStraightLineGeometry(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): [number, number][] {
    return [
      [from.lng, from.lat],
      [to.lng, to.lat]
    ];
  }

  private async createTransitGeometry(fromStop: GTFSStop, toStop: GTFSStop): Promise<[number, number][]> {
    try {
      
      const transitRoute = await osrmClient.getRoute(fromStop, toStop, 'driving');
      
      if (transitRoute?.routes?.[0]?.geometry?.coordinates) {
        console.log(`🚌 Geometria transportu publicznego z OSRM: ${transitRoute.routes[0].geometry.coordinates.length} punktów`);
        return transitRoute.routes[0].geometry.coordinates;
      }
    } catch (error) {
      console.warn('Błąd pobierania geometrii z OSRM dla transportu publicznego:', error);
    }
    
    
    console.log(`🚌 Geometria transportu publicznego (fallback): prosta linia`);
    return [
      [fromStop.lng, fromStop.lat],
      [toStop.lng, toStop.lat]
    ];
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRouteId(): string {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSegmentId(): string {
    return `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}


export const multiModalRoutingService = MultiModalRoutingService.getInstance();