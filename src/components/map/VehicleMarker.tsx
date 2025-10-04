import React, { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Train, MapPin, Clock, Users, Accessibility } from 'lucide-react';
import { VehiclePosition } from '../../types/vehicle.types';

interface VehicleMarkerProps {
  vehicle: VehiclePosition;
  onClick?: (vehicle: VehiclePosition) => void;
  showPopup?: boolean;
  animationEnabled?: boolean;
}

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({
  vehicle,
  onClick,
  showPopup = false,
  animationEnabled = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [previousPosition, setPreviousPosition] = useState({ lat: vehicle.lat, lng: vehicle.lng });

  useEffect(() => {
    setPreviousPosition({ lat: vehicle.lat, lng: vehicle.lng });
  }, [vehicle.lat, vehicle.lng]);

  
  const createVehicleIcon = () => {
    const iconSize = 32;
    const iconHtml = `
      <div class="vehicle-marker ${vehicle.routeType}" style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        background: ${getVehicleColor()};
        border: 2px solid white;
        border-radius: ${vehicle.routeType === 'tram' ? '4px' : '50%'};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: rotate(${vehicle.bearing || 0}deg);
        transition: all 0.3s ease;
        position: relative;
      ">
        <div style="
          color: white;
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          line-height: 1;
          transform: rotate(-${vehicle.bearing || 0}deg);
        ">
          ${vehicle.routeType === 'tram' ? '🚋' : '🚌'}
          <div style="font-size: 8px; margin-top: 1px;">
            ${vehicle.lineNumber}
          </div>
        </div>
      </div>
    `;

    return new DivIcon({
      html: iconHtml,
      className: 'vehicle-marker-icon',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2]
    });
  };

  const getVehicleColor = () => {
    
    if (vehicle.routeColor) {
      return vehicle.routeColor;
    }
    
    switch (vehicle.routeType) {
      case 'tram':
        return '#3b82f6'; 
      case 'bus':
        return '#10b981'; 
      default:
        return '#6b7280'; 
    }
  };

  const getOccupancyColor = () => {
    switch (vehicle.occupancy) {
      case 'empty':
        return 'text-green-600';
      case 'few_seats':
        return 'text-green-500';
      case 'standing_room':
        return 'text-yellow-600';
      case 'crushed_standing':
        return 'text-orange-600';
      case 'full':
      case 'not_accepting_passengers':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getOccupancyText = () => {
    switch (vehicle.occupancy) {
      case 'empty':
        return 'Pusty';
      case 'few_seats':
        return 'Wolne miejsca';
      case 'standing_room':
        return 'Miejsca stojące';
      case 'crushed_standing':
        return 'Zatłoczony';
      case 'full':
        return 'Pełny';
      case 'not_accepting_passengers':
        return 'Nie przyjmuje pasażerów';
      default:
        return 'Brak danych';
    }
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const lastUpdate = new Date(vehicle.timestamp);
    const diffSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s temu`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}min temu`;
    } else {
      return lastUpdate.toLocaleTimeString();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <Marker
          position={[vehicle.lat, vehicle.lng]}
          icon={createVehicleIcon()}
          eventHandlers={{
            click: () => onClick?.(vehicle)
          }}
        >
          {showPopup && (
            <Popup
              closeButton={true}
              className="vehicle-popup"
              maxWidth={300}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${vehicle.routeType === 'tram' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {vehicle.routeType === 'tram' ? (
                      <Train className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Bus className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Linia {vehicle.lineNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {vehicle.routeType === 'tram' ? 'Tramwaj' : 'Autobus'}
                    </p>
                  </div>
                </div>

                {vehicle.destination && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      Kierunek: <span className="font-medium">{vehicle.destination}</span>
                    </span>
                  </div>
                )}

                {vehicle.occupancy && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className={`text-sm font-medium ${getOccupancyColor()}`}>
                      Obłożenie: {getOccupancyText()}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200 space-y-1">
                  {vehicle.speed !== undefined && (
                    <div className="text-xs text-gray-500">
                      Prędkość: {vehicle.speed} km/h
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Ostatnia aktualizacja: {formatLastUpdate()}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID pojazdu: {vehicle.vehicleId}
                  </div>
                </div>

                <button
                  onClick={() => onClick?.(vehicle)}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Zobacz szczegóły trasy
                </button>
              </motion.div>
            </Popup>
          )}
        </Marker>
      )}
    </AnimatePresence>
  );
};


interface VehicleClusterMarkerProps {
  vehicles: VehiclePosition[];
  position: { lat: number; lng: number };
  onClick?: (vehicles: VehiclePosition[]) => void;
}

export const VehicleClusterMarker: React.FC<VehicleClusterMarkerProps> = ({
  vehicles,
  position,
  onClick
}) => {
  const createClusterIcon = () => {
    const size = Math.min(40 + vehicles.length * 2, 60);
    const tramCount = vehicles.filter(v => v.routeType === 'tram').length;
    const busCount = vehicles.filter(v => v.routeType === 'bus').length;

    const iconHtml = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(45deg, #3b82f6, #10b981);
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        color: white;
        font-weight: bold;
      ">
        <div style="font-size: 14px;">${vehicles.length}</div>
        <div style="font-size: 8px; margin-top: -2px;">
          ${tramCount > 0 ? `🚋${tramCount}` : ''} ${busCount > 0 ? `🚌${busCount}` : ''}
        </div>
      </div>
    `;

    return new DivIcon({
      html: iconHtml,
      className: 'vehicle-cluster-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={createClusterIcon()}
      eventHandlers={{
        click: () => onClick?.(vehicles)
      }}
    >
      <Popup maxWidth={300}>
        <div className="p-3">
          <h3 className="font-semibold mb-2">
            {vehicles.length} pojazdów w okolicy
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {vehicles.map(vehicle => (
              <div key={vehicle.vehicleId} className="flex items-center justify-between text-sm">
                <span>
                  {vehicle.routeType === 'tram' ? '🚋' : '🚌'} Linia {vehicle.lineNumber}
                </span>
                <span className="text-gray-600">
                  {vehicle.speed ? `${vehicle.speed} km/h` : 'Brak danych'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};