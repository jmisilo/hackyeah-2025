import React, { useState, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrain, 
  FaBus
} from 'react-icons/fa';
import { 
  Clock, 
  Accessibility, 
  Navigation
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
    
    const iconHtml = `
      <div class="enhanced-stop-marker ${stop.type} ${highlighted ? 'highlighted' : ''}" 
           data-stop-id="${stop.id}"
           style="
             width: ${iconSize}px;
             height: ${iconSize}px;
             background: ${iconColor};
             border: 2px solid white;
             border-radius: 50%;
             display: flex;
             align-items: center;
             justify-content: center;
             box-shadow: 0 2px 8px rgba(0,0,0,0.3);
             cursor: pointer;
             transition: all 0.2s ease;
             pointer-events: auto;
           "
           onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.4)';"
           onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)';">
        ${getStopIcon()}
        ${showLines && stop.lines.length > 0 ? `
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 1px 4px;
            border-radius: 6px;
            font-size: 8px;
            font-weight: bold;
            white-space: nowrap;
            max-width: 60px;
            overflow: hidden;
            text-overflow: ellipsis;
            pointer-events: none;
          ">
            ${stop.lines.slice(0, 2).join(', ')}${stop.lines.length > 2 ? '...' : ''}
          </div>
        ` : ''}
        ${walkingTime ? `
          <div style="
            position: absolute;
            top: -6px;
            right: -6px;
            background: #10b981;
            color: white;
            padding: 1px 3px;
            border-radius: 6px;
            font-size: 7px;
            font-weight: bold;
            border: 1px solid white;
            pointer-events: none;
          ">
            ${walkingTime}min
          </div>
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
      case 'small': return 24;
      case 'large': return 48;
      default: return 36;
    }
  };

  const getIconColor = () => {
    switch (stop.type) {
      case 'tram':
        return '#3B82F6';
      case 'bus':
        return '#FF9000'; 
      case 'both':
        return 'linear-gradient(90deg, #3B82F6 50%, #FF9000 50%)'; 
      default:
        return '#6b7280'; 
    }
  };

  const getStopIcon = () => {
    const iconSize = getIconSize() > 30 ? '18' : '14';
    switch (stop.type) {
      case 'tram':
        return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 448 512" fill="white">
          <path d="M96 0C43 0 0 43 0 96v256c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512h39.7c8.5 0 16.6-3.4 22.6-9.4L160 448h128l54.6 54.6c6 6 14.1 9.4 22.6 9.4H405c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9V96c0-53-43-96-96-96H96zM64 128c0-17.7 14.3-32 32-32h256c17.7 0 32 14.3 32 32v64c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V128z"/>
        </svg>`;
      case 'bus':
        return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 576 512" fill="white">
          <path d="M288 0C422.4 0 512 35.2 512 80v16V384c0 35.3-28.7 64-64 64V488c0 13.3-10.7 24-24 24H392c-13.3 0-24-10.7-24-24V448H208v40c0 13.3-10.7 24-24 24H136c-13.3 0-24-10.7-24-24V448c-35.3 0-64-28.7-64-64V96 80C48 35.2 137.6 0 288 0zM128 160v96c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32H160c-17.7 0-32 14.3-32 32z"/>
        </svg>`;
      case 'both':
        return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 32 16" fill="white">
          <defs>
            <clipPath id="leftHalf">
              <rect x="0" y="0" width="16" height="16"/>
            </clipPath>
            <clipPath id="rightHalf">
              <rect x="16" y="0" width="16" height="16"/>
            </clipPath>
          </defs>
          <g clip-path="url(#leftHalf)">
            <path d="M3 0C1.3 0 0 1.3 0 3v8c0 1.5 1.1 2.7 2.5 3l-1.4 1.4c-.3.3-.1.6.2.6h1.2c.3 0 .5-.1.7-.3L5 14h6l1.7 1.7c.2.2.4.3.7.3h1.2c.3 0 .5-.3.2-.6L13.5 14c1.4-.3 2.5-1.5 2.5-3V3c0-1.7-1.3-3-3-3H3zM2 4c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V4z" fill="white"/>
          </g>
          <g clip-path="url(#rightHalf)">
            <path d="M25 0c4.2 0 7 1.1 7 2.5v.5V12c0 1.1-.9 2-2 2v1.2c0 .4-.3.8-.8.8h-.8c-.4 0-.8-.4-.8-.8V14h-5.2v1.2c0 .4-.3.8-.8.8h-.8c-.4 0-.8-.4-.8-.8V14c-1.1 0-2-.9-2-2V3 2.5C18 1.1 20.8 0 25 0zM20 5v3c0 .6.4 1 1 1h8c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1h-8c-.6 0-1 .4-1 1z" fill="white"/>
          </g>
        </svg>`;
      default:
        return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 576 512" fill="white">
          <path d="M288 0C422.4 0 512 35.2 512 80v16V384c0 35.3-28.7 64-64 64V488c0 13.3-10.7 24-24 24H392c-13.3 0-24-10.7-24-24V448H208v40c0 13.3-10.7 24-24 24H136c-13.3 0-24-10.7-24-24V448c-35.3 0-64-28.7-64-64V96 80C48 35.2 137.6 0 288 0zM128 160v96c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32H160c-17.7 0-32 14.3-32 32z"/>
        </svg>`;
    }
  };

  const getStopIconComponent = () => {
    switch (stop.type) {
      case 'tram':
        return <FaTrain className="w-6 h-6" />;
      case 'bus':
        return <FaBus className="w-6 h-6" />;
      case 'both':
        return (
          <div className="flex w-6 h-6">
            <div className="w-3 h-6 flex items-center justify-center overflow-hidden">
              <FaTrain className="w-6 h-6 text-blue-600" style={{ marginRight: '50%' }} />
            </div>
            <div className="w-3 h-6 flex items-center justify-center overflow-hidden">
              <FaBus className="w-6 h-6 text-orange-500" style={{ marginLeft: '50%' }} />
            </div>
          </div>
        );
      default:
        return <FaBus className="w-6 h-6" />;
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