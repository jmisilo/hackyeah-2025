# Urban Navigator - Przewodnik Implementacji

## Szczegółowy Plan Implementacji Rozszerzonych Funkcjonalności

## 1. Przegląd Implementacji

Ten dokument opisuje krok po kroku implementację nowych funkcjonalności Urban Navigator:

* Real-time tracking pojazdów z animacjami

* Inteligentne planowanie tras z segmentami pieszymi

* Rozdzielenie przystanków na tramwajowe i autobusowe

* Animowane linie tras

* Rozszerzone informacje o przystankach

## 2. Struktura Plików do Modyfikacji/Utworzenia

```
src/
├── components/
│   ├── map/
│   │   ├── UrbanNavigator.tsx (MODYFIKACJA)
│   │   ├── VehicleTracker.tsx (NOWY)
│   │   ├── AnimatedRouteLine.tsx (NOWY)
│   │   ├── EnhancedStopMarker.tsx (NOWY)
│   │   └── MultiModalRouting.tsx (NOWY)
│   ├── ui/
│   │   ├── RouteSegmentCard.tsx (NOWY)
│   │   ├── StopDetailsPanel.tsx (NOWY)
│   │   └── VehicleIcon.tsx (NOWY)
├── hooks/
│   ├── useVehicleTracking.ts (NOWY)
│   ├── useMultiModalRouting.ts (NOWY)
│   └── useAnimatedRoute.ts (NOWY)
├── services/
│   ├── vehicleTrackingService.ts (NOWY)
│   ├── multiModalRoutingService.ts (NOWY)
│   └── realTimeService.ts (NOWY)
├── types/
│   ├── vehicle.types.ts (NOWY)
│   ├── routing.types.ts (NOWY)
│   └── enhanced-gtfs.types.ts (NOWY)
└── infrastructure/
    ├── gtfs/
    │   ├── gtfs-data.ts (MODYFIKACJA)
    │   ├── vehicle-positions.ts (NOWY)
    │   └── real-time-departures.ts (NOWY)
    └── routing/
        └── multi-modal-router.ts (NOWY)
```

## 3. Implementacja Krok po Kroku

### Krok 1: Rozszerzenie Typów i Interfejsów

**Plik:** **`src/types/enhanced-gtfs.types.ts`**

```typescript
export interface EnhancedGTFSStop extends GTFSStop {
  walkingTime?: number;
  walkingDistance?: number;
  realTimeDepartures?: RealTimeDeparture[];
  stopIcon: 'bus' | 'tram' | 'both';
  accessibility?: boolean;
}

export interface RealTimeDeparture {
  lineNumber: string;
  destination: string;
  departureTime: string;
  delay: number;
  vehicleId?: string;
  routeColor: string;
  routeType: 'bus' | 'tram';
}

export interface VehiclePosition {
  vehicleId: string;
  lineNumber: string;
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
  timestamp: Date;
  routeType: 'bus' | 'tram';
  routeColor: string;
}

export interface RouteSegment {
  id: string;
  type: 'walking' | 'bus' | 'tram';
  startPoint: LatLng;
  endPoint: LatLng;
  duration: number; 
  distance: number; 
  instructions: string;
  lineNumber?: string;
  stopSequence?: EnhancedGTFSStop[];
  geometry: GeoJSON.LineString;
  routeColor?: string;
}

export interface MultiModalRoute {
  id: string;
  segments: RouteSegment[];
  totalDuration: number;
  totalDistance: number;
  walkingTime: number;
  walkingDistance: number;
  transferCount: number;
  createdAt: Date;
}
```

### Krok 2: Serwis Real-time Tracking Pojazdów

**Plik:** **`src/services/vehicleTrackingService.ts`**

```typescript
import { VehiclePosition } from '../types/enhanced-gtfs.types';

class VehicleTrackingService {
  private ws: WebSocket | null = null;
  private vehicles: Map<string, VehiclePosition> = new Map();
  private subscribers: Set<(vehicles: VehiclePosition[]) => void> = new Set();

  connect() {
    this.ws = new WebSocket('ws://localhost:3001/ws/vehicle-tracking');
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'vehicle_update') {
        this.updateVehiclePosition(data.vehicle);
      }
    };

    this.ws.onopen = () => {
      console.log('Vehicle tracking connected');
      this.subscribeToUpdates();
    };
  }

  private updateVehiclePosition(vehicle: VehiclePosition) {
    this.vehicles.set(vehicle.vehicleId, vehicle);
    this.notifySubscribers();
  }

  private notifySubscribers() {
    const vehicleList = Array.from(this.vehicles.values());
    this.subscribers.forEach(callback => callback(vehicleList));
  }

  subscribe(callback: (vehicles: VehiclePosition[]) => void) {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  async getVehiclePositions(bounds?: string, lines?: string[]): Promise<VehiclePosition[]> {
    const params = new URLSearchParams();
    if (bounds) params.append('bounds', bounds);
    if (lines) params.append('lines', lines.join(','));

    const response = await fetch(`/api/vehicles/positions?${params}`);
    const data = await response.json();
    
    return data.vehicles;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const vehicleTrackingService = new VehicleTrackingService();
```

### Krok 3: Hook dla Vehicle Tracking

**Plik:** **`src/hooks/useVehicleTracking.ts`**

```typescript
import { useState, useEffect } from 'react';
import { VehiclePosition } from '../types/enhanced-gtfs.types';
import { vehicleTrackingService } from '../services/vehicleTrackingService';

export const useVehicleTracking = (lines?: string[]) => {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    vehicleTrackingService.connect();
    setIsConnected(true);

    const unsubscribe = vehicleTrackingService.subscribe((updatedVehicles) => {
      const filteredVehicles = lines 
        ? updatedVehicles.filter(v => lines.includes(v.lineNumber))
        : updatedVehicles;
      
      setVehicles(filteredVehicles);
    });

    return () => {
      unsubscribe();
      vehicleTrackingService.disconnect();
      setIsConnected(false);
    };
  }, [lines]);

  return { vehicles, isConnected };
};
```

### Krok 4: Komponent Vehicle Tracker

**Plik:** **`src/components/map/VehicleTracker.tsx`**

```typescript
import React from 'react';
import { Marker } from 'react-leaflet';
import { VehiclePosition } from '../../types/enhanced-gtfs.types';
import { useVehicleTracking } from '../../hooks/useVehicleTracking';
import { VehicleIcon } from '../ui/VehicleIcon';

interface VehicleTrackerProps {
  lines?: string[];
  onVehicleClick?: (vehicle: VehiclePosition) => void;
}

export const VehicleTracker: React.FC<VehicleTrackerProps> = ({ 
  lines, 
  onVehicleClick 
}) => {
  const { vehicles, isConnected } = useVehicleTracking(lines);

  if (!isConnected) {
    return null;
  }

  return (
    <>
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.vehicleId}
          position={[vehicle.lat, vehicle.lng]}
          icon={VehicleIcon.create(vehicle)}
          eventHandlers={{
            click: () => onVehicleClick?.(vehicle)
          }}
        >
          <div className="vehicle-popup">
            <div className="font-semibold">Linia {vehicle.lineNumber}</div>
            <div className="text-sm text-gray-600">
              Prędkość: {vehicle.speed} km/h
            </div>
            <div className="text-xs text-gray-500">
              ID: {vehicle.vehicleId}
            </div>
          </div>
        </Marker>
      ))}
    </>
  );
};
```

### Krok 5: Komponent Animowanej Linii Trasy

**Plik:** **`src/components/map/AnimatedRouteLine.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { RouteSegment } from '../../types/enhanced-gtfs.types';
import { useAnimatedRoute } from '../../hooks/useAnimatedRoute';

interface AnimatedRouteLineProps {
  segments: RouteSegment[];
  isAnimating?: boolean;
  animationSpeed?: number;
}

export const AnimatedRouteLine: React.FC<AnimatedRouteLineProps> = ({
  segments,
  isAnimating = true,
  animationSpeed = 1000
}) => {
  const map = useMap();
  const { animateRoute, stopAnimation } = useAnimatedRoute();

  useEffect(() => {
    if (!segments.length) return;

    const layers: any[] = [];

    segments.forEach((segment, index) => {
      const color = getSegmentColor(segment.type);
      const weight = segment.type === 'walking' ? 3 : 5;
      const dashArray = segment.type === 'walking' ? '5, 5' : undefined;

      if (isAnimating) {
        
        animateRoute(segment, {
          color,
          weight,
          opacity: 0.8,
          dashArray,
          delay: index * animationSpeed
        }).then((layer) => {
          layers.push(layer);
          layer.addTo(map);
        });
      } else {
        
        const layer = (window as any).L.geoJSON(segment.geometry, {
          style: {
            color,
            weight,
            opacity: 0.8,
            dashArray
          }
        }).addTo(map);
        
        layers.push(layer);
      }
    });

    return () => {
      layers.forEach(layer => map.removeLayer(layer));
      stopAnimation();
    };
  }, [segments, isAnimating, animationSpeed, map]);

  return null;
};

const getSegmentColor = (type: RouteSegment['type']): string => {
  switch (type) {
    case 'walking': return '#6B7280';
    case 'bus': return '#F97316';
    case 'tram': return '#22C55E';
    default: return '#6B7280';
  }
};
```

### Krok 6: Hook dla Animacji Tras

**Plik:** **`src/hooks/useAnimatedRoute.ts`**

```typescript
import { useCallback, useRef } from 'react';
import { RouteSegment } from '../types/enhanced-gtfs.types';

export const useAnimatedRoute = () => {
  const animationRef = useRef<number | null>(null);

  const animateRoute = useCallback(async (
    segment: RouteSegment,
    style: any,
    options: { delay?: number } = {}
  ) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const coordinates = segment.geometry.coordinates;
        let currentIndex = 0;
        const animatedCoordinates: [number, number][] = [];

        const animate = () => {
          if (currentIndex < coordinates.length) {
            animatedCoordinates.push([
              coordinates[currentIndex][1], 
              coordinates[currentIndex][0]  
            ]);

            
            const layer = (window as any).L.polyline(animatedCoordinates, style);
            
            currentIndex++;
            animationRef.current = requestAnimationFrame(animate);
          } else {
            resolve(layer);
          }
        };

        animate();
      }, options.delay || 0);
    });
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  return { animateRoute, stopAnimation };
};
```

### Krok 7: Serwis Multi-Modal Routing

**Plik:** **`src/services/multiModalRoutingService.ts`**

```typescript
import { LatLng } from '../types/common.types';
import { MultiModalRoute, RouteSegment, EnhancedGTFSStop } from '../types/enhanced-gtfs.types';
import { findNearbyStops } from '../infrastructure/gtfs/gtfs-data';
import { osrmClient } from '../infrastructure/routing/osrm-client';

class MultiModalRoutingService {
  async planRoute(
    start: LatLng,
    end: LatLng,
    options: {
      transportModes: ('bus' | 'tram')[];
      maxWalkingDistance: number;
      departureTime?: string;
    }
  ): Promise<MultiModalRoute> {
    const segments: RouteSegment[] = [];
    let totalDuration = 0;
    let totalDistance = 0;
    let walkingTime = 0;
    let walkingDistance = 0;

    
    const startStops = this.findOptimalStops(start, options.transportModes, options.maxWalkingDistance);
    const endStops = this.findOptimalStops(end, options.transportModes, options.maxWalkingDistance);

    if (startStops.length === 0 || endStops.length === 0) {
      
      const walkingSegment = await this.createWalkingSegment(start, end, 'Cała trasa pieszo');
      segments.push(walkingSegment);
      totalDuration = walkingSegment.duration;
      totalDistance = walkingSegment.distance;
      walkingTime = walkingSegment.duration;
      walkingDistance = walkingSegment.distance;
    } else {
      
      const bestRoute = await this.findBestRoute(start, end, startStops, endStops, options);
      segments.push(...bestRoute.segments);
      totalDuration = bestRoute.totalDuration;
      totalDistance = bestRoute.totalDistance;
      walkingTime = bestRoute.walkingTime;
      walkingDistance = bestRoute.walkingDistance;
    }

    return {
      id: `route_${Date.now()}`,
      segments,
      totalDuration,
      totalDistance,
      walkingTime,
      walkingDistance,
      transferCount: segments.filter(s => s.type !== 'walking').length - 1,
      createdAt: new Date()
    };
  }

  private findOptimalStops(
    point: LatLng,
    transportModes: ('bus' | 'tram')[],
    maxDistance: number
  ): EnhancedGTFSStop[] {
    const nearbyStops = findNearbyStops(point.lat, point.lng, maxDistance / 111000); 
    
    return nearbyStops
      .filter(stop => {
        if (transportModes.includes('bus') && transportModes.includes('tram')) {
          return true; 
        }
        if (transportModes.includes('bus')) {
          return stop.type === 'bus' || stop.type === 'both';
        }
        if (transportModes.includes('tram')) {
          return stop.type === 'tram' || stop.type === 'both';
        }
        return false;
      })
      .map(stop => ({
        ...stop,
        walkingDistance: this.calculateDistance(point, { lat: stop.lat, lng: stop.lng }),
        walkingTime: this.calculateWalkingTime(point, { lat: stop.lat, lng: stop.lng })
      }))
      .sort((a, b) => (a.walkingTime || 0) - (b.walkingTime || 0))
      .slice(0, 3); 
  }

  private async findBestRoute(
    start: LatLng,
    end: LatLng,
    startStops: EnhancedGTFSStop[],
    endStops: EnhancedGTFSStop[],
    options: any
  ): Promise<{
    segments: RouteSegment[];
    totalDuration: number;
    totalDistance: number;
    walkingTime: number;
    walkingDistance: number;
  }> {
    let bestRoute: any = null;
    let bestTime = Infinity;

    for (const startStop of startStops) {
      for (const endStop of endStops) {
        if (startStop.id === endStop.id) continue;

        const route = await this.calculateRouteViaStops(start, end, startStop, endStop);
        
        if (route.totalDuration < bestTime) {
          bestTime = route.totalDuration;
          bestRoute = route;
        }
      }
    }

    return bestRoute || {
      segments: [],
      totalDuration: 0,
      totalDistance: 0,
      walkingTime: 0,
      walkingDistance: 0
    };
  }

  private async calculateRouteViaStops(
    start: LatLng,
    end: LatLng,
    startStop: EnhancedGTFSStop,
    endStop: EnhancedGTFSStop
  ): Promise<any> {
    const segments: RouteSegment[] = [];
    let totalDuration = 0;
    let totalDistance = 0;
    let walkingTime = 0;
    let walkingDistance = 0;

    
    const walkToStart = await this.createWalkingSegment(
      start,
      { lat: startStop.lat, lng: startStop.lng },
      `Pieszo do przystanku ${startStop.name}`
    );
    segments.push(walkToStart);
    totalDuration += walkToStart.duration;
    totalDistance += walkToStart.distance;
    walkingTime += walkToStart.duration;
    walkingDistance += walkToStart.distance;

    
    const transportSegment = await this.createTransportSegment(startStop, endStop);
    segments.push(transportSegment);
    totalDuration += transportSegment.duration;
    totalDistance += transportSegment.distance;

    
    const walkFromEnd = await this.createWalkingSegment(
      { lat: endStop.lat, lng: endStop.lng },
      end,
      `Pieszo z przystanku ${endStop.name}`
    );
    segments.push(walkFromEnd);
    totalDuration += walkFromEnd.duration;
    totalDistance += walkFromEnd.distance;
    walkingTime += walkFromEnd.duration;
    walkingDistance += walkFromEnd.distance;

    return {
      segments,
      totalDuration,
      totalDistance,
      walkingTime,
      walkingDistance
    };
  }

  private async createWalkingSegment(
    start: LatLng,
    end: LatLng,
    instructions: string
  ): Promise<RouteSegment> {
    const route = await osrmClient.getRouteGeoJSON(start, end);
    
    return {
      id: `walking_${Date.now()}_${Math.random()}`,
      type: 'walking',
      startPoint: start,
      endPoint: end,
      duration: route.properties.duration,
      distance: route.properties.distance,
      instructions,
      geometry: route.geometry
    };
  }

  private async createTransportSegment(
    startStop: EnhancedGTFSStop,
    endStop: EnhancedGTFSStop
  ): Promise<RouteSegment> {
    
    const commonLines = startStop.lines.filter(line => endStop.lines.includes(line));
    const selectedLine = commonLines[0]; 

    
    const route = await osrmClient.getRouteGeoJSON(
      { lat: startStop.lat, lng: startStop.lng },
      { lat: endStop.lat, lng: endStop.lng }
    );

    const transportType = this.getTransportType(selectedLine);
    
    return {
      id: `transport_${Date.now()}_${Math.random()}`,
      type: transportType,
      startPoint: { lat: startStop.lat, lng: startStop.lng },
      endPoint: { lat: endStop.lat, lng: endStop.lng },
      duration: route.properties.duration * 0.8, 
      distance: route.properties.distance,
      instructions: `${transportType === 'bus' ? 'Autobusem' : 'Tramwajem'} linii ${selectedLine} z ${startStop.name} do ${endStop.name}`,
      lineNumber: selectedLine,
      geometry: route.geometry,
      routeColor: this.getRouteColor(transportType)
    };
  }

  private getTransportType(lineNumber: string): 'bus' | 'tram' {
    
    const num = parseInt(lineNumber);
    return num <= 30 ? 'tram' : 'bus';
  }

  private getRouteColor(type: 'bus' | 'tram'): string {
    return type === 'bus' ? '#F97316' : '#22C55E';
  }

  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371000; 
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateWalkingTime(point1: LatLng, point2: LatLng): number {
    const distance = this.calculateDistance(point1, point2);
    const walkingSpeed = 1.4; 
    return Math.round(distance / walkingSpeed); 
  }
}

export const multiModalRoutingService = new MultiModalRoutingService();
```

### Krok 8: Modyfikacja Głównego Komponentu

**Modyfikacja pliku:** **`src/components/map/UrbanNavigator.tsx`**

Dodaj importy:

```typescript
import { VehicleTracker } from './VehicleTracker';
import { AnimatedRouteLine } from './AnimatedRouteLine';
import { EnhancedStopMarker } from './EnhancedStopMarker';
import { useMultiModalRouting } from '../../hooks/useMultiModalRouting';
import { MultiModalRoute } from '../../types/enhanced-gtfs.types';
```

Dodaj state dla nowych funkcjonalności:

```typescript
const [multiModalRoute, setMultiModalRoute] = useState<MultiModalRoute | null>(null);
const [showVehicles, setShowVehicles] = useState(true);
const [selectedStopTypes, setSelectedStopTypes] = useState<('bus' | 'tram' | 'both')[]>(['bus', 'tram', 'both']);
const [isRouteAnimating, setIsRouteAnimating] = useState(false);
```

Dodaj komponenty do JSX:

```typescript
{/* Vehicle Tracking */}
{showVehicles && (
  <VehicleTracker
    lines={selectedTransport === 'all' ? undefined : [selectedTransport]}
    onVehicleClick={(vehicle) => {
      console.log('Clicked vehicle:', vehicle);
    }}
  />
)}

{/* Enhanced Stop Markers */}
{krakowStops
  .filter(stop => selectedStopTypes.includes(stop.type))
  .map((stop) => (
    <EnhancedStopMarker
      key={stop.id}
      stop={stop}
      onClick={(stop) => {
        
        console.log('Clicked stop:', stop);
      }}
    />
  ))}

{/* Animated Route Line */}
{multiModalRoute && (
  <AnimatedRouteLine
    segments={multiModalRoute.segments}
    isAnimating={isRouteAnimating}
    animationSpeed={800}
  />
)}
```

## 4. Testowanie i Walidacja

### Testy Jednostkowe

```typescript

import { multiModalRoutingService } from '../services/multiModalRoutingService';

describe('MultiModalRoutingService', () => {
  test('should plan route with walking segments', async () => {
    const start = { lat: 50.0677, lng: 19.9449 };
    const end = { lat: 50.0544, lng: 19.9356 };
    
    const route = await multiModalRoutingService.planRoute(start, end, {
      transportModes: ['bus', 'tram'],
      maxWalkingDistance: 500
    });
    
    expect(route.segments).toHaveLength(3); 
    expect(route.walkingTime).toBeGreaterThan(0);
    expect(route.totalDuration).toBeGreaterThan(0);
  });
});
```

### Testy Integracyjne

```typescript

import { render, screen } from '@testing-library/react';
import { VehicleTracker } from '../components/map/VehicleTracker';

describe('VehicleTracker Integration', () => {
  test('should display vehicles on map', async () => {
    render(<VehicleTracker lines={['3', '124']} />);
    
    
    await screen.findByText('Linia 3');
    expect(screen.getByText('Linia 124')).toBeInTheDocument();
  });
});
```

## 5. Optymalizacja Wydajności

### Debouncing i Throttling

```typescript

const throttledUpdateVehicles = useCallback(
  throttle((vehicles: VehiclePosition[]) => {
    setVehicles(vehicles);
  }, 1000), 
  []
);
```

### Memoization

```typescript

const memoizedRouteCalculation = useMemo(() => {
  return multiModalRoutingService.planRoute(start, end, options);
}, [start, end, options]);
```

### Lazy Loading

```typescript

const VehicleTracker = lazy(() => import('./VehicleTracker'));
const AnimatedRouteLine = lazy(() => import('./AnimatedRouteLine'));
```

## 6. Monitoring i Debugging

### Logging

```typescript

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
};
```

### Performance Monitoring

```typescript

export const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      logger.debug(`${componentName} render time: ${endTime - startTime}ms`);
    };
  });
};
```

Ten przewodnik implementacji zapewnia szczegółowy plan wdrożenia wszystkich nowych funkcjonalności Urban Navigator z zachowaniem najlepszych praktyk programistycznych i optymalizacji wydajności.
