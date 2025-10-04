import React, { useState, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Accessibility, 
  Wifi, 
  Lightbulb, 
  Umbrella,
  CreditCard,
  Monitor,
  Navigation,
  Users,
  Train,
  Bus,
  MapPinIcon
} from 'lucide-react';
import { GTFSStop } from '../../infrastructure/gtfs/gtfs-data';
import { EnhancedGTFSStop, RealTimeDeparture } from '../../types/enhanced-gtfs.types';
import { getEnhancedStopData, generateRealTimeDepartures } from '../../infrastructure/gtfs/gtfs-data';

interface EnhancedStopMarkerProps {
  stop: GTFSStop;
  onClick?: (stop: GTFSStop) => void;
  onPlanRoute?: (stop: GTFSStop) => void;
  showPopup?: boolean;
  showLines?: boolean;
  size?: 'small' | 'medium' | 'large';
  highlighted?: boolean;
  walkingTime?: number;
}

export const EnhancedStopMarker: React.FC<EnhancedStopMarkerProps> = ({
  stop,
  onClick,
  showPopup = false,
  showLines = true,
  size = 'medium',
  highlighted = false,
  walkingTime
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [realTimeDepartures, setRealTimeDepartures] = useState<RealTimeDeparture[]>([]);
  const [enhancedData, setEnhancedData] = useState<EnhancedGTFSStop | null>(null);

  
  const loadEnhancedData = () => {
    if (!enhancedData) {
      const data = getEnhancedStopData(stop.id);
      setEnhancedData(data);
    }
    
    if (realTimeDepartures.length === 0) {
      const departures = generateRealTimeDepartures(stop.id);
      setRealTimeDepartures(departures);
    }
  };

  
  const createStopIcon = () => {
    const iconSize = getIconSize();
    const iconColor = getIconColor();
    const iconShape = getIconShape();
    
    const iconHtml = `
      <div class="enhanced-stop-marker ${stop.type} ${highlighted ? 'highlighted' : ''}" style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        background: ${iconColor};
        border: 3px solid white;
        border-radius: ${iconShape};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        position: relative;
        transition: all 0.3s ease;
        cursor: pointer;
      ">
        <div style="
          color: white;
          font-size: ${iconSize > 30 ? '14px' : '10px'};
          text-align: center;
          line-height: 1;
          font-weight: bold;
        ">
          ${getStopIcon()}
        </div>
        ${showLines && stop.lines.length > 0 ? `
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: bold;
            white-space: nowrap;
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${stop.lines.slice(0, 3).join(', ')}${stop.lines.length > 3 ? '...' : ''}
          </div>
        ` : ''}
        ${walkingTime ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #10b981;
            color: white;
            padding: 2px 4px;
            border-radius: 8px;
            font-size: 8px;
            font-weight: bold;
            border: 1px solid white;
          ">
            ${walkingTime}min
          </div>
        ` : ''}
        ${highlighted ? `
          <div style="
            position: absolute;
            inset: -6px;
            border: 2px solid #fbbf24;
            border-radius: ${iconShape};
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
    `;

    return new DivIcon({
      html: iconHtml,
      className: 'enhanced-stop-marker-icon',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2]
    });
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 40;
      default: return 28;
    }
  };

  const getIconColor = () => {
    switch (stop.type) {
      case 'tram':
        return '#3b82f6'; 
      case 'bus':
        return '#10b981'; 
      case 'both':
        return 'linear-gradient(45deg, #3b82f6, #10b981)'; 
      default:
        return '#6b7280'; 
    }
  };

  const getIconShape = () => {
    switch (stop.type) {
      case 'tram':
        return '4px'; 
      case 'bus':
        return '50%'; 
      case 'both':
        return '8px'; 
      default:
        return '50%';
    }
  };

  const getStopIcon = () => {
    switch (stop.type) {
      case 'tram':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="16" height="6" x="4" y="14" rx="2"/>
          <rect width="18" height="8" x="3" y="6" rx="2"/>
          <path d="M7 10h10"/>
          <path d="m7 14 1-1.5"/>
          <path d="m17 14-1-1.5"/>
          <path d="M7 18h.01"/>
          <path d="M17 18h.01"/>
        </svg>`;
      case 'bus':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/>
          <path d="M15 6v6"/>
          <path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2L20.4 10H20"/>
          <path d="M5 18H2s-.5-1.7-.8-2.8c-.1-.4-.2-.8-.2-1.2 0-.4.1-.8.2-1.2L2.6 10H3"/>
          <circle cx="7" cy="18" r="2"/>
          <circle cx="17" cy="18" r="2"/>
        </svg>`;
      case 'both':
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>`;
      default:
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>`;
    }
  };

  const getStopIconComponent = () => {
    switch (stop.type) {
      case 'tram':
        return <Train className="w-6 h-6" />;
      case 'bus':
        return <Bus className="w-6 h-6" />;
      case 'both':
        return <MapPinIcon className="w-6 h-6" />;
      default:
        return <MapPin className="w-6 h-6" />;
    }
  };

  const formatNextDeparture = (departures: RealTimeDeparture[]) => {
    if (departures.length === 0) return 'Brak danych';
    
    const next = departures[0];
    const now = new Date();
    const departureTime = new Date(next.realTime);
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

  return (
    <Marker
      position={[stop.lat, stop.lng]}
      icon={createStopIcon()}
      eventHandlers={{
        click: () => {
          loadEnhancedData();
          onClick?.(stop);
        },
        mouseover: () => {
          if (!enhancedData) loadEnhancedData();
        }
      }}
    >
      {showPopup && (
        <Popup
          closeButton={true}
          className="enhanced-stop-popup"
          maxWidth={350}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  stop.type === 'tram' ? 'bg-blue-100' : 
                  stop.type === 'bus' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  <div className={`${
                    stop.type === 'tram' ? 'text-blue-600' : 
                    stop.type === 'bus' ? 'text-green-600' : 'text-purple-600'
                  }`}>
                    {getStopIconComponent()}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {stop.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {stop.type === 'tram' ? 'Przystanek tramwajowy' : 
                     stop.type === 'bus' ? 'Przystanek autobusowy' : 
                     'Przystanek tramwajowo-autobusowy'}
                  </p>
                  {enhancedData?.zone && (
                    <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      Strefa {enhancedData.zone}
                    </span>
                  )}
                </div>
              </div>
              
              {walkingTime && (
                <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                  <Navigation className="w-4 h-4" />
                  <span>{walkingTime} min</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Linie ({stop.lines.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {stop.lines.map((line: string) => (
                  <span
                    key={line}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      stop.type === 'tram' ? 'bg-blue-100 text-blue-700' :
                      stop.type === 'bus' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>

            {realTimeDepartures.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Najbliższe odjazdy
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {realTimeDepartures.slice(0, 5).map((departure: RealTimeDeparture, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{departure.lineNumber}</span>
                        <span className="text-gray-600">{departure.destination}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${getDelayColor(departure.delay)}`}>
                          {formatNextDeparture([departure])}
                        </span>
                        {departure.delay > 0 && (
                          <span className="text-xs text-red-600">
                            +{departure.delay}min
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {enhancedData?.accessibility && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Accessibility className="w-4 h-4 mr-1" />
                  Dostępność
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="text-green-600">✓ Dostępny dla osób z niepełnosprawnościami</div>
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {showDetails ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
              </button>
              <button
                onClick={() => onClick?.(stop)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Planuj trasę
              </button>
            </div>

            <AnimatePresence>
              {showDetails && enhancedData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 pt-3 space-y-3"
                >
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Informacje dodatkowe</h5>
                    <div className="space-y-1 text-sm">
                      {enhancedData.platform && (
                        <div className="flex justify-between">
                          <span>Peron:</span>
                          <span className="text-gray-600">{enhancedData.platform}</span>
                        </div>
                      )}
                      {enhancedData.walkingTime && (
                        <div className="flex justify-between">
                          <span>Czas dojścia:</span>
                          <span className="text-gray-600">{enhancedData.walkingTime} min</span>
                        </div>
                      )}
                      {enhancedData.walkingDistance && (
                        <div className="flex justify-between">
                          <span>Dystans:</span>
                          <span className="text-gray-600">{enhancedData.walkingDistance} m</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Popup>
      )}
    </Marker>
  );
};


export const enhancedStopMarkerStyles = `
  .enhanced-stop-marker-icon {
    background: none !important;
    border: none !important;
  }

  .enhanced-stop-marker:hover {
    transform: scale(1.1);
  }

  .enhanced-stop-marker.highlighted {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .enhanced-stop-popup .leaflet-popup-content-wrapper {
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  .enhanced-stop-popup .leaflet-popup-content {
    margin: 0;
    padding: 0;
  }
`;