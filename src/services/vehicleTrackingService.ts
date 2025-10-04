import { VehiclePosition, VehicleUpdate, VehicleSubscription, VehicleTrackingConfig } from '../types/vehicle.types';

class VehicleTrackingService {
  private ws: WebSocket | null = null;
  private vehicles: Map<string, VehiclePosition> = new Map();
  private subscribers: Set<(vehicles: VehiclePosition[]) => void> = new Set();
  private config: VehicleTrackingConfig = {
    updateInterval: 30000, 
    maxRetries: 3,
    reconnectDelay: 5000,
    bufferSize: 1000
  };
  private retryCount = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscription: VehicleSubscription | null = null;

  constructor(config?: Partial<VehicleTrackingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
   
      this.simulateWebSocketConnection();
    } catch (error) {
      console.error('Failed to connect to vehicle tracking service:', error);
      this.scheduleReconnect();
    }
  }

  private simulateWebSocketConnection() {
    console.log('Vehicle tracking service connected (simulated)');
    
    this.generateMockVehicles();
    
    setInterval(() => {
      this.updateMockVehicles();
    }, this.config.updateInterval);

    this.retryCount = 0;
  }

  private generateMockVehicles() {
    const mockVehicles: VehiclePosition[] = [
      {
        vehicleId: 'tram_001',
        lineNumber: '3',
        lat: 50.0677,
        lng: 19.9449,
        bearing: 45,
        speed: 25,
        timestamp: new Date(),
        routeType: 'tram',
        routeColor: '#22c55e',
        destination: 'Nowy Bieżanów P+R',
        occupancy: 'few_seats'
      },
      {
        vehicleId: 'tram_002',
        lineNumber: '8',
        lat: 50.0625,
        lng: 19.9375,
        bearing: 180,
        speed: 20,
        timestamp: new Date(),
        routeType: 'tram',
        routeColor: '#3b82f6',
        destination: 'Borek Fałęcki',
        occupancy: 'standing_room'
      },
      {
        vehicleId: 'bus_001',
        lineNumber: '124',
        lat: 50.0672,
        lng: 19.9523,
        bearing: 90,
        speed: 30,
        timestamp: new Date(),
        routeType: 'bus',
        routeColor: '#f97316',
        destination: 'Wawel',
        occupancy: 'few_seats'
      },
      {
        vehicleId: 'bus_002',
        lineNumber: '152',
        lat: 50.0544,
        lng: 19.9355,
        bearing: 270,
        speed: 35,
        timestamp: new Date(),
        routeType: 'bus',
        routeColor: '#ef4444',
        destination: 'Kazimierz',
        occupancy: 'empty'
      },
      {
        vehicleId: 'tram_003',
        lineNumber: '13',
        lat: 50.0775,
        lng: 19.9289,
        bearing: 135,
        speed: 22,
        timestamp: new Date(),
        routeType: 'tram',
        routeColor: '#8b5cf6',
        destination: 'Wzgórza Krzesławickie',
        occupancy: 'standing_room'
      }
    ];

    mockVehicles.forEach(vehicle => {
      this.vehicles.set(vehicle.vehicleId, vehicle);
    });

    this.notifySubscribers();
  }

  private updateMockVehicles() {
    this.vehicles.forEach((vehicle, vehicleId) => {
      const speedKmh = vehicle.speed;
      const speedMs = speedKmh / 3.6; 
      const timeStep = this.config.updateInterval / 1000;
      const distance = speedMs * timeStep;

      const bearing = vehicle.bearing * (Math.PI / 180); 
      const earthRadius = 6371000; 

      const lat1 = vehicle.lat * (Math.PI / 180);
      const lng1 = vehicle.lng * (Math.PI / 180);

      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(distance / earthRadius) +
        Math.cos(lat1) * Math.sin(distance / earthRadius) * Math.cos(bearing)
      );

      const lng2 = lng1 + Math.atan2(
        Math.sin(bearing) * Math.sin(distance / earthRadius) * Math.cos(lat1),
        Math.cos(distance / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
      );

      const randomLat = (Math.random() - 0.5) * 0.0001;
      const randomLng = (Math.random() - 0.5) * 0.0001;
      const randomSpeed = vehicle.speed + (Math.random() - 0.5) * 5;

      const updatedVehicle: VehiclePosition = {
        ...vehicle,
        lat: (lat2 * (180 / Math.PI)) + randomLat,
        lng: (lng2 * (180 / Math.PI)) + randomLng,
        speed: Math.max(0, Math.min(50, randomSpeed)),
        timestamp: new Date(),
        bearing: vehicle.bearing + (Math.random() - 0.5) * 10 
      };

      this.vehicles.set(vehicleId, updatedVehicle);
    });

    this.notifySubscribers();
  }

  private scheduleReconnect() {
    if (this.retryCount >= this.config.maxRetries) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.retryCount++;
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.retryCount}/${this.config.maxRetries})`);
      this.connect();
    }, this.config.reconnectDelay);
  }

  private notifySubscribers() {
    let vehicleList = Array.from(this.vehicles.values());

    if (this.subscription) {
      if (this.subscription.lines && this.subscription.lines.length > 0) {
        vehicleList = vehicleList.filter(v => 
          this.subscription!.lines!.includes(v.lineNumber)
        );
      }

      if (this.subscription.routeTypes && this.subscription.routeTypes.length > 0) {
        vehicleList = vehicleList.filter(v => 
          this.subscription!.routeTypes!.includes(v.routeType)
        );
      }

      if (this.subscription.bounds) {
        const bounds = this.subscription.bounds;
        vehicleList = vehicleList.filter(v => 
          v.lat >= bounds.south && v.lat <= bounds.north &&
          v.lng >= bounds.west && v.lng <= bounds.east
        );
      }
    }

    this.subscribers.forEach(callback => callback(vehicleList));
  }

  subscribe(callback: (vehicles: VehiclePosition[]) => void, subscription?: VehicleSubscription) {
    this.subscribers.add(callback);
    
    if (subscription) {
      this.subscription = subscription;
    }

    this.notifySubscribers();
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  updateSubscription(subscription: VehicleSubscription) {
    this.subscription = subscription;
    this.notifySubscribers();
  }

  async getVehiclePositions(bounds?: string, lines?: string[]): Promise<VehiclePosition[]> {
    let vehicles = Array.from(this.vehicles.values());

    if (lines && lines.length > 0) {
      vehicles = vehicles.filter(v => lines.includes(v.lineNumber));
    }

    if (bounds) {
      const [south, west, north, east] = bounds.split(',').map(Number);
      vehicles = vehicles.filter(v => 
        v.lat >= south && v.lat <= north &&
        v.lng >= west && v.lng <= east
      );
    }

    return vehicles;
  }

  getVehicleById(vehicleId: string): VehiclePosition | undefined {
    return this.vehicles.get(vehicleId);
  }

  getVehiclesByLine(lineNumber: string): VehiclePosition[] {
    return Array.from(this.vehicles.values()).filter(v => v.lineNumber === lineNumber);
  }

  isConnected(): boolean {
    return this.vehicles.size > 0; 
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.vehicles.clear();
    this.subscribers.clear();
    this.retryCount = 0;
  }

  cleanup() {
    this.disconnect();
  }
}

export const vehicleTrackingService = new VehicleTrackingService();