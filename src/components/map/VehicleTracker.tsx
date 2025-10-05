import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleMarker, VehicleClusterMarker } from './VehicleMarker';
import { useVehicleTracking } from '../../hooks/useVehicleTracking';
import { VehiclePosition, VehicleCluster } from '../../types/vehicle.types';
import { Settings, Eye, EyeOff, Filter, MapPin } from 'lucide-react';

interface VehicleTrackerProps {
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  lineFilter?: string[];
  typeFilter?: ('bus' | 'tram' | 'train')[];
  showClustering?: boolean;
  clusterDistance?: number;
  onVehicleClick?: (vehicle: VehiclePosition) => void;
  onVehicleClusterClick?: (vehicles: VehiclePosition[]) => void;
  showStops?: boolean;
  onToggleStops?: () => void;
}

export const VehicleTracker: React.FC<VehicleTrackerProps> = ({
  bounds,
  lineFilter,
  typeFilter,
  showClustering = true,
  clusterDistance = 50,
  onVehicleClick,
  onVehicleClusterClick,
  showStops = true,
  onToggleStops
}) => {
  const map = useMap();
  const [isVisible, setIsVisible] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [localTypeFilter, setLocalTypeFilter] = useState<('bus' | 'tram' | 'train')[]>(typeFilter || ['bus', 'tram']);
  const [localLineFilter, setLocalLineFilter] = useState<string[]>(lineFilter || []);

  
  const {
    vehicles,
    isConnected,
    error,
    subscribe,
    unsubscribe
  } = useVehicleTracking();

  
  useEffect(() => {
    const subscription = {
      bounds,
      lines: localLineFilter.length > 0 ? localLineFilter : undefined,
      types: localTypeFilter.length > 0 ? localTypeFilter : undefined
    };

    subscribe(subscription);

    return () => {
      unsubscribe();
    };
  }, [bounds, localLineFilter, localTypeFilter, subscribe, unsubscribe]);

  
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      
      if (localTypeFilter.length > 0 && !localTypeFilter.includes(vehicle.routeType)) {
        return false;
      }

      
      if (localLineFilter.length > 0 && !localLineFilter.includes(vehicle.lineNumber)) {
        return false;
      }

      
      if (bounds) {
        const { lat, lng } = vehicle;
        if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east) {
          return false;
        }
      }

      return true;
    });
  }, [vehicles, localTypeFilter, localLineFilter, bounds]);

  
  const calculateDistance = useCallback((point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371000; 
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  
  const vehicleClusters = useMemo(() => {
    if (!showClustering) {
      return filteredVehicles.map(vehicle => ({
        id: vehicle.vehicleId,
        vehicles: [vehicle],
        center: { lat: vehicle.lat, lng: vehicle.lng },
        bounds: {
          north: vehicle.lat,
          south: vehicle.lat,
          east: vehicle.lng,
          west: vehicle.lng
        }
      }));
    }

    const clusters: VehicleCluster[] = [];
    const processed = new Set<string>();

    filteredVehicles.forEach(vehicle => {
      if (processed.has(vehicle.vehicleId)) return;

      const cluster: VehicleCluster = {
        id: `cluster_${vehicle.vehicleId}`,
        vehicles: [vehicle],
        center: { lat: vehicle.lat, lng: vehicle.lng },
        bounds: {
          north: vehicle.lat,
          south: vehicle.lat,
          east: vehicle.lng,
          west: vehicle.lng
        }
      };

      processed.add(vehicle.vehicleId);

      
      filteredVehicles.forEach(otherVehicle => {
        if (processed.has(otherVehicle.vehicleId)) return;

        const distance = calculateDistance(
          { lat: vehicle.lat, lng: vehicle.lng }, 
          { lat: otherVehicle.lat, lng: otherVehicle.lng }
        );
        if (distance <= clusterDistance) {
          cluster.vehicles.push(otherVehicle);
          processed.add(otherVehicle.vehicleId);

          
          cluster.bounds.north = Math.max(cluster.bounds.north, otherVehicle.lat);
          cluster.bounds.south = Math.min(cluster.bounds.south, otherVehicle.lat);
          cluster.bounds.east = Math.max(cluster.bounds.east, otherVehicle.lng);
          cluster.bounds.west = Math.min(cluster.bounds.west, otherVehicle.lng);
        }
      });

      
      const avgLat = cluster.vehicles.reduce((sum, v) => sum + v.lat, 0) / cluster.vehicles.length;
      const avgLng = cluster.vehicles.reduce((sum, v) => sum + v.lng, 0) / cluster.vehicles.length;
      cluster.center = { lat: avgLat, lng: avgLng };

      clusters.push(cluster);
    });

    return clusters;
  }, [filteredVehicles, showClustering, clusterDistance, calculateDistance]);

  
  const availableLines = useMemo(() => {
    const lines = new Set<string>();
    vehicles.forEach(vehicle => lines.add(vehicle.lineNumber));
    return Array.from(lines).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });
  }, [vehicles]);

  return (
    <>
      <div className="absolute bottom-4 right-4 z-[1000]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-lg"
        >
          <div className="flex items-center p-3">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className={`p-2 rounded-lg mr-2 transition-colors ${
                isVisible 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isVisible ? 'Ukryj pojazdy' : 'Pokaż pojazdy'}
            >
              {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {onToggleStops && (
              <button
                onClick={onToggleStops}
                className={`p-2 rounded-lg mr-2 transition-colors ${
                  showStops 
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={showStops ? 'Ukryj przystanki' : 'Pokaż przystanki'}
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              title="Ustawienia"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className={`ml-2 w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} title={isConnected ? 'Połączono' : 'Rozłączono'} />

            <span className="ml-2 text-sm font-medium text-gray-600">
              {filteredVehicles.length}
            </span>
          </div>

          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 p-3 space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Typ transportu
                  </label>
                  <div className="flex space-x-2 flex-wrap">
                    <button
                      onClick={() => setLocalTypeFilter(prev => 
                        prev.includes('tram') 
                          ? prev.filter(t => t !== 'tram')
                          : [...prev, 'tram']
                      )}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        localTypeFilter.includes('tram')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      🚋 Tramwaje
                    </button>
                    <button
                      onClick={() => setLocalTypeFilter(prev => 
                        prev.includes('bus') 
                          ? prev.filter(t => t !== 'bus')
                          : [...prev, 'bus']
                      )}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        localTypeFilter.includes('bus')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      🚌 Autobusy
                    </button>
                    <button
                      onClick={() => setLocalTypeFilter(prev => 
                        prev.includes('train') 
                          ? prev.filter(t => t !== 'train')
                          : [...prev, 'train']
                      )}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        localTypeFilter.includes('train')
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      🚆 Pociągi
                    </button>
                  </div>
                </div>

                {availableLines.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Linie ({localLineFilter.length > 0 ? localLineFilter.length : 'wszystkie'})
                    </label>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-4 gap-1">
                        {availableLines.slice(0, 12).map(line => (
                          <button
                            key={line}
                            onClick={() => setLocalLineFilter(prev => 
                              prev.includes(line)
                                ? prev.filter(l => l !== line)
                                : [...prev, line]
                            )}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              localLineFilter.length === 0 || localLineFilter.includes(line)
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {line}
                          </button>
                        ))}
                      </div>
                      {localLineFilter.length > 0 && (
                        <button
                          onClick={() => setLocalLineFilter([])}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Wyczyść filtry
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-xs"
          >
            {error}
          </motion.div>
        )}
      </div>


      <AnimatePresence>
        {isVisible && vehicleClusters.map(cluster => (
          cluster.vehicles.length === 1 ? (
            <VehicleMarker
              key={cluster.vehicles[0].vehicleId}
              vehicle={cluster.vehicles[0]}
              onClick={onVehicleClick}
              animationEnabled={true}
            />
          ) : (
            <VehicleClusterMarker
              key={cluster.id}
              vehicles={cluster.vehicles}
              position={cluster.center}
              onClick={onVehicleClusterClick}
            />
          )
        ))}
      </AnimatePresence>
    </>
  );
};