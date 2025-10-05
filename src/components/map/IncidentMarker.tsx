import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { AlertTriangle, Clock, Construction, Zap, AlertCircle, Car, CircleQuestionMark } from 'lucide-react';
import { Incident, IncidentType, IncidentSeverity } from '@/types/dispatcher.types';

interface IncidentMarkerProps {
  incident: Incident;
  isHighlighted?: boolean;
  onClick?: (incident: Incident) => void;
}

const getSeverityColor = (severity: IncidentSeverity) => {
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

const getIncidentIcon = (type: IncidentType) => {
  switch (type) {
    case 'delay':
      return Clock;
    case 'breakdown':
      return Car;
    case 'accident':
      return AlertTriangle;
    case 'construction':
      return Construction;
    case 'power_outage':
      return Zap;
    case 'maintenance':
      return Construction;
    case 'other':
    default:
      return CircleQuestionMark;
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
      return 'Prace konserwacyjne';
    case 'other':
      return 'Inne';
    default:
      return 'Incydent';
  }
};

const getSeverityLabel = (severity: IncidentSeverity) => {
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

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pl-PL');
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
};

export const IncidentMarker: React.FC<IncidentMarkerProps> = ({ 
  incident, 
  isHighlighted = false,
  onClick 
}) => {
  const IconComponent = getIncidentIcon(incident.type);
  const severityColor = getSeverityColor(incident.severity);

  const createIncidentIcon = () => {
    const size = isHighlighted ? 36 : 28;
    const borderWidth = isHighlighted ? 4 : 2;
    const iconSize = isHighlighted ? 18 : 14;
    
    const iconHtml = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${severityColor};
        border: ${borderWidth}px solid ${isHighlighted ? '#FFA633' : 'white'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        position: relative;
        ${isHighlighted ? 'animation: pulse 2s infinite;' : ''}
      ">
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${incident.type === 'delay' ? 
            '<circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline>' :
            incident.type === 'breakdown' ?
            '<path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"></path>' :
            incident.type === 'accident' ?
            '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' :
            incident.type === 'construction' ?
            '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>' :
            incident.type === 'power_outage' ?
            '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>' :
            '<circle cx="12" cy="12" r="10"></circle><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line>'
          }
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `;

    return new DivIcon({
      html: iconHtml,
      className: 'incident-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  return (
    <Marker 
      position={[incident.location.lat, incident.location.lng]} 
      icon={createIncidentIcon()}
      zIndexOffset={isHighlighted ? 200 : 150}
      eventHandlers={{
        click: () => onClick?.(incident)
      }}
    >
      <Popup className="incident-popup" maxWidth={300}>
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
                {getTypeLabel(incident.type)}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span 
                  className="px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: severityColor }}
                >
                  {getSeverityLabel(incident.severity)}
                </span>
                {incident.lineNumber && (
                  <span className="text-xs bg-[#FFA633] text-white px-2 py-0.5 rounded-full">
                    {incident.lineNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          
          <div className="text-sm text-gray-700">
            {incident.description}
          </div>

          
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Zgłoszono:</span>
              <span>{formatDate(incident.createdAt)} {formatTime(incident.createdAt)}</span>
            </div>
            {incident.updatedAt && incident.updatedAt !== incident.createdAt && (
              <div className="flex justify-between">
                <span>Zaktualizowano:</span>
                <span>{formatDate(incident.updatedAt)} {formatTime(incident.updatedAt)}</span>
              </div>
            )}
            {incident.estimatedDuration && (
              <div className="flex justify-between">
                <span>Szacowany czas:</span>
                <span className="font-medium text-orange-600">
                  {incident.estimatedDuration} min
                </span>
              </div>
            )}
          </div>

          
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Status:</span>
              <span className={`px-2 py-1 rounded-full font-medium ${
                incident.status === 'approved' ? 'bg-green-100 text-green-700' :
                incident.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                incident.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {incident.status === 'approved' ? 'Zatwierdzony' :
                 incident.status === 'pending' ? 'Oczekujący' :
                 incident.status === 'rejected' ? 'Odrzucony' :
                 incident.status}
              </span>
            </div>
          </div>

          
          {incident.dispatcherNotes && (
            <div className="pt-2 border-t border-gray-200">
              <h4 className="text-xs font-medium text-gray-900 mb-1">
                Notatki dyspozytora:
              </h4>
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                {incident.dispatcherNotes}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};