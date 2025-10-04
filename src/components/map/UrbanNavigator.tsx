'use client';

import {
  AlertTriangle,
  Bike,
  Bus,
  BusFront,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Filter,
  FlagTriangleRight,
  Layers,
  MapIcon,
  MapPin,
  MessageCircle,
  Navigation,
  Pin,
  Route,
  Search,
  Settings,
  Settings2,
  Star,
  Train,
  TramFront,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { FC, useCallback, useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import { Icon, LatLng as LeafletLatLng } from 'leaflet';

import LiveChat from '@/components/chat/LiveChat';
import { useMultiModalRouting } from '@/hooks/useMultiModalRouting';
import { useVehicleTracking } from '@/hooks/useVehicleTracking';
import { GeocodingResult, nominatimClient } from '@/infrastructure/geocoding/nominatim-client';
import {
  GTFSStop,
  getStopsByType,
  getStopsInBounds,
  krakowStops,
} from '@/infrastructure/gtfs/gtfs-data';
import { LatLng, osrmClient } from '@/infrastructure/routing/osrm-client';
import { MultiModalRoute } from '@/types/routing.types';
import { VehiclePosition } from '@/types/vehicle.types';
import { cn } from '@/utilities/cn';

import { AnimatedRouteLayer } from './AnimatedRouteLayer';
import { EnhancedStopMarker } from './EnhancedStopMarker';
import { StopDetailsPanel } from './StopDetailsPanel';
import { VehicleTracker } from './VehicleTracker';

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
        const maxWalkingDistance = 500;
        const startStop = findNearestStop(start, maxWalkingDistance);
        const endStop = findNearestStop(end, maxWalkingDistance);

        const segments: any[] = [];
        let totalDuration = 0;
        let totalDistance = 0;

        if (startStop && endStop && startStop.id !== endStop.id) {
          const walkToStart = await osrmClient.getRouteGeoJSON(start, {
            lat: startStop.lat,
            lng: startStop.lng,
          });

          const walkToStartMeta = {
            type: 'walking',
            description: `Pieszo do przystanku ${startStop.name}`,
          };
          segments.push(walkToStart);
          totalDuration += walkToStart.properties.duration;
          totalDistance += walkToStart.properties.distance;

          const transportRoute = await createTransportRoute(startStop, endStop);

          const transportRouteMeta = {
            type: 'transport',
            description: `${transportMode === 'bus' ? 'Autobusem' : 'Tramwajem'} ${startStop.name} → ${endStop.name}`,
          };
          segments.push(transportRoute);

          totalDuration += transportRoute.properties.duration;
          totalDistance += transportRoute.properties.distance;

          const walkFromEnd = await osrmClient.getRouteGeoJSON(
            { lat: endStop.lat, lng: endStop.lng },
            end,
          );

          const walkFromEndMeta = {
            type: 'walking',
            description: `Pieszo z przystanku ${endStop.name}`,
          };
          segments.push(walkFromEnd);
          totalDuration += walkFromEnd.properties.duration;
          totalDistance += walkFromEnd.properties.distance;
        } else {
          const walkingRoute = await osrmClient.getRouteGeoJSON(start, end);

          const walkingRouteMeta = {
            type: 'walking',
            description: 'Cała trasa pieszo',
          };
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

        const allCoordinates: [number, number][] = [];
        segments.forEach((segment: any) => {
          segment.geometry.coordinates.forEach((coord: [number, number]) => {
            allCoordinates.push(coord);
          });
        });

        if (allCoordinates.length > 0) {
          const latLngs = allCoordinates.map((coord) => new LeafletLatLng(coord[1], coord[0]));
          const bounds = new (window as any).L.LatLngBounds(latLngs);
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error('Błąd podczas obliczania trasy:', error);
        if (onRouteCalculated) {
          onRouteCalculated(null);
        }
      }
    };

    calculateMultiModalRoute();
  }, [start, end, transportMode, map, onRouteCalculated]);

  useEffect(() => {
    if (!routeSegments.length) return;

    const layers: any[] = [];

    routeSegments.forEach((segment: any, index: number) => {
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

interface MapEventHandlerProps {
  onMoveEnd: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

function MapEventHandler({ onMoveEnd }: MapEventHandlerProps) {
  useMapEvents({
    moveend: (e) => {
      const bounds = e.target.getBounds();
      onMoveEnd({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });
  return null;
}

interface SearchPanelProps {
  onLocationSelect: (location: LatLng, name: string) => void;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function SearchPanel({ onLocationSelect, placeholder, value, onChange }: SearchPanelProps) {
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await nominatimClient.search(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        searchLocations(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, searchLocations]);

  const handleSuggestionClick = (suggestion: GeocodingResult) => {
    const location: LatLng = {
      lat: suggestion.lat,
      lng: suggestion.lng,
    };
    onLocationSelect(location, suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="w-full text-sm placeholder:text-black/50 text-black focus:outline-none"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.display_name.split(',')[0]}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.display_name.split(',').slice(1).join(',').trim()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

const mockBusStops = [
  { id: 'stop1', name: 'Dworzec Główny', lat: 50.0647, lng: 19.945, lines: ['124', '152'] },
  { id: 'stop2', name: 'Teatr Bagatela', lat: 50.0672, lng: 19.9523, lines: ['124'] },
  { id: 'stop3', name: 'Plac Wszystkich Świętych', lat: 50.0614, lng: 19.9392, lines: ['124'] },
  { id: 'stop4', name: 'Wawel', lat: 50.0544, lng: 19.9355, lines: ['124'] },
  { id: 'stop5', name: 'Rynek Główny', lat: 50.0619, lng: 19.9373, lines: ['152'] },
  { id: 'stop6', name: 'Kazimierz', lat: 50.0497, lng: 19.9445, lines: ['152'] },
];

const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371e3;
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
  const route = await osrmClient.getRouteGeoJSON(
    { lat: startStop.lat, lng: startStop.lng },
    { lat: endStop.lat, lng: endStop.lng },
  );

  const transportRoute = {
    ...route,
    properties: {
      ...route.properties,
      duration: 600,
    },
  };

  return transportRoute;
};

export default function UrbanNavigator() {
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<LatLng | null>(null);
  const [startName, setStartName] = useState('');
  const [endName, setEndName] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [clickMode, setClickMode] = useState<'start' | 'end' | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<'bus' | 'tram'>('bus');

  const [selectedStop, setSelectedStop] = useState<GTFSStop | null>(null);
  const [showStopDetails, setShowStopDetails] = useState(false);
  const [transportFilter, setTransportFilter] = useState<'all' | 'bus' | 'tram' | 'both'>('all');
  const [showVehicles, setShowVehicles] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [animateRoute, setAnimateRoute] = useState(true);
  const [mapBounds, setMapBounds] = useState<any>(null);

  const {
    planRoute,
    currentRoute,
    isLoading: routeLoading,
    error: routeError,
    clearRoute: clearCurrentRoute,
  } = useMultiModalRouting();

  const { vehicles, isConnected: vehiclesConnected, error: vehicleError } = useVehicleTracking();

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

  const handleStopClick = (stop: GTFSStop) => {
    setSelectedStop(stop);
    setShowStopDetails(true);
  };

  const handlePlanRouteToStop = (stop: GTFSStop) => {
    if (startPoint) {
      setEndPoint({ lat: stop.lat, lng: stop.lng });
      setEndName(stop.name);
      setSearchEnd(stop.name);
      handlePlanRoute();
    } else {
      setStartPoint({ lat: stop.lat, lng: stop.lng });
      setStartName(stop.name);
      setSearchStart(stop.name);
    }
    setShowStopDetails(false);
  };

  const handlePlanRoute = async () => {
    if (!startPoint || !endPoint) return;

    try {
      await planRoute({
        start: startPoint,
        end: endPoint,
        transportModes:
          selectedTransport === 'bus'
            ? ['bus']
            : selectedTransport === 'tram'
              ? ['tram']
              : ['bus', 'tram'],
        maxWalkingDistance: 800,
        preferences: {
          minimizeWalking: false,
          minimizeTransfers: true,
          minimizeTime: false,
          avoidStairs: false,
          preferExpress: false,
        },
      });
    } catch (error) {
      console.error('Błąd podczas planowania trasy:', error);
    }
  };

  useEffect(() => {
    if (startPoint && endPoint) {
      handlePlanRoute();
    }
  }, [startPoint, endPoint, selectedTransport]);

  const filteredStops = krakowStops.filter((stop) => {
    if (transportFilter === 'all') return true;
    return stop.type === transportFilter;
  });

  const handleStartLocationSelect = (location: LatLng, name: string) => {
    try {
      setStartPoint(location);
      setStartName(name);
      setSearchStart(name.split(',')[0] || name);
    } catch (error) {
      console.error('Błąd podczas ustawiania punktu startowego:', error);
    }
  };

  const handleEndLocationSelect = (location: LatLng, name: string) => {
    try {
      setEndPoint(location);
      setEndName(name);
      setSearchEnd(name.split(',')[0] || name);
    } catch (error) {
      console.error('Błąd podczas ustawiania punktu docelowego:', error);
    }
  };

  const clearRoute = () => {
    try {
      setStartPoint(null);
      setEndPoint(null);
      setStartName('');
      setEndName('');
      setSearchStart('');
      setSearchEnd('');
      clearCurrentRoute();
    } catch (error) {
      console.error('Błąd podczas czyszczenia trasy:', error);
    }
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
  const relevantDisruptions =
    mockDisruptions?.filter((d) =>
      d?.affectedLines?.some((line) => line?.toLowerCase().includes(selectedTransport)),
    ) || [];

  const totalStops = filteredStops.length;
  const connectedVehicles = vehicles.length;
  const isLoading = routeLoading;
  const error = routeError || vehicleError;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="fixed left-4 top-4 h-[calc(100vh-2rem)] w-80 bg-[#F7F7F7]/50 shadow-2xl z-[1001] flex flex-col gap-y-6 rounded-[12px] border border-black/4 backdrop-blur-[50px] p-4">
        <h1 className="text-xl font-medium text-black">Wyszukaj trasę</h1>

        <div className="w-full h-px bg-black/8"></div>

        <div className="flex gap-x-3">
          <div className="flex-1 px-4 py-2.5 border border-black/12 rounded-lg flex items-center justify-center bg-white cursor-pointer">
            <BusFront className="text-2xl text-black" />
          </div>

          <div className="flex-1 px-4 py-2.5 border border-black/12 bg-[#eeeeee] rounded-lg flex items-center justify-center cursor-pointer">
            <TramFront className="text-2xl text-black/30" />
          </div>

          <div className="flex-1 px-4 py-2.5 border border-black/12 bg-[#eeeeee] rounded-lg flex items-center justify-center cursor-pointer">
            <Bike className="text-2xl text-black/30" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-800">Status systemu</h3>
                <div
                  className={`w-3 h-3 rounded-full ${vehiclesConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalStops}</div>
                  <div className="text-gray-600">Przystanków</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{connectedVehicles}</div>
                  <div className="text-gray-600">Pojazdów online</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filtry i ustawienia
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Typ przystanków
                </label>
                <select
                  value={transportFilter}
                  onChange={(e) => setTransportFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="all">Wszystkie przystanki</option>
                  <option value="bus">Tylko autobusy</option>
                  <option value="tram">Tylko tramwaje</option>
                  <option value="both">Mieszane</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Pojazdy na mapie</span>
                  <button
                    onClick={() => setShowVehicles(!showVehicles)}
                    className={`p-2 rounded-lg transition-colors ${
                      showVehicles ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {showVehicles ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Przystanki</span>
                  <button
                    onClick={() => setShowStops(!showStops)}
                    className={`p-2 rounded-lg transition-colors ${
                      showStops ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {showStops ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Animacje tras</span>
                  <button
                    onClick={() => setAnimateRoute(!animateRoute)}
                    className={`p-2 rounded-lg transition-colors ${
                      animateRoute ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {animateRoute ? <Zap className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Środek transportu
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {transportModes && Array.isArray(transportModes) ? (
                  transportModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedTransport(mode.id as any)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedTransport === mode.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${mode.color} rounded-lg flex items-center justify-center`}>
                          <mode.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{mode.label}</div>
                          <div className="text-sm text-gray-500">{mode.description}</div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Brak dostępnych środków transportu</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Planowanie trasy
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Punkt startowy</span>
                    <button
                      onClick={() => setClickMode(clickMode === 'start' ? null : 'start')}
                      className={`ml-auto px-3 py-1 text-xs rounded-lg transition-all duration-200 ${
                        clickMode === 'start'
                          ? 'bg-indigo-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {clickMode === 'start' ? 'Anuluj' : 'Kliknij mapę'}
                    </button>
                  </div>
                  <SearchPanel
                    onLocationSelect={handleStartLocationSelect}
                    placeholder="Wyszukaj punkt startowy..."
                    value={searchStart}
                    onChange={setSearchStart}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Punkt docelowy</span>
                    <button
                      onClick={() => setClickMode(clickMode === 'end' ? null : 'end')}
                      className={`ml-auto px-3 py-1 text-xs rounded-lg transition-all duration-200 ${
                        clickMode === 'end'
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {clickMode === 'end' ? 'Anuluj' : 'Kliknij mapę'}
                    </button>
                  </div>
                  <SearchPanel
                    onLocationSelect={handleEndLocationSelect}
                    placeholder="Wyszukaj punkt docelowy..."
                    value={searchEnd}
                    onChange={setSearchEnd}
                  />
                </div>
              </div>

              {(startPoint || endPoint) && (
                <button
                  onClick={clearRoute}
                  className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2">
                  <X className="w-4 h-4" />
                  Wyczyść trasę
                </button>
              )}
            </div>

            {error && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">Błąd</span>
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-semibold text-blue-800">Ładowanie...</span>
                </div>
              </div>
            )}

            {currentRoute && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-indigo-800">Informacje o trasie</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Czas podróży</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatDuration(currentRoute.totalDuration)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Dystans</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatDistance(currentRoute.totalDistance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Przesiadki</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {currentRoute.segments.filter((s) => s.type === 'bus' || s.type === 'tram')
                        .length - 1}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Etapy trasy:</h4>
                    <div className="space-y-2">
                      {currentRoute.segments.map((segment, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              segment.type === 'walking'
                                ? 'bg-gray-400'
                                : segment.type === 'bus' || segment.type === 'tram'
                                  ? 'bg-blue-500'
                                  : 'bg-green-500'
                            }`}></div>
                          <span className="text-gray-600">
                            {segment.type === 'walking'
                              ? `Pieszo ${formatDistance(segment.distance)}`
                              : `${segment.type} ${segment.lineNumber || ''} → Cel`}
                          </span>
                          <span className="text-gray-500 ml-auto">
                            {formatDuration(segment.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedStop && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        Odjazdy z {selectedStop.name}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(selectedStop as any).realTimeDepartures
                        ?.slice(0, 5)
                        .map((departure: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-100">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-bold ${
                                  departure.transportType === 'tram'
                                    ? 'bg-blue-600'
                                    : 'bg-green-600'
                                }`}>
                                {departure.lineId}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {departure.destination}
                                </div>
                                <div className="text-xs text-gray-500">{selectedStop.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-700">
                                {departure.estimatedTime}
                              </div>
                              <div
                                className={`text-xs ${departure.delay > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                {departure.delay > 0 ? `+${departure.delay} min` : 'Na czas'}
                              </div>
                            </div>
                          </div>
                        )) || (
                        <div className="text-sm text-gray-500 text-center py-4">
                          Brak dostępnych odjazdów
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <LiveChat
                  routeId={currentRoute ? `${selectedTransport}-route` : 'no-route'}
                  isActive={!!currentRoute}
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg p-3 border border-black/12 bg-[#FFF6EB] flex flex-col gap-y-4">
          <div className="flex items-center gap-x-3">
            <div className="size-9 rounded-full bg-orange-300 flex items-center justify-center text-xl text-white ">
              N
            </div>

            <div className="flex flex-col gap-y-0">
              <p className="text-sm">Natalia Brak</p>

              <p className="text-xs text-black/40">natalia.brak@knmstudio.com</p>
            </div>
          </div>

          <div className="flex flex-col gap-y-2">
            <div className="rounded-full w-full flex-none h-1.5  bg-black/12 relative">
              <div className="rounded-full bg-[#FF9000] w-3/5 h-full" />
            </div>

            <p className="text-xs">
              Do nagrody brakuje ci <span className="font-medium">20 punktów</span>!
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={krakowCenter}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
          whenReady={() => {}}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapEventHandler onMoveEnd={setMapBounds} />

          <MapClickHandler onMapClick={handleMapClick} />

          {showStops &&
            filteredStops.map((stop) => (
              <EnhancedStopMarker
                key={stop.id}
                stop={stop}
                onClick={handleStopClick}
                onPlanRoute={handlePlanRouteToStop}
              />
            ))}

          {showVehicles && (
            <VehicleTracker
              bounds={mapBounds}
              lineFilter={transportFilter === 'all' ? undefined : [transportFilter]}
              onVehicleClick={(vehicle) => console.log('Vehicle clicked:', vehicle)}
            />
          )}

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

          {currentRoute && (
            <AnimatedRouteLayer
              route={currentRoute}
              animate={animateRoute}
              onAnimationComplete={() => console.log('Animation completed')}
            />
          )}
        </MapContainer>

        {/*{!startPoint && !endPoint && (
          <div className="absolute bottom-6 left-6 right-6 z-[1000]">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 text-center max-w-md mx-auto shadow-lg">
              <p className="text-sm text-gray-600">
                Wybierz środek transportu i zaplanuj swoją trasę używając wyszukiwarki lub klikając
                na mapę
              </p>
            </div>
          </div>
        )}

        {selectedStop && showStopDetails && (
          <StopDetailsPanel
            stop={selectedStop}
            isOpen={showStopDetails}
            onClose={() => {
              setSelectedStop(null);
              setShowStopDetails(false);
            }}
            onPlanRoute={handlePlanRouteToStop}
          />
        )}
      </div>
    </div>
  );
}
        )}*/}
      </div>
    </div>
  );
}

const PROPOSED_ROUTES = [
  {
    duration: 25,
    tillDeparture: 5,
    startTime: '12:53',
    startStop: 'Nowy Kleparz',
    endStop: 'Galeria Krakowska',
    endTime: '13:15',
    lineDirection: 'Rondo Mogilskie',
    lineNumber: 3,
  },
  {
    duration: 32,
    tillDeparture: 20,
    startTime: '13:08',
    startStop: 'Plac Inwalidów',
    endStop: 'Galeria Krakowska',
    endTime: '13:40',
    lineDirection: 'Wieliczka Kopalnia',
    lineNumber: 125,
  },
  {
    duration: 25,
    tillDeparture: 55,
    startTime: '13:43',
    startStop: 'Nowy Kleparz',
    endStop: 'Galeria Krakowska',
    endTime: '14:05',
    lineDirection: 'Rondo Mogilskie',
    lineNumber: 3,
  },
];

const SidebarRouteListItem: FC<{
  duration: number;
  tillDeparture: number;
  startTime: string;
  startStop: string;
  endStop: string;
  endTime: string;
  lineDirection: string;
  lineNumber: number;
}> = ({
  startTime,
  startStop,
  endStop,
  endTime,
  lineDirection,
  lineNumber,
  duration,
  tillDeparture,
}) => {
  return (
    <li className="group px-3 pt-3 pb-4 rounded-lg bg-white border first:border-[#FF9000] border-black/8 flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <p className="flex items-end gap-x-1.5">
          <span className="text-black/40 text-xs leading-4">Odjazd za</span>
          <span className="text-lg font-medium leading-4.5">{tillDeparture} minut</span>
        </p>

        <p className="group-first:block hidden py-0.5 px-2 border border-[#FF9000] text-[#FF9000] rounded-full text-[11px]">
          Polecane
        </p>
      </div>

      <div className="flex flex-col gap-y-1.5">
        <div className="flex items-center gap-x-1">
          <p className="text-sm text-[#15AD12] w-11">{startTime}</p>

          <div className="text-black/40">
            <Pin className="size-3.5" />
          </div>

          <p className="pl-1 text-sm text-black">{startStop}</p>
        </div>

        <div className="flex items-center gap-x-1">
          <div className="w-11 text-xs text-black/30">{duration} min</div>

          <div className="w-3.5 flex items-center justify-center">
            <div className="h-7.5 border-l border-dashed border-black/20" />
          </div>

          <p className="flex gap-x-1 items-center">
            <div className="p-1 h-4 min-w-4 rounded-sm bg-[#FF9000] text-xs text-white flex items-center justify-center">
              {lineNumber}
            </div>

            <span className="text-xs text-nowrap">{lineDirection}</span>
          </p>
        </div>

        <div className="flex items-center gap-x-1">
          <p className="text-sm text-[#15AD12] w-11">{endTime}</p>

          <div className="size-3.5 flex items-center justify-center">
            <div className="size-2 bg-orange-300 rounded-full" />
          </div>

          <p className="pl-1 text-sm text-black">{endStop}</p>
        </div>
      </div>
    </li>
  );
};
