'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  Construction, 
  Clock, 
  Car, 
  Zap, 
  CircleQuestionMark,
  MapPin,
  Loader2
} from 'lucide-react';
import { incidentService } from '@/services/incidentService';
import { Incident, IncidentType, IncidentSeverity } from '@/types/dispatcher.types';
import { MultiModalRoute } from '@/types/routing.types';
import LiveChat from '../chat/LiveChat';

interface IncidentPanelProps {
  route: MultiModalRoute | null;
  isVisible: boolean;
  onClose: () => void;
  onIncidentClick?: (incident: Incident) => void;
}

interface IncidentWithDistance extends Incident {
  distanceFromRoute: number;
}

const getIncidentIcon = (type: IncidentType) => {
  switch (type) {
    case 'delay':
      return <Clock className="w-4 h-4" />;
    case 'breakdown':
      return <Car className="w-4 h-4" />;
    case 'accident':
      return <AlertTriangle className="w-4 h-4" />;
    case 'construction':
      return <Construction className="w-4 h-4" />;
    case 'power_outage':
      return <Zap className="w-4 h-4" />;
    case 'maintenance':
      return <Construction className="w-4 h-4" />;
    default:
      return <CircleQuestionMark className="w-4 h-4" />;
  }
};

const getSeverityColor = (severity: IncidentSeverity) => {
  switch (severity) {
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getTypeLabel = (type: IncidentType) => {
  switch (type) {
    case 'delay':
      return 'Opóźnienie';
    case 'breakdown':
      return 'Awaria pojazdu';
    case 'accident':
      return 'Wypadek';
    case 'construction':
      return 'Roboty drogowe';
    case 'power_outage':
      return 'Awaria zasilania';
    case 'maintenance':
      return 'Konserwacja';
    default:
      return 'Inne';
  }
};

const getSeverityLabel = (severity: IncidentSeverity) => {
  switch (severity) {
    case 'low':
      return 'NISKIE';
    case 'medium':
      return 'ŚREDNIE';
    case 'high':
      return 'WYSOKIE';
    case 'critical':
      return 'KRYTYCZNE';
    default:
      return 'NIEZNANE';
  }
};


const distanceFromPointToLine = (
  point: { lat: number; lng: number },
  lineStart: { lat: number; lng: number },
  lineEnd: { lat: number; lng: number }
): number => {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    
    return Math.sqrt(A * A + B * B) * 111000; 
  }

  let param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }

  const dx = point.lat - xx;
  const dy = point.lng - yy;
  
  
  return Math.sqrt(dx * dx + dy * dy) * 111000;
};


export const findIncidentsNearRoute = (
  incidents: Incident[],
  route: MultiModalRoute,
  maxDistanceKm: number = 10
): IncidentWithDistance[] => {
  const incidentsWithDistance: IncidentWithDistance[] = [];
  
  
  const routePoints: { lat: number; lng: number }[] = [];
  
  route.segments.forEach(segment => {
    if (segment.geometry && segment.geometry.coordinates) {
      segment.geometry.coordinates.forEach(coord => {
        routePoints.push({ lat: coord[1], lng: coord[0] });
      });
    }
  });

  if (routePoints.length < 2) {
    return incidentsWithDistance;
  }

  incidents.forEach(incident => {
    let minDistance = Infinity;
    
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const distance = distanceFromPointToLine(
        incident.location,
        routePoints[i],
        routePoints[i + 1]
      );
      
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    
    
    const distanceKm = minDistance / 1000;
    
    if (distanceKm <= maxDistanceKm) {
      incidentsWithDistance.push({
        ...incident,
        distanceFromRoute: distanceKm
      });
    }
  });
  
  
  return incidentsWithDistance.sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);
};

export const IncidentPanel: React.FC<IncidentPanelProps> = ({
  route,
  isVisible,
  onClose,
  onIncidentClick
}) => {
  const [incidents, setIncidents] = useState<IncidentWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);

  
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const fetchedIncidents = await incidentService.getAllIncidents();
        setAllIncidents(fetchedIncidents);
      } catch (error) {
        console.error('Błąd podczas pobierania incydentów:', error);
      }
    };

    loadIncidents();
  }, []);

  
  useEffect(() => {
    if (!route || !isVisible) {
      setIncidents([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const nearbyIncidents = findIncidentsNearRoute(allIncidents, route, 10);
      setIncidents(nearbyIncidents);
    } catch (error) {
      console.error('Błąd podczas wyszukiwania incydentów:', error);
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  }, [route, allIncidents, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="
      fixed left-[352px] top-4 h-[calc(100vh-2rem)] w-96 
      bg-[#F7F7F7]/50 shadow-2xl z-[1000] flex flex-col gap-y-4 
      rounded-[12px] border border-black/4 backdrop-blur-[50px] p-4
      
      lg:left-[352px] lg:top-4 lg:w-96 lg:h-[calc(100vh-2rem)]
      md:left-[336px] md:top-2 md:w-80 md:h-[calc(100vh-1rem)]
      sm:fixed sm:bottom-0 sm:left-0 sm:right-0 sm:top-auto 
      sm:w-full sm:h-[50vh] sm:rounded-t-[12px] sm:rounded-b-none
      sm:border-t sm:border-l-0 sm:border-r-0 sm:border-b-0
    ">
      
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-black">Incydenty na trasie</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/10 transition-colors"
        >
          <X className="w-5 h-5 text-black/60" />
        </button>
      </div>

      <div className="w-full h-px bg-black/8"></div>

      
      <div className="flex-1 overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#FFA633]" />
                <span className="text-sm text-black/60">Szukam incydentów...</span>
              </div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <MapPin className="w-8 h-8 text-black/30" />
                <span className="text-sm text-black/60">
                  Brak incydentów w pobliżu trasy
                </span>
                <span className="text-xs text-black/40">
                  Sprawdzamy obszar w promieniu 10km
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <span className="text-sm text-black/60">
                  Znaleziono {incidents.length} incydent{incidents.length === 1 ? '' : incidents.length < 5 ? 'y' : 'ów'}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/20">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-white rounded-lg p-3 border border-black/8 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onIncidentClick?.(incident)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`p-2 rounded-lg ${getSeverityColor(incident.severity)}`}>
                          {getIncidentIcon(incident.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-black">
                            {getTypeLabel(incident.type)}
                          </span>
                          {incident.lineNumber && (
                            <span className="text-xs bg-[#FFA633] text-white px-2 py-0.5 rounded-full">
                              {incident.lineNumber}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-black/70 mb-2 line-clamp-2">
                          {incident.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-black/50">
                          <span className={`px-2 py-1 rounded-full ${getSeverityColor(incident.severity)}`}>
                            {getSeverityLabel(incident.severity)}
                          </span>
                          <span>
                            {incident.distanceFromRoute.toFixed(1)} km od trasy
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        
        <div className="w-full h-px bg-black/8 my-4"></div>

        
        <div className="flex-shrink-0">
          <LiveChat
            routeId={route?.id || `route-${Date.now()}`}
            isActive={isVisible && !!route}
            onSendMessage={(message, type) => {
              console.log('Chat message sent:', { message, type });
            }}
          />
        </div>
      </div>
    </div>
  );
};