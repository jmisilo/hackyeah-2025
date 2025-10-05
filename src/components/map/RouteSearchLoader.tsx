'use client';

import { Bus, Route, Train } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RouteSearchLoaderProps {
  isVisible: boolean;
}

export function RouteSearchLoader({ isVisible }: RouteSearchLoaderProps) {
  const [vehicleType, setVehicleType] = useState<'tram' | 'bus'>('tram');

  useEffect(() => {
    if (!isVisible) return;

    const vehicleInterval = setInterval(() => {
      setVehicleType((prev) => (prev === 'tram' ? 'bus' : 'tram'));
    }, 3000);

    return () => clearInterval(vehicleInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-sm mx-4 transform transition-all duration-300 ease-out">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF9000] to-[#FF6B00] rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Route className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-[#FF9000]/20 to-[#FF6B00]/20 rounded-full animate-ping" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Wyszukuję trasę</h3>

            <div className="relative w-48 h-12 mx-auto overflow-hidden">
              <div className="absolute bottom-2 left-0 right-0 h-1 bg-gray-300 rounded-full">
                <div className="h-full bg-gradient-to-r from-gray-400 to-gray-300 rounded-full" />
              </div>

              {vehicleType === 'tram' && (
                <>
                  <div className="absolute bottom-3 left-0 right-0 h-0.5 bg-gray-400 rounded-full" />
                  <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-gray-400 rounded-full" />
                </>
              )}

              <div
                className="absolute bottom-0 transition-colors duration-500"
                style={{
                  animation: 'vehicle-move 3s linear infinite',
                }}>
                <div
                  className={`p-2 rounded-lg ${vehicleType === 'tram' ? 'bg-orange-500' : 'bg-orange-500'} text-white shadow-lg`}>
                  {vehicleType === 'tram' ? (
                    <Train className="w-5 h-5" />
                  ) : (
                    <Bus className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-2">Sprawdzam połączenia...</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes vehicle-move {
          0% {
            left: -2rem;
            transform: translateX(0);
          }
          100% {
            left: calc(100% + 2rem);
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
