import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  MapPin, 
  Navigation, 
  Accessibility, 
  Wifi, 
  Lightbulb, 
  Umbrella,
  CreditCard,
  Monitor,
  Users,
  RefreshCw,
  AlertCircle,
  Route,
  Calendar,
  Star
} from 'lucide-react';
import { GTFSStop } from '../../infrastructure/gtfs/gtfs-data';
import { EnhancedGTFSStop, RealTimeDeparture } from '../../types/enhanced-gtfs.types';
import { getEnhancedStopData, generateRealTimeDepartures } from '../../infrastructure/gtfs/gtfs-data';

interface StopDetailsPanelProps {
  stop: GTFSStop | null;
  isOpen: boolean;
  onClose: () => void;
  onPlanRoute?: (stop: GTFSStop) => void;
  walkingTime?: number;
}

export const StopDetailsPanel: React.FC<StopDetailsPanelProps> = ({
  stop,
  isOpen,
  onClose,
  onPlanRoute,
  walkingTime
}) => {
  const [enhancedData, setEnhancedData] = useState<EnhancedGTFSStop | null>(null);
  const [realTimeDepartures, setRealTimeDepartures] = useState<RealTimeDeparture[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  
  useEffect(() => {
    if (stop && isOpen) {
      loadStopData();
      const interval = setInterval(loadRealTimeData, 30000); 
      return () => clearInterval(interval);
    }
  }, [stop, isOpen]);

  const loadStopData = async () => {
    if (!stop) return;
    
    setLoading(true);
    try {
      const enhanced = getEnhancedStopData(stop.id);
      setEnhancedData(enhanced);
      await loadRealTimeData();
    } catch (error) {
      console.error('Error loading stop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    if (!stop) return;
    
    try {
      const departures = generateRealTimeDepartures(stop.id);
      setRealTimeDepartures(departures);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  const getStopTypeInfo = () => {
    if (!stop) return { icon: '📍', label: 'Przystanek', color: 'gray' };
    
    switch (stop.type) {
      case 'tram':
        return { icon: '🚋', label: 'Przystanek tramwajowy', color: 'blue' };
      case 'bus':
        return { icon: '🚌', label: 'Przystanek autobusowy', color: 'green' };
      case 'both':
        return { icon: '🚏', label: 'Przystanek tramwajowo-autobusowy', color: 'purple' };
      default:
        return { icon: '📍', label: 'Przystanek', color: 'gray' };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatNextDeparture = (departure: RealTimeDeparture) => {
    const now = new Date();
    const departureTime = new Date(departure.realTime);
    const minutesUntil = Math.max(0, Math.floor((departureTime.getTime() - now.getTime()) / 60000));
    
    if (minutesUntil === 0) return 'Teraz';
    if (minutesUntil === 1) return '1 min';
    return `${minutesUntil} min`;
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 0) return 'text-green-600';
    if (delay <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDelayText = (delay: number) => {
    if (delay === 0) return 'Na czas';
    if (delay > 0) return `+${delay} min`;
    return `${delay} min`;
  };

  const filteredDepartures = selectedLine 
    ? realTimeDepartures.filter(d => d.lineNumber === selectedLine)
    : realTimeDepartures;

  const stopTypeInfo = getStopTypeInfo();

  if (!isOpen || !stop) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`p-6 border-b border-gray-200 bg-gradient-to-r ${
            stopTypeInfo.color === 'blue' ? 'from-blue-50 to-blue-100' :
            stopTypeInfo.color === 'green' ? 'from-green-50 to-green-100' :
            stopTypeInfo.color === 'purple' ? 'from-purple-50 to-purple-100' :
            'from-gray-50 to-gray-100'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${
                  stopTypeInfo.color === 'blue' ? 'bg-blue-200' :
                  stopTypeInfo.color === 'green' ? 'bg-green-200' :
                  stopTypeInfo.color === 'purple' ? 'bg-purple-200' :
                  'bg-gray-200'
                }`}>
                  <span className="text-3xl">{stopTypeInfo.icon}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{stop.name}</h2>
                  <p className="text-gray-600 mt-1">{stopTypeInfo.label}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    {stop.zone && (
                      <span className="inline-block px-3 py-1 bg-white bg-opacity-70 text-gray-700 text-sm rounded-full">
                        Strefa {stop.zone}
                      </span>
                    )}
                    {walkingTime && (
                      <div className="flex items-center space-x-1 text-green-700 text-sm font-medium">
                        <Navigation className="w-4 h-4" />
                        <span>{walkingTime} min pieszo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Ładowanie danych...</span>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Route className="w-5 h-5 mr-2" />
                      Linie ({stop.lines.length})
                    </h3>
                    {selectedLine && (
                      <button
                        onClick={() => setSelectedLine(null)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Pokaż wszystkie
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stop.lines.map(line => (
                      <button
                        key={line}
                        onClick={() => setSelectedLine(selectedLine === line ? null : line)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedLine === line
                            ? `${stopTypeInfo.color === 'blue' ? 'bg-blue-600 text-white' :
                                stopTypeInfo.color === 'green' ? 'bg-green-600 text-white' :
                                stopTypeInfo.color === 'purple' ? 'bg-purple-600 text-white' :
                                'bg-gray-600 text-white'}`
                            : `${stopTypeInfo.color === 'blue' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                stopTypeInfo.color === 'green' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                stopTypeInfo.color === 'purple' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                                'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                        }`}
                      >
                        {line}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Odjazdy w czasie rzeczywistym
                      {selectedLine && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          - Linia {selectedLine}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {lastUpdate && (
                        <span className="text-xs text-gray-500">
                          Aktualizacja: {lastUpdate.toLocaleTimeString('pl-PL')}
                        </span>
                      )}
                      <button
                        onClick={loadRealTimeData}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {filteredDepartures.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {filteredDepartures.slice(0, 10).map((departure, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              stopTypeInfo.color === 'blue' ? 'bg-blue-600 text-white' :
                              stopTypeInfo.color === 'green' ? 'bg-green-600 text-white' :
                              stopTypeInfo.color === 'purple' ? 'bg-purple-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {departure.lineNumber}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {departure.destination}
                              </div>
                              <div className="text-sm text-gray-600">
                                Planowany: {formatTime(departure.departureTime)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {formatNextDeparture(departure)}
                            </div>
                            <div className={`text-sm ${getDelayColor(departure.delay)}`}>
                              {getDelayText(departure.delay)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Brak dostępnych odjazdów</p>
                    </div>
                  )}
                </div>



                {enhancedData?.accessibility && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Accessibility className="w-5 h-5 mr-2" />
                      Dostępność
                    </h3>
                    <div className="flex items-center space-x-2 text-green-600">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      <span>Przystanek dostępny dla osób niepełnosprawnych</span>
                    </div>
                  </div>
                )}


              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={() => onPlanRoute?.(stop)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Navigation className="w-5 h-5" />
                <span>Planuj trasę</span>
              </button>
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center space-x-2"
              >
                <Calendar className="w-5 h-5" />
                <span>Rozkład</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};