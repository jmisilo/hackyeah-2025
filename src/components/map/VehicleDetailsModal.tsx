'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bus, Train, MapPin, Clock, Users, Accessibility, Navigation, Wifi, CreditCard } from 'lucide-react';
import { VehiclePosition } from '../../types/vehicle.types';

interface VehicleDetailsModalProps {
  vehicle: VehiclePosition | null;
  isVisible: boolean;
  onClose: () => void;
}

export function VehicleDetailsModal({ vehicle, isVisible, onClose }: VehicleDetailsModalProps) {
  if (!vehicle) return null;

  const getOccupancyColor = () => {
    switch (vehicle.occupancy) {
      case 'empty':
        return 'text-green-600 bg-green-100';
      case 'few_seats':
        return 'text-green-500 bg-green-50';
      case 'standing_room':
        return 'text-yellow-600 bg-yellow-100';
      case 'crushed_standing':
        return 'text-orange-600 bg-orange-100';
      case 'full':
      case 'not_accepting_passengers':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${vehicle.routeType === 'tram' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {vehicle.routeType === 'tram' ? (
                    <Train className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Bus className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Linia {vehicle.lineNumber}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {vehicle.routeType === 'tram' ? 'Tramwaj' : 'Autobus'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {vehicle.destination && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Kierunek</p>
                    <p className="font-medium text-gray-900">{vehicle.destination}</p>
                  </div>
                </div>
              )}

              {vehicle.occupancy && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Obłożenie</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor()}`}>
                        {getOccupancyText()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {vehicle.speed !== undefined && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Navigation className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Prędkość</p>
                    <p className="font-medium text-gray-900">{vehicle.speed} km/h</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Udogodnienia</p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    <Accessibility className="w-3 h-3" />
                    <span>Dostępny</span>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                    <Wifi className="w-3 h-3" />
                    <span>WiFi</span>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                    <CreditCard className="w-3 h-3" />
                    <span>Płatność kartą</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Ostatnia aktualizacja: {formatLastUpdate()}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-[#FF9000] text-white rounded-lg hover:bg-[#e6820a] transition-colors font-medium"
              >
                Zamknij
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}