import { LatLng } from '@/infrastructure/routing/osrm-client';

export interface GTFSStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'bus' | 'tram' | 'both';
  lines: string[];
}

export interface EnhancedGTFSStop extends GTFSStop {
  walkingTime?: number; 
  walkingDistance?: number; 
  realTimeDepartures?: RealTimeDeparture[];
  stopIcon: 'bus' | 'tram' | 'both';
  accessibility?: boolean;
  zone?: string;
  platform?: string;
}

export interface RealTimeDeparture {
  lineNumber: string;
  destination: string;
  departureTime: string;
  delay: number; 
  vehicleId?: string;
  routeColor: string;
  routeType: 'bus' | 'tram';
  headsign?: string;
  realTime: string; 
  estimatedTime?: string; 
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
  destination?: string;
  occupancy?: 'empty' | 'few_seats' | 'standing_room' | 'crushed_standing' | 'full' | 'not_accepting_passengers';
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
  startStop?: EnhancedGTFSStop;
  endStop?: EnhancedGTFSStop;
  departureTime?: string;
  arrivalTime?: string;
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
  fare?: {
    total: number;
    currency: string;
    breakdown: Array<{
      type: 'bus' | 'tram' | 'transfer';
      amount: number;
    }>;
  };
}

export interface TransportDisruption {
  id: string;
  type: 'construction' | 'delay' | 'cancellation' | 'detour';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedLines: string[];
  affectedStops?: string[];
  startTime: Date;
  endTime?: Date;
  alternativeRoutes?: string[];
}

export interface StopSchedule {
  stopId: string;
  lineNumber: string;
  direction: string;
  departures: Array<{
    scheduledTime: string;
    realTime?: string;
    delay: number;
    vehicleId?: string;
    platform?: string;
  }>;
}

export interface RoutePattern {
  id: string;
  lineNumber: string;
  direction: string;
  stops: EnhancedGTFSStop[];
  geometry: GeoJSON.LineString;
  color: string;
  routeType: 'bus' | 'tram';
}