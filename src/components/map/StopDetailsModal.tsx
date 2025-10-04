'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Navigation, Accessibility, Wifi, CreditCard, Users } from 'lucide-react';
import { FaBus, FaTrain } from 'react-icons/fa';
import { GTFSStop } from '../../infrastructure/gtfs/gtfs-data';

interface StopDetailsModalProps {
  stop: GTFSStop | null;
  isVisible: boolean;
  onClose: () => void;
  onPlanRoute?: (stop: GTFSStop) => void;
}

export function StopDetailsModal({ stop, isVisible, onClose, onPlanRoute }: StopDetailsModalProps) {
  if (!stop) return null;

  const mockDepartures = [
    { line: '124', destination: 'Nowa Huta', time: '2 min', type: 'bus' },
    { line: '152', destination: 'Bronowice', time: '5 min', type: 'bus' },
    { line: '8', destination: 'Krowodrza', time: '8 min', type: 'tram' },
    { line: '13', destination: 'Podgórze', time: '12 min', type: 'tram' },
  ];

  const getLineColor = (type: string) => {
    return type === 'tram' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  };

  const getLineIcon = (type: string) => {
    return type === 'tram' ? <FaTrain className="w-4 h-4" /> : <FaBus className="w-4 h-4" />;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-white/20 z-[9999]"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[10000] w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${stop.type === 'tram' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {stop.type === 'tram' ? (
                    <FaTrain className="w-6 h-6 text-blue-600" />
                  ) : (
                    <FaBus className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {stop.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Przystanek {stop.type === 'tram' ? 'tramwajowy' : 'autobusowy'}
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
             

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Linie obsługujące przystanek</p>
                <div className="flex flex-wrap gap-2">
                  {stop.lines.map((line) => (
                    <div
                      key={line}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getLineColor(stop.type)}`}
                    >
                      {getLineIcon(stop.type)}
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Najbliższe odjazdy</p>
                <div className="space-y-2">
                  {mockDepartures.map((departure, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getLineColor(departure.type)}`}>
                          {getLineIcon(departure.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Linia {departure.line}</p>
                          <p className="text-sm text-gray-600">{departure.destination}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[#FF9000]">{departure.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                  <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs">
                    <Users className="w-3 h-3" />
                    <span>Ławka</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Dane aktualne na: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl space-y-2">
              {onPlanRoute && (
                <button
                  onClick={() => onPlanRoute(stop)}
                  className="w-full px-4 py-2 bg-[#FF9000] text-white rounded-lg hover:bg-[#e6820a] transition-colors font-medium"
                >
                  Zaplanuj trasę do tego przystanku
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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