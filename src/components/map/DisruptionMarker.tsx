import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { AlertTriangle, Clock, Construction, Zap, AlertCircle, XCircle } from 'lucide-react';
import { TransportDisruption } from '@/types/enhanced-gtfs.types';
import { GTFSStop } from '@/infrastructure/gtfs/gtfs-data';

interface DisruptionMarkerProps {
  disruption: TransportDisruption;
  stop: GTFSStop;
}

const getSeverityColor = (severity: TransportDisruption['severity']) => {
  switch (severity) {
    case 'low':
      return '#10B981'; 
    case 'medium':
      return '#F59E0B'; 
    case 'high':
      return '#F97316'; 
    case 'critical':
      return '#EF4444'; 
    default:
      return '#6B7280'; 
  }
};

const getDisruptionIcon = (type: TransportDisruption['type']) => {
  switch (type) {
    case 'delay':
      return Clock;
    case 'maintenance':
      return Construction;
    case 'breakdown':
      return Zap;
    case 'cancellation':
      return XCircle;
    case 'route_change':
      return AlertCircle;
    case 'service_alert':
    default:
      return AlertTriangle;
  }
};

const getTypeLabel = (type: TransportDisruption['type']) => {
  switch (type) {
    case 'delay':
      return 'Opóźnienie';
    case 'maintenance':
      return 'Prace konserwacyjne';
    case 'breakdown':
      return 'Awaria';
    case 'cancellation':
      return 'Odwołanie';
    case 'route_change':
      return 'Zmiana trasy';
    case 'service_alert':
      return 'Ostrzeżenie';
    default:
      return 'Utrudnienie';
  }
};

const getSeverityLabel = (severity: TransportDisruption['severity']) => {
  switch (severity) {
    case 'low':
      return 'Niskie';
    case 'medium':
      return 'Średnie';
    case 'high':
      return 'Wysokie';
    case 'critical':
      return 'Krytyczne';
    default:
      return 'Nieznane';
  }
};

export const DisruptionMarker: React.FC<DisruptionMarkerProps> = ({ disruption, stop }) => {
  const IconComponent = getDisruptionIcon(disruption.type);
  const severityColor = getSeverityColor(disruption.severity);

  
  const offsetLat = 0.0003; 
  const offsetLng = 0.0003; 
  const disruptionPosition: [number, number] = [
    stop.lat + offsetLat, 
    stop.lng + offsetLng
  ];

  const createDisruptionIcon = () => {
    const iconHtml = `
      <div style="
        width: 28px;
        height: 28px;
        background-color: ${severityColor};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        position: relative;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${disruption.type === 'delay' ? 
            '<circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline>' :
            disruption.type === 'maintenance' ?
            '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>' :
            disruption.type === 'breakdown' ?
            '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>' :
            disruption.type === 'cancellation' ?
            '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' :
            '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
          }
        </svg>
        ${disruption.severity === 'critical' ? 
          '<div style="position: absolute; top: -2px; right: -2px; width: 6px; height: 6px; background-color: #DC2626; border-radius: 50%; border: 1px solid white;"></div>' : 
          ''
        }
      </div>
    `;

    return new DivIcon({
      html: iconHtml,
      className: 'disruption-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Marker 
      position={disruptionPosition} 
      icon={createDisruptionIcon()}
      zIndexOffset={100} 
    >
      <Popup className="disruption-popup" maxWidth={300}>
        <div className="p-3 space-y-3">
          
          <div className="flex items-start space-x-3">
            <div 
              className="p-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${severityColor}20` }}
            >
              <IconComponent 
                className="w-5 h-5" 
                style={{ color: severityColor }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {disruption.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span 
                  className="px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: severityColor }}
                >
                  {getSeverityLabel(disruption.severity)}
                </span>
                <span className="text-xs text-gray-500">
                  {getTypeLabel(disruption.type)}
                </span>
              </div>
            </div>
          </div>

          
          <div className="text-sm text-gray-700">
            {disruption.description}
          </div>

          
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Rozpoczęcie:</span>
              <span>{formatDate(disruption.startTime)} {formatTime(disruption.startTime)}</span>
            </div>
            {disruption.endTime && (
              <div className="flex justify-between">
                <span>Zakończenie:</span>
                <span>{formatDate(disruption.endTime)} {formatTime(disruption.endTime)}</span>
              </div>
            )}
            {disruption.estimatedDelay && (
              <div className="flex justify-between">
                <span>Opóźnienie:</span>
                <span className="font-medium text-orange-600">
                  +{disruption.estimatedDelay} min
                </span>
              </div>
            )}
          </div>

          
          {disruption.affectedRoutes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">
                Dotknięte linie:
              </h4>
              <div className="flex flex-wrap gap-1">
                {disruption.affectedRoutes.slice(0, 5).map((route) => (
                  <span 
                    key={route}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {route.replace('route_', '')}
                  </span>
                ))}
                {disruption.affectedRoutes.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{disruption.affectedRoutes.length - 5} więcej
                  </span>
                )}
              </div>
            </div>
          )}

          
          {disruption.alternativeRoutes && disruption.alternativeRoutes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">
                Alternatywne trasy:
              </h4>
              <div className="flex flex-wrap gap-1">
                {disruption.alternativeRoutes.slice(0, 3).map((route) => (
                  <span 
                    key={route}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                  >
                    {route.replace('route_', '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Przystanek: <span className="font-medium text-gray-700">{stop.name}</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};