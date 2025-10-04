import { LatLng } from '@/infrastructure/routing/osrm-client';
import { EnhancedGTFSStop, RouteSegment, MultiModalRoute } from './enhanced-gtfs.types';

export type { RouteSegment, MultiModalRoute, EnhancedGTFSStop } from './enhanced-gtfs.types';

export interface RoutingRequest {
  start: LatLng;
  end: LatLng;
  transportModes: ('walking' | 'bus' | 'tram')[];
  maxWalkingDistance?: number; 
  maxWalkingTime?: number; 
  departureTime?: Date;
  arrivalTime?: Date;
  wheelchair?: boolean;
  preferences?: RoutingPreferences;
}

export interface RoutingPreferences {
  minimizeWalking: boolean;
  minimizeTransfers: boolean;
  minimizeTime: boolean;
  avoidStairs: boolean;
  preferExpress: boolean;
  maxWaitTime?: number; 
}

export interface RoutingResponse {
  routes: MultiModalRoute[];
  alternatives: MultiModalRoute[];
  warnings: RoutingWarning[];
  metadata: RoutingMetadata;
}

export interface RoutingWarning {
  type: 'disruption' | 'delay' | 'accessibility' | 'walking_distance';
  message: string;
  severity: 'info' | 'warning' | 'error';
  affectedSegments?: string[];
}

export interface RoutingMetadata {
  requestId: string;
  processingTime: number; 
  dataTimestamp: Date;
  algorithm: string;
  version: string;
}

export interface WalkingSegment extends RouteSegment {
  type: 'walking';
  elevation?: number; 
  surface?: 'paved' | 'unpaved' | 'stairs';
  accessibility: boolean;
  waypoints: LatLng[];
}

export interface TransitSegment extends RouteSegment {
  type: 'bus' | 'tram';
  lineNumber: string;
  direction: string;
  headsign: string;
  boardingStop: EnhancedGTFSStop;
  alightingStop: EnhancedGTFSStop;
  intermediateStops: EnhancedGTFSStop[];
  scheduledDeparture: Date;
  scheduledArrival: Date;
  realTimeDeparture?: Date;
  realTimeArrival?: Date;
  vehicleId?: string;
  platform?: string;
  fare?: number;
}

export interface RouteAnimation {
  segmentId: string;
  progress: number;
  currentPosition: LatLng;
  isActive: boolean;
  speed: number;
}

export interface RoutingState {
  currentRoute: MultiModalRoute | null;
  alternatives: MultiModalRoute[];
  isLoading: boolean;
  error: string | null;
  lastRequest: RoutingRequest | null;
}

export interface StopConnection {
  fromStop: EnhancedGTFSStop;
  toStop: EnhancedGTFSStop;
  walkingTime: number; 
  walkingDistance: number; 
  accessibility: boolean;
  path?: LatLng[];
}

export interface TransferPoint {
  stop: EnhancedGTFSStop;
  fromLine: string;
  toLine: string;
  minimumTransferTime: number; 
  walkingDistance: number;
  accessibility: boolean;
  platform?: string;
}

export interface RoutingHookReturn {
  currentRoute: MultiModalRoute | null;
  alternatives: MultiModalRoute[];
  isLoading: boolean;
  error: string | null;
  planRoute: (request: RoutingRequest) => Promise<void>;
  clearRoute: () => void;
  retryLastRequest: () => Promise<void>;
}