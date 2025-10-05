import { 
  RoutingRequest, 
  RoutingResponse, 
  MultiModalRoute, 
  RouteSegment, 
  WalkingSegment, 
  TransitSegment,
  RoutingPreferences 
} from '../types/routing.types';
import { GTFSStop, krakowStops, krakowRoutes, getActiveDisruptionsForRoute, getActiveDisruptionsForStop, TRAIN_LINES_DATA } from '../infrastructure/gtfs/gtfs-data';
import { osrmClient } from '../infrastructure/routing/osrm-client';

interface OSRMCacheEntry {
  result: any;
  timestamp: number;
}

export class MultiModalRoutingService {
  private static instance: MultiModalRoutingService;
  private maxWalkingDistance = 150; 
  private maxWalkingTime = 5; 
  private maxTrainWalkingDistance = 1200; 
  private maxTrainWalkingTime = 15; 
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
    console.log('🚀 Rozpoczynam planowanie trasy:', request);
    console.log('🔧 planRoute - function start');
    
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      const { start, end, preferences, transportModes } = request;
      
      console.log('🎯 Preferencje routingu:', preferences);
      console.log('🚌 Dostępne środki transportu:', transportModes);

      
      const directDistance = this.calculateDistance(start, end);
      console.log(`📏 Dystans bezpośredni: ${directDistance.toFixed(0)}m`);

      
      if (directDistance < 300 && !preferences?.minimizeWalking) {
        console.log('🚶‍♂️ Dystans bardzo krótki - proponuję tylko chodzenie');
        return await this.planWalkingOnlyRoute(start, end);
      }
      
      const defaultPreferences: RoutingPreferences = {
        minimizeWalking: false,
        minimizeTransfers: false,
        minimizeTime: true,
        avoidStairs: false,
        preferExpress: false
      };
      const finalPreferences = preferences || defaultPreferences;
      
      const maxStopsToCheck = 5; 
      
      let nearbyStartStops = this.findNearbyStops(start, finalPreferences, transportModes).slice(0, maxStopsToCheck);
      let nearbyEndStops = this.findNearbyStops(end, finalPreferences, transportModes).slice(0, maxStopsToCheck);

      console.log('📊 Initial search results:', {
        startStops: nearbyStartStops.length,
        endStops: nearbyEndStops.length
      });

      
      if (nearbyStartStops.length === 0 || nearbyEndStops.length === 0) {
        console.log('🔄 No stops found, increasing walking distance to 2000m...');
        const originalMaxDistance = this.maxWalkingDistance;
        const originalMaxTime = this.maxWalkingTime;
        
        this.maxWalkingDistance = 2000; 
        this.maxWalkingTime = 25; 
        
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
        console.log('🔄 Still no stops, trying all transport modes with max range...');
        const allTransportModes: ('walking' | 'bus' | 'tram' | 'train')[] = ['walking', 'bus', 'tram', 'train'];
        
        this.maxWalkingDistance = 2500; 
        this.maxWalkingTime = 30; 
        
        nearbyStartStops = this.findNearbyStops(start, finalPreferences, allTransportModes).slice(0, maxStopsToCheck);
        nearbyEndStops = this.findNearbyStops(end, finalPreferences, allTransportModes).slice(0, maxStopsToCheck);
        
        console.log('📊 All-modes search results:', {
          startStops: nearbyStartStops.length,
          endStops: nearbyEndStops.length
        });
        
        this.maxWalkingDistance = 1500; 
        this.maxWalkingTime = 20;
      }

      
      
      if (nearbyStartStops.length === 0 || nearbyEndStops.length === 0) {
        const maxReasonableWalkingDistance = 3000; 
        
        
        if (transportModes.includes('train') && !transportModes.includes('bus') && !transportModes.includes('tram')) {
          console.log(`🚂 No train stops available, trying alternative public transport`);
          
          
          const alternativePreferences = {
            ...finalPreferences,
            transportModes: ['bus', 'tram'] as ('walking' | 'bus' | 'tram' | 'train')[]
          };
          
          const alternativeStartStops = this.findNearbyStops(start, alternativePreferences, ['bus', 'tram']);
          const alternativeEndStops = this.findNearbyStops(end, alternativePreferences, ['bus', 'tram']);
          
          if (alternativeStartStops.length > 0 && alternativeEndStops.length > 0) {
            console.log(`🚌 Found alternative public transport, planning route`);
            const alternativeRoutes = await this.findMultipleRoutes(
              start, 
              end, 
              alternativeStartStops, 
              alternativeEndStops, 
              alternativePreferences
            );
            
            if (alternativeRoutes && alternativeRoutes.length > 0) {
              return {
                routes: alternativeRoutes,
                alternatives: [],
                warnings: [{
                   type: 'accessibility',
                   message: 'Nie znaleziono przystanków kolejowych w pobliżu. Zaproponowano trasę autobusem/tramwajem.',
                   severity: 'info'
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
        
        
        if (directDistance > maxReasonableWalkingDistance && !transportModes.includes('train')) {
          console.log(`🚫 Distance too long for walking (${directDistance.toFixed(0)}m), returning error`);
          return {
            routes: [],
            alternatives: [],
            warnings: [{
              type: 'accessibility',
              message: `Nie znaleziono połączeń transportu publicznego. Dystans ${(directDistance/1000).toFixed(1)}km jest zbyt długi dla trasy pieszej.`,
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
        
        
        if (transportModes.includes('train') && nearbyStartStops.length === 0 && nearbyEndStops.length === 0) {
          console.log(`🚂 No train stops found with standard range, trying extended search`);
          
          
          const extendedTrainDistance = 5000; 
          const extendedTrainTime = 60; 
          
          const extendedStartStops = krakowStops
            .map(stop => {
              const distance = this.calculateDistance(start, stop);
              const walkingTime = this.estimateWalkingTime(distance);
              return { stop, distance, walkingTime };
            })
            .filter(item => {
              return item.distance <= extendedTrainDistance && 
                     item.walkingTime <= extendedTrainTime &&
                     item.stop.type === 'train';
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5); 
            
          const extendedEndStops = krakowStops
            .map(stop => {
              const distance = this.calculateDistance(end, stop);
              const walkingTime = this.estimateWalkingTime(distance);
              return { stop, distance, walkingTime };
            })
            .filter(item => {
              return item.distance <= extendedTrainDistance && 
                     item.walkingTime <= extendedTrainTime &&
                     item.stop.type === 'train';
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5); 
          
          if (extendedStartStops.length > 0 && extendedEndStops.length > 0) {
            console.log(`🚂 Found train stops with extended search: ${extendedStartStops.length} start, ${extendedEndStops.length} end`);
            
            const trainRoutes = await this.findMultipleRoutes(
              start, 
              end, 
              extendedStartStops, 
              extendedEndStops, 
              finalPreferences
            );
            
            if (trainRoutes && trainRoutes.length > 0) {
              return {
                routes: trainRoutes,
                alternatives: [],
                warnings: [{
                   type: 'accessibility',
                   message: 'Znaleziono połączenie kolejowe z dłuższym dojściem do przystanku.',
                   severity: 'info'
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
          
          
          return {
            routes: [],
            alternatives: [],
            warnings: [{
              type: 'accessibility',
              message: `Nie znaleziono połączeń kolejowych między wybranymi punktami. Dystans ${(directDistance/1000).toFixed(1)}km może wymagać innego środka transportu.`,
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
        
        
        if (transportModes.includes('train')) {
          console.log(`🚂 No train stops available and train mode selected, cannot plan walking route`);
          return {
            routes: [],
            alternatives: [],
            warnings: [{
              type: 'accessibility',
              message: `Nie znaleziono przystanków kolejowych w pobliżu. Dystans ${(directDistance/1000).toFixed(1)}km wymaga transportu kolejowego.`,
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
        
        console.log(`🚶 No transit stops available, planning walking-only route (${directDistance.toFixed(0)}m)`);
        return this.planWalkingOnlyRoute(start, end);
      }

      
      const alternativeRoutes = await this.findMultipleRoutes(
        start, 
        end, 
        nearbyStartStops, 
        nearbyEndStops, 
        finalPreferences
      );

      
      if (!alternativeRoutes || alternativeRoutes.length === 0) {
        console.log('🚶 Multimodal route failed, falling back to walking-only');
        return this.planWalkingOnlyRoute(start, end);
      }

      console.log('✅ Successfully planned', alternativeRoutes.length, 'alternative routes');

      const response = {
        routes: [alternativeRoutes[0]], 
        alternatives: alternativeRoutes.slice(1, 5), 
        warnings: [],
        metadata: {
          requestId: this.generateRequestId(),
          processingTime: Date.now(),
          dataTimestamp: new Date(),
          algorithm: 'multimodal-dijkstra',
          version: '1.0.0'
        }
      };
      
      console.log('🔧 multiModalRoutingService - returning response:', {
        routes: response.routes,
        routesLength: response.routes?.length || 0,
        firstRoute: response.routes?.[0] || null
      });
      
      return response;

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
    transportModes: ('walking' | 'bus' | 'tram' | 'train')[]
  ): Array<{ stop: GTFSStop; distance: number; walkingTime: number }> {
    console.log('🔍 findNearbyStops called with:', {
      point,
      transportModes,
      maxWalkingDistance: this.maxWalkingDistance,
      maxWalkingTime: this.maxWalkingTime
    });

    
    const hasTrainMode = transportModes.includes('train');
    const maxDistance = hasTrainMode ? this.maxTrainWalkingDistance : this.maxWalkingDistance;
    const maxTime = hasTrainMode ? this.maxTrainWalkingTime : this.maxWalkingTime;
    
    const allowedTransportTypes = transportModes.filter(mode => mode !== 'walking') as ('bus' | 'tram' | 'train')[];
    console.log('🚌 Allowed transport types:', allowedTransportTypes);
    console.log('🚂 Using train limits:', { hasTrainMode, maxDistance, maxTime });
    
    const allStopsInRange = krakowStops
      .map(stop => {
        const distance = this.calculateDistance(point, stop);
        const walkingTime = this.estimateWalkingTime(distance);
        return { stop, distance, walkingTime };
      })
      .filter(item => {
        return item.distance <= maxDistance && 
               item.walkingTime <= maxTime;
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
        
        return isCompatible;
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    
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

  private async findMultipleRoutes(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    startStops: Array<{ stop: GTFSStop; distance: number; walkingTime: number }>,
    endStops: Array<{ stop: GTFSStop; distance: number; walkingTime: number }>,
    preferences: RoutingPreferences
  ): Promise<MultiModalRoute[]> {
    const routePromises: Promise<{ route: MultiModalRoute | null; score: number; departureTime: number }>[] = [];

    
    const departureIntervals = [0, 10, 15, 20, 25]; 
    
    for (const departureOffset of departureIntervals) {
      for (const startStopData of startStops.slice(0, 3)) { 
        for (const endStopData of endStops.slice(0, 3)) { 
          
          
          const directRoutePromise = this.planRouteViaStopsWithTime(
            from, 
            to, 
            startStopData, 
            endStopData, 
            preferences,
            departureOffset
          ).then(route => {
            if (route) {
              const score = this.calculateRouteScore(route, preferences);
              return { route, score, departureTime: departureOffset };
            }
            return { route: null, score: Infinity, departureTime: departureOffset };
          }).catch(error => {
            console.error('Error planning direct route:', error);
            return { route: null, score: Infinity, departureTime: departureOffset };
          });
          
          routePromises.push(directRoutePromise);

          
          const transferRoutePromise = this.planRouteWithTransfers(
            from,
            to,
            startStopData,
            endStopData,
            preferences,
            departureOffset
          ).then(route => {
            if (route) {
              const score = this.calculateRouteScore(route, preferences);
              return { route, score, departureTime: departureOffset };
            }
            return { route: null, score: Infinity, departureTime: departureOffset };
          }).catch(error => {
            console.error('Error planning transfer route:', error);
            return { route: null, score: Infinity, departureTime: departureOffset };
          });
          
          routePromises.push(transferRoutePromise);
        }
      }
    }

    const results = await Promise.all(routePromises);
    
    
    const validRoutes = results
      .filter(result => result.route !== null)
      .map(result => result.route!)
      .sort((a, b) => {
        
        return a.totalDuration - b.totalDuration;
      });

    
    const uniqueRoutes = this.removeDuplicateRoutes(validRoutes);
    
    console.log(`🔄 Generated ${uniqueRoutes.length} unique alternative routes`);
    
    return uniqueRoutes.slice(0, 5); 
  }

  
  private async planRouteWithTransfers(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    startStopData: { stop: GTFSStop; distance: number; walkingTime: number },
    endStopData: { stop: GTFSStop; distance: number; walkingTime: number },
    preferences: RoutingPreferences,
    departureOffsetMinutes: number
  ): Promise<MultiModalRoute | null> {
    try {
      
      const transferStops = this.findTransferStops(startStopData.stop, endStopData.stop);
      
      if (transferStops.length === 0) {
        return null; 
      }

      let bestRoute: MultiModalRoute | null = null;
      let bestScore = Infinity;

      for (const transferStop of transferStops.slice(0, 2)) { 
        const route = await this.planRouteViaTransferStop(
          from,
          to,
          startStopData,
          transferStop,
          endStopData,
          preferences,
          departureOffsetMinutes
        );

        if (route) {
          const score = this.calculateRouteScore(route, preferences);
          if (score < bestScore) {
            bestScore = score;
            bestRoute = route;
          }
        }
      }

      return bestRoute;
    } catch (error) {
      console.error('Error planning route with transfers:', error);
      return null;
    }
  }

  
  private findTransferStops(startStop: GTFSStop, endStop: GTFSStop): GTFSStop[] {
    const transferDistance = 100; 
    
    return krakowStops.filter(stop => {
      
      if (stop.id === startStop.id || stop.id === endStop.id) {
        return false;
      }

      
      const hasConnectionFromStart = startStop.lines.some(line => stop.lines.includes(line));
      
      
      const hasConnectionToEnd = endStop.lines.some(line => stop.lines.includes(line));

      
      const distanceFromStart = this.calculateDistance(startStop, stop);
      const distanceToEnd = this.calculateDistance(stop, endStop);
      
      
      const isReasonableDistance = distanceFromStart > 200 && distanceToEnd > 200 && 
                                   distanceFromStart < 2000 && distanceToEnd < 2000;

      return hasConnectionFromStart && hasConnectionToEnd && isReasonableDistance;
    }).sort((a, b) => {
      
      const midLat = (startStop.lat + endStop.lat) / 2;
      const midLng = (startStop.lng + endStop.lng) / 2;
      const midPoint = { lat: midLat, lng: midLng };
      
      const distanceA = this.calculateDistance(midPoint, a);
      const distanceB = this.calculateDistance(midPoint, b);
      
      return distanceA - distanceB;
    });
  }

  
  private async planRouteViaTransferStop(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    startStopData: { stop: GTFSStop; distance: number; walkingTime: number },
    transferStop: GTFSStop,
    endStopData: { stop: GTFSStop; distance: number; walkingTime: number },
    preferences: RoutingPreferences,
    departureOffsetMinutes: number
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

      
      const firstTransitSegment = await this.createTransitSegmentWithTime(
        startStopData.stop,
        transferStop,
        preferences,
        departureOffsetMinutes
      );
      if (!firstTransitSegment) {
        return null;
      }
      segments.push(firstTransitSegment);
      totalDistance += firstTransitSegment.distance;
      totalDuration += firstTransitSegment.duration;

      
      const transferDistance = this.calculateDistance(transferStop, transferStop);
      const transferWalk = await this.createWalkingSegment(transferStop, transferStop);
      if (transferWalk) {
        
        transferWalk.duration = Math.max(2, Math.ceil(transferDistance / 50)); 
        transferWalk.instructions = `Przesiadka`;
        segments.push(transferWalk);
        totalDuration += transferWalk.duration;
      }

      
      const secondTransitSegment = await this.createTransitSegmentWithTime(
        transferStop,
        endStopData.stop,
        preferences,
        departureOffsetMinutes + totalDuration
      );
      if (!secondTransitSegment) {
        return null;
      }
      segments.push(secondTransitSegment);
      totalDistance += secondTransitSegment.distance;
      totalDuration += secondTransitSegment.duration;

      
      const walkFromEnd = await this.createWalkingSegment(endStopData.stop, to);
      if (walkFromEnd) {
        segments.push(walkFromEnd);
        totalDistance += walkFromEnd.distance;
        totalDuration += walkFromEnd.duration;
      }

      
      const waitingTime = Math.floor(Math.random() * 4) + 3; 
      totalDuration += waitingTime;

      const route: MultiModalRoute = {
        id: this.generateRouteId(),
        segments,
        totalDistance,
        totalDuration,
        walkingTime: segments.filter(s => s.type === 'walking').reduce((sum, s) => sum + s.duration, 0),
        walkingDistance: segments.filter(s => s.type === 'walking').reduce((sum, s) => sum + s.distance, 0),
        transferCount: segments.filter(s => s.type !== 'walking').length - 1,
        createdAt: new Date()
      };

      console.log(`🔄 Trasa z przesiadką: segmentów=${segments.length}, przesiadek=${route.transferCount}, totalDuration=${totalDuration}min`);

      return route;

    } catch (error) {
      console.error('Error planning route via transfer stop:', error);
      return null;
    }
  }

  private async planRouteViaStopsWithTime(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    startStopData: { stop: GTFSStop; distance: number; walkingTime: number },
    endStopData: { stop: GTFSStop; distance: number; walkingTime: number },
    preferences: RoutingPreferences,
    departureOffsetMinutes: number
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

      const transitSegment = await this.createTransitSegmentWithTime(
        startStopData.stop, 
        endStopData.stop, 
        preferences,
        departureOffsetMinutes
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

      
      const waitingTime = Math.floor(Math.random() * 4) + 2; 
      totalDuration += waitingTime + departureOffsetMinutes;

      const route: MultiModalRoute = {
        id: this.generateRouteId(),
        segments,
        totalDistance,
        totalDuration,
        walkingTime: segments.filter(s => s.type === 'walking').reduce((sum, s) => sum + s.duration, 0),
        walkingDistance: segments.filter(s => s.type === 'walking').reduce((sum, s) => sum + s.distance, 0),
        transferCount: segments.filter(s => s.type !== 'walking').length - 1,
        createdAt: new Date()
      };

      console.log(`📊 Trasa z odjazdem +${departureOffsetMinutes}min: segmentów=${segments.length}, totalDistance=${totalDistance.toFixed(0)}m, totalDuration=${totalDuration}min`);

      return route;

    } catch (error) {
      console.error('Błąd planowania trasy z czasem:', error);
      return null;
    }
  }

  private removeDuplicateRoutes(routes: MultiModalRoute[]): MultiModalRoute[] {
    const uniqueRoutes: MultiModalRoute[] = [];
    
    for (const route of routes) {
      const isDuplicate = uniqueRoutes.some(existingRoute => {
        
        const timeDiff = Math.abs(existingRoute.totalDuration - route.totalDuration);
        const sameStops = this.routesUseSameStops(existingRoute, route);
        
        return timeDiff < 5 && sameStops;
      });
      
      if (!isDuplicate) {
        uniqueRoutes.push(route);
      }
    }
    
    return uniqueRoutes;
  }

  private routesUseSameStops(route1: MultiModalRoute, route2: MultiModalRoute): boolean {
    const getTransitStops = (route: MultiModalRoute) => {
      return route.segments
        .filter(s => s.type === 'bus' || s.type === 'tram')
        .map(s => `${s.startPoint.lat},${s.startPoint.lng}-${s.endPoint.lat},${s.endPoint.lng}`)
        .join('|');
    };
    
    return getTransitStops(route1) === getTransitStops(route2);
  }

  private async createTransitSegmentWithTime(
    fromStop: GTFSStop,
    toStop: GTFSStop,
    preferences: RoutingPreferences,
    departureOffsetMinutes: number
  ): Promise<TransitSegment | null> {
    
    const commonLines = fromStop.lines.filter(line => toStop.lines.includes(line));
    
    if (commonLines.length === 0) {
      return null;
    }

    const selectedLine = this.selectBestLine(commonLines, fromStop, toStop, preferences);
    const route = krakowRoutes.find(r => r.shortName === selectedLine);
    
    if (!route) {
      console.log(`❌ Nie znaleziono trasy dla linii ${selectedLine}`);
      return null;
    }

    const distance = this.calculateDistance(fromStop, toStop);
    const baseDuration = this.estimateTransitTime(distance, route.type);
    
    
    const timeVariation = Math.floor(Math.random() * 5) - 2; 
    const duration = Math.max(1, baseDuration + timeVariation);

    
    let geometry: [number, number][];
    try {
      geometry = await this.createTransitGeometry(fromStop, toStop);
    } catch (error) {
      console.error(`❌ Nie udało się pobrać geometrii OSRM dla segmentu transportu publicznego:`, error);
      
      return null;
    }

    
    const instructions = `Jedź ${route.type === 'tram' ? 'tramwajem' : route.type === 'train' ? 'pociągiem' : 'autobusem'} do ${route.longName}`;

    
    const now = new Date();
    const departureTime = new Date(now.getTime() + departureOffsetMinutes * 60000);
    const arrivalTime = new Date(departureTime.getTime() + duration * 60000);

    console.log(`🚌 Tworzenie segmentu z czasem ${route.type}: linia=${selectedLine} (z ${commonLines.length} dostępnych), dystans=${distance.toFixed(0)}m, czas=${duration}min`);

    return {
      id: this.generateSegmentId(),
      type: route.type as 'bus' | 'tram' | 'train',
      startPoint: fromStop,
      endPoint: toStop,
      distance,
      duration,
      instructions,
      lineNumber: selectedLine, 
      direction: route.longName,
      headsign: route.longName,
      boardingStop: { ...fromStop, stopIcon: fromStop.type },
      alightingStop: { ...toStop, stopIcon: toStop.type },
      intermediateStops: [],
      scheduledDeparture: departureTime,
      scheduledArrival: arrivalTime,
      realTimeDeparture: departureTime,
      realTimeArrival: arrivalTime,
      platform: `${Math.floor(Math.random() * 4) + 1}`,
      geometry: {
        type: 'LineString',
        coordinates: geometry
      },
      routeColor: route.color
    };
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
      console.log(`🚶 Tworzenie segmentu pieszego z [${from.lat}, ${from.lng}] do [${to.lat}, ${to.lng}]`);
      
      
      const straightLineDistance = this.calculateDistance(from, to);
      console.log(`📏 Odległość w linii prostej: ${straightLineDistance.toFixed(0)}m`);
      
      
      const MAX_REASONABLE_WALKING_DISTANCE = 5000; 
      const MAX_REASONABLE_WALKING_TIME = 60; 
      
      if (straightLineDistance > MAX_REASONABLE_WALKING_DISTANCE) {
        console.warn(`⚠️ Odległość ${straightLineDistance.toFixed(0)}m przekracza maksymalną rozsądną odległość pieszą (${MAX_REASONABLE_WALKING_DISTANCE}m)`);
        return null;
      }
      
      const walkingRoute = await this.getCachedOSRMRoute(from, to, 'walking');
      
      let distance: number;
      let duration: number;
      let geometry: [number, number][];

      if (walkingRoute?.routes?.[0]) {
        distance = walkingRoute.routes[0].distance;
        duration = Math.ceil(walkingRoute.routes[0].duration / 60); 
        geometry = walkingRoute.routes[0].geometry.coordinates;
        console.log(`✅ Segment pieszy z OSRM: dystans=${distance.toFixed(0)}m, czas=${duration}min, punktów=${geometry.length}`);
        
        
        if (distance > MAX_REASONABLE_WALKING_DISTANCE || duration > MAX_REASONABLE_WALKING_TIME) {
          console.warn(`⚠️ OSRM zwróciło nierealistyczne dane: dystans=${distance.toFixed(0)}m, czas=${duration}min`);
          return null;
        }
      } else {
        distance = straightLineDistance;
        duration = this.estimateWalkingTime(distance);
        geometry = this.createStraightLineGeometry(from, to);
        console.log(`⚠️ Segment pieszy (fallback): dystans=${distance.toFixed(0)}m, czas=${duration}min`);
        
        
        if (duration > MAX_REASONABLE_WALKING_TIME) {
          console.warn(`⚠️ Fallback zwróciło nierealistyczny czas: ${duration}min`);
          return null;
        }
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
      console.error('❌ Błąd tworzenia segmentu pieszego:', error);
      return null;
    }
  }

  private findTrainRoute(fromStop: GTFSStop, toStop: GTFSStop): { trainLine: any; route: any; intermediateStops: GTFSStop[] } | null {
    
    if (fromStop.type !== 'train' || toStop.type !== 'train') {
      return null;
    }

    
    for (const trainLine of TRAIN_LINES_DATA) {
      const fromIndex = trainLine.route.indexOf(fromStop.id);
      const toIndex = trainLine.route.indexOf(toStop.id);
      
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        
        const isValidDirection = fromIndex < toIndex;
        if (isValidDirection) {
          
          const route = krakowRoutes.find(r => r.shortName === trainLine.id);
          if (route) {
            
            const intermediateStopIds = trainLine.route.slice(fromIndex, toIndex + 1);
            const intermediateStops = intermediateStopIds.map(stopId => 
              krakowStops.find(stop => stop.id === stopId)
            ).filter(stop => stop !== undefined) as GTFSStop[];
            
            return { trainLine, route, intermediateStops };
          }
        }
      }
    }
    
    return null;
  }

  private async createTrainSegment(
    fromStop: GTFSStop,
    toStop: GTFSStop,
    trainRouteInfo: { trainLine: any; route: any; intermediateStops: GTFSStop[] },
    preferences: RoutingPreferences
  ): Promise<TransitSegment | null> {
    const { trainLine, route, intermediateStops } = trainRouteInfo;
    
    
    let totalDistance = 0;
    for (let i = 0; i < intermediateStops.length - 1; i++) {
      const currentStop = intermediateStops[i];
      const nextStop = intermediateStops[i + 1];
      totalDistance += this.calculateDistance(
        { lat: currentStop.lat, lng: currentStop.lng },
        { lat: nextStop.lat, lng: nextStop.lng }
      );
    }

    
    const averageTrainSpeed = 80; 
    const estimatedDuration = Math.round((totalDistance / averageTrainSpeed) * 60); 

    
    const activeDisruptions = getActiveDisruptionsForRoute(route.id);
    let additionalDelay = 0;
    
    activeDisruptions.forEach(disruption => {
      if (disruption.estimatedDelay) {
        additionalDelay += disruption.estimatedDelay;
      }
    });

    const totalDuration = estimatedDuration + additionalDelay;
    
    
    let instructions = `Jedź pociągiem ${route.shortName} (${trainLine.description})`;
    if (intermediateStops.length > 2) {
      const stopNames = intermediateStops.slice(1, -1).map(stop => stop.name).join(', ');
      instructions += ` przez: ${stopNames}`;
    }
    
    
    if (activeDisruptions.length > 0) {
      const criticalDisruptions = activeDisruptions.filter(d => d.severity === 'critical');
      if (criticalDisruptions.length > 0) {
        instructions += ` ⚠️ ${criticalDisruptions[0].title}`;
      }
    }

    
    const now = new Date();
    const scheduledDeparture = new Date(now.getTime() + 5 * 60 * 1000); 
    const scheduledArrival = new Date(scheduledDeparture.getTime() + totalDuration * 60 * 1000);

    
    const enhancedIntermediateStops = intermediateStops.slice(1, -1).map(stop => ({
      ...stop,
      stopIcon: 'train' as const,
      accessibility: true,
      realTimeDepartures: [],
      nearbyStops: [],
      transferConnections: []
    }));

    
    const enhancedFromStop = {
      ...fromStop,
      stopIcon: 'train' as const,
      accessibility: true,
      realTimeDepartures: [],
      nearbyStops: [],
      transferConnections: []
    };

    const enhancedToStop = {
      ...toStop,
      stopIcon: 'train' as const,
      accessibility: true,
      realTimeDepartures: [],
      nearbyStops: [],
      transferConnections: []
    };

    
    const coordinates: [number, number][] = intermediateStops.map(stop => [stop.lng, stop.lat]);

    return {
      id: this.generateSegmentId(),
      type: 'train',
      startPoint: { lat: fromStop.lat, lng: fromStop.lng },
      endPoint: { lat: toStop.lat, lng: toStop.lng },
      lineNumber: route.shortName,
      direction: trainLine.description,
      headsign: toStop.name,
      boardingStop: enhancedFromStop,
      alightingStop: enhancedToStop,
      intermediateStops: enhancedIntermediateStops,
      scheduledDeparture,
      scheduledArrival,
      distance: totalDistance * 1000, 
      duration: totalDuration,
      instructions,
      geometry: {
        type: 'LineString',
        coordinates
      },
      routeColor: route.color,
      stopSequence: intermediateStops.map(stop => ({
        ...stop,
        stopIcon: 'train' as const,
        accessibility: true,
        realTimeDepartures: [],
        nearbyStops: [],
        transferConnections: []
      }))
    };
  }

  private async createTransitSegment(
    fromStop: GTFSStop,
    toStop: GTFSStop,
    preferences: RoutingPreferences
  ): Promise<TransitSegment | null> {
    
    
    if (fromStop.type === 'train' || toStop.type === 'train') {
      const trainRouteInfo = this.findTrainRoute(fromStop, toStop);
      if (trainRouteInfo) {
        return this.createTrainSegment(fromStop, toStop, trainRouteInfo, preferences);
      }
    }
    
    const commonLines = fromStop.lines.filter(line => toStop.lines.includes(line));
    
    if (commonLines.length === 0) {
      return null;
    }
    
    const bestLine = this.selectBestLine(commonLines, fromStop, toStop, preferences);
    const route = krakowRoutes.find(r => r.shortName === bestLine);

    if (!route) {
      console.log(`❌ Nie znaleziono trasy dla linii ${bestLine}`);
      return null;
    }

    
    const disruptions = getActiveDisruptionsForRoute(route.id);
    const hasDisruption = disruptions.length > 0;
    const additionalDelay = hasDisruption ? disruptions[0].estimatedDelay || 0 : 0;

    const distance = this.calculateDistance(fromStop, toStop);
    let duration = this.estimateTransitTime(distance, route.type);
    
    
    if (hasDisruption) {
      duration += additionalDelay;
      console.log(`⚠️ Utrudnienie na trasie ${route.shortName}: +${additionalDelay}min - ${disruptions[0].title}`);
    }
    
    
    let instructions = `Jedź ${route.type === 'tram' ? 'tramwajem' : route.type === 'train' ? 'pociągiem' : 'autobusem'} do ${route.longName}`;
    
    
    if (hasDisruption && disruptions[0].severity === 'critical') {
      instructions += ` (UWAGA: ${disruptions[0].title})`;
    }
    
    console.log(`🚌 Tworzenie segmentu ${route.type}: linia=${route.shortName} (z ${commonLines.length} dostępnych), dystans=${distance.toFixed(0)}m, czas=${duration}min`);

    
    let geometry: [number, number][];
    try {
      geometry = await this.createTransitGeometry(fromStop, toStop);
    } catch (error) {
      console.error(`❌ Nie udało się pobrać geometrii OSRM dla segmentu transportu publicznego:`, error);
      
      return null;
    }

    const scheduledDeparture = new Date(Date.now() + Math.random() * 10 * 60000);
    const scheduledArrival = new Date(scheduledDeparture.getTime() + duration * 60000);

    return {
      id: this.generateSegmentId(),
      type: route.type,
      startPoint: fromStop,
      endPoint: toStop,
      distance,
      duration,
      instructions,
      lineNumber: route.shortName, 
      direction: route.longName,
      headsign: route.longName,
      boardingStop: { ...fromStop, stopIcon: fromStop.type },
      alightingStop: { ...toStop, stopIcon: toStop.type },
      intermediateStops: [],
      scheduledDeparture,
      scheduledArrival,
      realTimeDeparture: hasDisruption ? new Date(scheduledDeparture.getTime() + additionalDelay * 60000) : scheduledDeparture,
      realTimeArrival: hasDisruption ? new Date(scheduledArrival.getTime() + additionalDelay * 60000) : scheduledArrival,
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
    
    const distance = this.calculateDistance(from, to);
    console.log(`🚶 Planowanie trasy pieszej na odległość: ${distance.toFixed(0)}m`);
    
    if (distance > 5000) { 
      return {
          routes: [],
          alternatives: [],
          warnings: [{
            type: 'accessibility',
            message: `Odległość ${(distance/1000).toFixed(1)}km jest zbyt duża dla trasy pieszej. Spróbuj wybrać środek transportu publicznego.`,
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

  private estimateTransitTime(distance: number, transportType: 'bus' | 'tram' | 'train'): number {
    
    const speed = transportType === 'tram' ? 20 : transportType === 'train' ? 60 : 15;
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
    score += walkingDistance * (preferences.minimizeWalking ? 3 : 0.5);
    
    
    const transferCount = route.segments.filter(s => s.type !== 'walking').length - 1;
    score += transferCount * (preferences.minimizeTransfers ? 600 : 300);
    
    
    const hasPublicTransport = route.segments.some(s => s.type === 'bus' || s.type === 'tram');
    if (hasPublicTransport) {
      score -= 500; 
    }
    
    
    const isWalkingOnly = route.segments.every(s => s.type === 'walking');
    if (isWalkingOnly && route.totalDistance > 1000) {
      score += route.totalDistance * 0.5; 
    }
    
    return score;
  }

  private selectBestLine(
    lines: string[],
    fromStop: GTFSStop,
    toStop: GTFSStop,
    preferences: RoutingPreferences
  ): string {
    
    const sortedLines = lines.sort((a, b) => {
      const routeA = krakowRoutes.find(r => r.shortName === a);
      const routeB = krakowRoutes.find(r => r.shortName === b);
      
      if (!routeA || !routeB) return 0;
      
      
      if (preferences.preferExpress) {
        const isExpressA = routeA.shortName.includes('E') || parseInt(routeA.shortName) > 100;
        const isExpressB = routeB.shortName.includes('E') || parseInt(routeB.shortName) > 100;
        if (isExpressA && !isExpressB) return -1;
        if (!isExpressA && isExpressB) return 1;
      }
      
      
      return parseInt(a) - parseInt(b);
    });
    

    return sortedLines[0];
  }

  private formatMultipleLines(lines: string[]): string {
    
    if (lines.length === 1) {
      return lines[0];
    } else {
      
      return lines[0];
    }
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
    const maxRetries = 3;
    let lastError: any = null;
    
    console.log(`🗺️ Tworzenie geometrii transportu publicznego z OSRM (driving profile)`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Próba ${attempt}/${maxRetries} pobrania geometrii OSRM dla transportu publicznego`);
        
        
        const transitRoute = await osrmClient.getRoute(fromStop, toStop, 'driving');
        
        if (transitRoute?.routes?.[0]?.geometry?.coordinates) {
          const coordinates = transitRoute.routes[0].geometry.coordinates;
          console.log(`✅ Sukces! Geometria transportu publicznego z OSRM (próba ${attempt}): ${coordinates.length} punktów`);
          console.log(`🛣️ Pierwsza współrzędna: [${coordinates[0][0]}, ${coordinates[0][1]}]`);
          console.log(`🛣️ Ostatnia współrzędna: [${coordinates[coordinates.length-1][0]}, ${coordinates[coordinates.length-1][1]}]`);
          return coordinates;
        } else {
          console.warn(`⚠️ OSRM zwrócił pustą odpowiedź (próba ${attempt})`);
          console.warn(`📊 Odpowiedź OSRM:`, JSON.stringify(transitRoute, null, 2));
          lastError = new Error('Empty OSRM response');
        }
      } catch (error) {
        console.error(`❌ Błąd OSRM (próba ${attempt}/${maxRetries}):`, error);
        lastError = error;
        
        
        if (attempt < maxRetries) {
          const waitTime = 1000 * attempt; 
          console.log(`⏳ Czekam ${waitTime}ms przed kolejną próbą...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    
    const errorMessage = `OSRM nie działa po ${maxRetries} próbach. Ostatni błąd: ${lastError?.message || 'Unknown error'}`;
    console.error(`❌ ${errorMessage}`);
    
    
    throw new Error(errorMessage);
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