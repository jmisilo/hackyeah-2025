'use client';

import { Bus, Train } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import { Icon, LatLng as LeafletLatLng } from 'leaflet';

import { type LatLng, osrmClient } from '@/infrastructure/routing/osrm-client';

import { Sidebar } from './sidebar';

const createIcon = (color: string) =>
  new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
    </svg>
  `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

const startIcon = createIcon('#6366f1');
const endIcon = createIcon('#ef4444');

interface RouteLayerProps {
  start: LatLng | null;
  end: LatLng | null;
  transportMode: 'bus' | 'tram';
  onRouteCalculated?: (route: any) => void;
}

function RouteLayer({ start, end, transportMode, onRouteCalculated }: RouteLayerProps) {
  const map = useMap();
  const [routeSegments, setRouteSegments] = useState<any[]>([]);

  const getRouteColor = (mode: 'bus' | 'tram') => {
    return mode === 'bus' ? '#f97316' : '#22c55e';
  };

  useEffect(() => {
    if (!start || !end) {
      setRouteSegments([]);
      return;
    }

    const calculateMultiModalRoute = async () => {
      try {
        const maxWalkingDistance = 500; // 500 meters
        const startStop = findNearestStop(start, maxWalkingDistance);
        const endStop = findNearestStop(end, maxWalkingDistance);

        const segments: any[] = [];
        let totalDuration = 0;
        let totalDistance = 0;

        if (startStop && endStop && startStop.id !== endStop.id) {
          // Multi-modal route: walk -> transport -> walk
          // Walk to start stop
          const walkToStart = await osrmClient.getRouteGeoJSON(start, {
            lat: startStop.lat,
            lng: startStop.lng,
          });
          walkToStart.properties.type = 'walking';
          walkToStart.properties.description = `Pieszo do przystanku ${startStop.name}`;
          segments.push(walkToStart);
          totalDuration += walkToStart.properties.duration;
          totalDistance += walkToStart.properties.distance;

          // Transport between stops
          const transportRoute = await createTransportRoute(startStop, endStop);

          transportRoute.properties.description = `${transportMode === 'bus' ? 'Autobusem' : 'Tramwajem'} ${startStop.name} → ${endStop.name}`;
          segments.push(transportRoute);

          totalDuration += transportRoute.properties.duration;
          totalDistance += transportRoute.properties.distance;

          // Walk from end stop to destination
          const walkFromEnd = await osrmClient.getRouteGeoJSON(
            { lat: endStop.lat, lng: endStop.lng },
            end,
          );
          walkFromEnd.properties.type = 'walking';
          walkFromEnd.properties.description = `Pieszo z przystanku ${endStop.name}`;
          segments.push(walkFromEnd);
          totalDuration += walkFromEnd.properties.duration;
          totalDistance += walkFromEnd.properties.distance;
        } else {
          // Pure walking route
          const walkingRoute = await osrmClient.getRouteGeoJSON(start, end);
          walkingRoute.properties.type = 'walking';
          walkingRoute.properties.description = 'Cała trasa pieszo';
          segments.push(walkingRoute);
          totalDuration = walkingRoute.properties.duration;
          totalDistance = walkingRoute.properties.distance;
        }

        const routeInfo = {
          segments,
          totalDuration,
          totalDistance,
          transportMode,
        };

        setRouteSegments(segments);
        onRouteCalculated?.(routeInfo);

        // Fit bounds to all segments
        const allCoordinates: [number, number][] = [];
        segments.forEach((segment) => {
          segment.geometry.coordinates.forEach((coord: [number, number]) => {
            allCoordinates.push(coord);
          });
        });

        if (allCoordinates.length > 0) {
          const bounds = allCoordinates.reduce((bounds: any, coord: [number, number]) => {
            return bounds.extend([coord[1], coord[0]]);
          }, new LeafletLatLng(allCoordinates[0][1], allCoordinates[0][0]).toBounds(100));
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    calculateMultiModalRoute();
  }, [start, end, transportMode, map, onRouteCalculated]);

  useEffect(() => {
    if (!routeSegments.length) return;

    const layers: any[] = [];

    routeSegments.forEach((segment, index) => {
      const color =
        segment.properties.type === 'walking' ? '#6b7280' : getRouteColor(transportMode);
      const weight = segment.properties.type === 'walking' ? 3 : 5;
      const dashArray = segment.properties.type === 'walking' ? '5, 5' : null;

      const layer = (window as any).L.geoJSON(segment, {
        style: {
          color,
          weight,
          opacity: 0.8,
          dashArray,
        },
      }).addTo(map);

      layers.push(layer);
    });

    return () => {
      layers.forEach((layer) => map.removeLayer(layer));
    };
  }, [routeSegments, map, transportMode]);

  return null;
}

interface MapClickHandlerProps {
  onMapClick: (latlng: LatLng) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const mockDisruptions = [
  {
    id: 1,
    type: 'construction',
    title: 'Prace drogowe na ul. Floriańskiej',
    description: 'Utrudnienia w ruchu do 15.12.2024',
    severity: 'medium',
    affectedLines: ['Bus 124', 'Bus 152'],
  },
  {
    id: 2,
    type: 'delay',
    title: 'Opóźnienia tramwajów',
    description: 'Średnie opóźnienie 5-8 minut',
    severity: 'low',
    affectedLines: ['Tram 8', 'Tram 13'],
  },
];

const mockGTFSData = {
  bus: {
    nextDepartures: ['14:25', '14:35', '14:45', '14:55'],
    stops: ['Dworzec Główny', 'Teatr Bagatela', 'Plac Wszystkich Świętych', 'Wawel'],
    line: '124',
  },
  tram: {
    nextDepartures: ['14:22', '14:32', '14:42', '14:52'],
    stops: ['Dworzec Główny', 'Poczta Główna', 'Teatr Słowackiego', 'Cracovia'],
    line: '8',
  },
};

const mockCommunityData = [
  {
    id: 1,
    user: 'Anna K.',
    rating: 4,
    comment: 'Autobus punktualny, czyste wnętrze',
    time: '2 godz. temu',
    type: 'review',
  },
  {
    id: 2,
    user: 'Marcin W.',
    rating: 3,
    comment: 'Tramwaj zatłoczony w godzinach szczytu',
    time: '4 godz. temu',
    type: 'tip',
  },
  {
    id: 3,
    user: 'Kasia M.',
    rating: 5,
    comment: 'Świetne połączenie, polecam!',
    time: '1 dzień temu',
    type: 'review',
  },
];

// Mock bus stops for Krakow
const mockBusStops = [
  { id: 'stop1', name: 'Dworzec Główny', lat: 50.0647, lng: 19.945, lines: ['124', '152'] },
  { id: 'stop2', name: 'Teatr Bagatela', lat: 50.0672, lng: 19.9523, lines: ['124'] },
  { id: 'stop3', name: 'Plac Wszystkich Świętych', lat: 50.0614, lng: 19.9392, lines: ['124'] },
  { id: 'stop4', name: 'Wawel', lat: 50.0544, lng: 19.9355, lines: ['124'] },
  { id: 'stop5', name: 'Rynek Główny', lat: 50.0619, lng: 19.9373, lines: ['152'] },
  { id: 'stop6', name: 'Kazimierz', lat: 50.0497, lng: 19.9445, lines: ['152'] },
];

// Utility functions
const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const findNearestStop = (point: LatLng, maxDistance: number = 500): any => {
  let nearestStop = null;
  let minDistance = Infinity;

  for (const stop of mockBusStops) {
    const distance = calculateDistance(point, { lat: stop.lat, lng: stop.lng });
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearestStop = { ...stop, distance };
    }
  }

  return nearestStop;
};

const createTransportRoute = async (startStop: any, endStop: any): Promise<any> => {
  // Use OSRM for road-following transport route (mock - in real implementation, use GTFS shapes)
  const route = await osrmClient.getRouteGeoJSON(
    { lat: startStop.lat, lng: startStop.lng },
    { lat: endStop.lat, lng: endStop.lng },
  );

  // Override properties for transport segment
  route.properties.type = 'transport';
  route.properties.duration = 600; // Keep mock duration for transport
  // Keep OSRM distance for now, or calculate actual transport distance later

  return route;
};

export default function UrbanNavigator() {
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<LatLng | null>(null);
  const [startName, setStartName] = useState('');
  const [endName, setEndName] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [clickMode, setClickMode] = useState<'start' | 'end' | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<'bus' | 'tram'>('bus');

  const krakowCenter: [number, number] = [50.0647, 19.945];

  const handleMapClick = (latlng: LatLng) => {
    if (clickMode === 'start') {
      setStartPoint(latlng);
      setStartName(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
      setSearchStart('');
      setClickMode(null);
    } else if (clickMode === 'end') {
      setEndPoint(latlng);
      setEndName(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
      setSearchEnd('');
      setClickMode(null);
    }
  };

  const handleStartLocationSelect = (location: LatLng, name: string) => {
    setStartPoint(location);
    setStartName(name);
    setSearchStart(name.split(',')[0] || name);
  };

  const handleEndLocationSelect = (location: LatLng, name: string) => {
    setEndPoint(location);
    setEndName(name);
    setSearchEnd(name.split(',')[0] || name);
  };

  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setStartName('');
    setEndName('');
    setSearchStart('');
    setSearchEnd('');
    setRouteInfo(null);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const transportModes = [
    {
      id: 'bus',
      label: 'Autobus',
      icon: Bus,
      color: 'bg-orange-500',
      description: 'Komunikacja autobusowa',
    },
    {
      id: 'tram',
      label: 'Tramwaj',
      icon: Train,
      color: 'bg-green-500',
      description: 'Komunikacja tramwajowa',
    },
  ];

  const currentGTFS = mockGTFSData[selectedTransport];
  const relevantDisruptions = mockDisruptions.filter((d) =>
    d.affectedLines.some((line) => line.toLowerCase().includes(selectedTransport)),
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        setClickMode={setClickMode}
        clickMode={clickMode}
        handleStartLocationSelect={handleStartLocationSelect}
        handleEndLocationSelect={handleEndLocationSelect}
        searchStart={searchStart}
        setSearchStart={setSearchStart}
        searchEnd={searchEnd}
        setSearchEnd={setSearchEnd}
      />

      <div className="flex-1 relative">
        <MapContainer center={krakowCenter} zoom={13} className="w-full h-full" zoomControl={false}>
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          />

          <MapClickHandler onMapClick={handleMapClick} />

          {/* Bus stop markers */}
          {mockBusStops.map((stop) => (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={createIcon('#10b981')}>
              <Popup>
                <div className="text-sm">
                  <strong>{stop.name}</strong>
                  <br />
                  Linie: {stop.lines.join(', ')}
                </div>
              </Popup>
            </Marker>
          ))}

          {startPoint && (
            <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Punkt startowy</strong>
                  <br />
                  {startName}
                </div>
              </Popup>
            </Marker>
          )}

          {endPoint && (
            <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Punkt docelowy</strong>
                  <br />
                  {endName}
                </div>
              </Popup>
            </Marker>
          )}

          <RouteLayer
            start={startPoint}
            end={endPoint}
            transportMode={selectedTransport}
            onRouteCalculated={setRouteInfo}
          />
        </MapContainer>
      </div>
    </div>
  );
}
