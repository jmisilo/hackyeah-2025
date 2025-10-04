import { useState, useCallback } from 'react';
import { 
  RoutingRequest, 
  RoutingResponse, 
  RoutingState, 
  RoutingHookReturn 
} from '../types/routing.types';
import { multiModalRoutingService } from '../services/multiModalRoutingService';

export function useMultiModalRouting(): RoutingHookReturn {
  const [state, setState] = useState<RoutingState>({
    isLoading: false,
    currentRoute: null,
    alternatives: [],
    error: null,
    lastRequest: null
  });

  const planRoute = useCallback(async (request: RoutingRequest): Promise<void> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastRequest: request
    }));

    try {
      const response = await multiModalRoutingService.planRoute(request);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentRoute: response.routes.length > 0 ? response.routes[0] : null,
        alternatives: response.alternatives || [],
        error: response.warnings.some(w => w.severity === 'error') 
          ? response.warnings.find(w => w.severity === 'error')?.message || 'Nieznany błąd'
          : null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        currentRoute: null,
        alternatives: []
      }));
    }
  }, []);

  const clearRoute = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentRoute: null,
      alternatives: [],
      error: null,
      lastRequest: null
    }));
  }, []);

  const retryLastRequest = useCallback(async (): Promise<void> => {
    if (!state.lastRequest) {
      return;
    }
    await planRoute(state.lastRequest);
  }, [state.lastRequest, planRoute]);

  return {
    ...state,
    planRoute,
    clearRoute,
    retryLastRequest
  };
}

export function useQuickRouting() {
  const { planRoute, isLoading, currentRoute, error } = useMultiModalRouting();

  const quickPlan = useCallback(async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    transportModes?: ('bus' | 'tram')[]
  ) => {
    const request: RoutingRequest = {
      start: from,
      end: to,
      transportModes: transportModes || ['bus', 'tram'],
      preferences: {
        minimizeWalking: false,
        minimizeTransfers: true,
        minimizeTime: true,
        avoidStairs: false,
        preferExpress: false
      }
    };

    await planRoute(request);
  }, [planRoute]);

  return {
    quickPlan,
    isLoading,
    route: currentRoute,
    error
  };
}

export function useAccessibleRouting() {
  const { planRoute, isLoading, currentRoute, error } = useMultiModalRouting();

  const planAccessibleRoute = useCallback(async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    accessibilityNeeds: {
      wheelchairAccessible?: boolean;
      lowFloor?: boolean;
      maxWalkingDistance?: number;
    } = {}
  ) => {
    const request: RoutingRequest = {
      start: from,
      end: to,
      transportModes: ['bus', 'tram'],
      maxWalkingDistance: accessibilityNeeds.maxWalkingDistance || 500,
      maxWalkingTime: 10,
      wheelchair: accessibilityNeeds.wheelchairAccessible || false,
      preferences: {
        minimizeWalking: true,
        minimizeTransfers: true,
        minimizeTime: false,
        avoidStairs: true,
        preferExpress: false
      }
    };

    await planRoute(request);
  }, [planRoute]);

  return {
    planAccessibleRoute,
    isLoading,
    route: currentRoute,
    error
  };
}