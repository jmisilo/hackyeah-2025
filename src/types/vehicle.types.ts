import { VehiclePosition } from './enhanced-gtfs.types';


export type { VehiclePosition } from './enhanced-gtfs.types';

export interface VehicleTrackingState {
  vehicles: Map<string, VehiclePosition>;
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

export interface VehicleUpdate {
  type: 'vehicle_update' | 'vehicle_removed' | 'bulk_update';
  vehicle?: VehiclePosition;
  vehicles?: VehiclePosition[];
  vehicleId?: string;
  timestamp: Date;
}

export interface VehicleSubscription {
  lines?: string[];
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  routeTypes?: ('bus' | 'tram')[];
}

export interface VehicleTrackingConfig {
  updateInterval: number;
  maxRetries: number;
  reconnectDelay: number; 
  bufferSize: number; 
}

export interface VehicleAnimation {
  vehicleId: string;
  startPosition: { lat: number; lng: number };
  endPosition: { lat: number; lng: number };
  startTime: number;
  duration: number;
  bearing: number;
}

export interface VehicleMarkerProps {
  vehicle: VehiclePosition;
  isAnimating?: boolean;
  onClick?: (vehicle: VehiclePosition) => void;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface VehicleCluster {
  id: string;
  center: { lat: number; lng: number };
  vehicles: VehiclePosition[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface VehicleTrackingHookReturn {
  vehicles: VehiclePosition[];
  isConnected: boolean;
  error: string | null;
  subscribe: (config: VehicleSubscription) => void;
  unsubscribe: () => void;
  getVehicleById: (vehicleId: string) => VehiclePosition | undefined;
  getVehiclesByLine: (lineNumber: string) => VehiclePosition[];
}