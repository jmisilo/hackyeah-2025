import { useState, useEffect, useCallback, useRef } from 'react';
import { VehiclePosition, VehicleSubscription, VehicleTrackingHookReturn } from '../types/vehicle.types';
import { vehicleTrackingService } from '../services/vehicleTrackingService';

export const useVehicleTracking = (
  initialSubscription?: VehicleSubscription
): VehicleTrackingHookReturn => {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const subscriptionRef = useRef<VehicleSubscription | null>(initialSubscription || null);

  const handleVehicleUpdate = useCallback((updatedVehicles: VehiclePosition[]) => {
    setVehicles(updatedVehicles);
    setError(null);
  }, []);

  const subscribe = useCallback((subscription: VehicleSubscription) => {
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      subscriptionRef.current = subscription;
      
      unsubscribeRef.current = vehicleTrackingService.subscribe(
        handleVehicleUpdate,
        subscription
      );

      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to vehicle tracking');
      setIsConnected(false);
    }
  }, [handleVehicleUpdate]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    subscriptionRef.current = null;
    setVehicles([]);
    setIsConnected(false);
    setError(null);
  }, []);

  const getVehicleById = useCallback((vehicleId: string): VehiclePosition | undefined => {
    return vehicleTrackingService.getVehicleById(vehicleId);
  }, []);

  const getVehiclesByLine = useCallback((lineNumber: string): VehiclePosition[] => {
    return vehicleTrackingService.getVehiclesByLine(lineNumber);
  }, []);

  useEffect(() => {
    try {
      vehicleTrackingService.connect();
      
      if (initialSubscription) {
        subscribe(initialSubscription);
      } else {
        subscribe({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize vehicle tracking');
    }

    return () => {
      unsubscribe();
    };
  }, []); 

  useEffect(() => {
    if (subscriptionRef.current && isConnected) {
      vehicleTrackingService.updateSubscription(subscriptionRef.current);
    }
  }, [isConnected]);

  useEffect(() => {
    const checkConnection = () => {
      const connected = vehicleTrackingService.isConnected();
      setIsConnected(connected);
    };

    const interval = setInterval(checkConnection, 5000); 

    return () => clearInterval(interval);
  }, []);

  return {
    vehicles,
    isConnected,
    error,
    subscribe,
    unsubscribe,
    getVehicleById,
    getVehiclesByLine
  };
};

export const useLineVehicleTracking = (lineNumbers: string[]) => {
  return useVehicleTracking({
    lines: lineNumbers
  });
};

export const useBoundsVehicleTracking = (bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}) => {
  return useVehicleTracking({
    bounds
  });
};

export const useTypeVehicleTracking = (routeTypes: ('bus' | 'tram')[]) => {
  return useVehicleTracking({
    routeTypes
  });
};