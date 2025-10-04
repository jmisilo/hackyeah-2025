'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Icon, LatLng as LeafletLatLng } from 'leaflet';
import { MapPin, Navigation, Search, X, Bus, Train, Clock, Route, AlertTriangle, Users, Star, MessageCircle, Calendar, MapIcon } from 'lucide-react';
import { LatLng, osrmClient } from '@/infrastructure/routing/osrm-client';
import { nominatimClient, GeocodingResult } from '@/infrastructure/geocoding/nominatim-client';

const createIcon = (color: string) => new Icon({
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
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

  const getRouteColor = (mode: 'bus' | 'tram') => {
    return mode === 'bus' ? '#f97316' : '#22c55e';
  };

  useEffect(() => {
    if (!start || !end) {
      setRouteGeoJSON(null);
      return;
    }

    const calculateRoute = async () => {
      try {
        const route = await osrmClient.getRouteGeoJSON(start, end);
        setRouteGeoJSON(route);
        onRouteCalculated?.(route);

        const coordinates = route.geometry.coordinates;
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds: any, coord: [number, number]) => {
              return bounds.extend([coord[1], coord[0]]);
            },
            new LeafletLatLng(coordinates[0][1], coordinates[0][0]).toBounds(100)
          );
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    calculateRoute();
  }, [start, end, map, onRouteCalculated]);

  useEffect(() => {
    if (!routeGeoJSON) return;

    const geoJsonLayer = (window as any).L.geoJSON(routeGeoJSON, {
      style: {
        color: getRouteColor(transportMode),
        weight: 5,
        opacity: 0.8,
      },
    }).addTo(map);

    return () => {
      map.removeLayer(geoJsonLayer);
    };
  }, [routeGeoJSON, map, transportMode]);

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
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
            >
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
    affectedLines: ['Bus 124', 'Bus 152']
  },
  {
    id: 2,
    type: 'delay',
    title: 'Opóźnienia tramwajów',
    description: 'Średnie opóźnienie 5-8 minut',
    severity: 'low',
    affectedLines: ['Tram 8', 'Tram 13']
  }
];

const mockGTFSData = {
  bus: {
    nextDepartures: ['14:25', '14:35', '14:45', '14:55'],
    stops: ['Dworzec Główny', 'Teatr Bagatela', 'Plac Wszystkich Świętych', 'Wawel'],
    line: '124'
  },
  tram: {
    nextDepartures: ['14:22', '14:32', '14:42', '14:52'],
    stops: ['Dworzec Główny', 'Poczta Główna', 'Teatr Słowackiego', 'Cracovia'],
    line: '8'
  }
};

const mockCommunityData = [
  {
    id: 1,
    user: 'Anna K.',
    rating: 4,
    comment: 'Autobus punktualny, czyste wnętrze',
    time: '2 godz. temu',
    type: 'review'
  },
  {
    id: 2,
    user: 'Marcin W.',
    rating: 3,
    comment: 'Tramwaj zatłoczony w godzinach szczytu',
    time: '4 godz. temu',
    type: 'tip'
  },
  {
    id: 3,
    user: 'Kasia M.',
    rating: 5,
    comment: 'Świetne połączenie, polecam!',
    time: '1 dzień temu',
    type: 'review'
  }
];

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

  const krakowCenter: [number, number] = [50.0647, 19.9450];

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
    { id: 'bus', label: 'Autobus', icon: Bus, color: 'bg-orange-500', description: 'Komunikacja autobusowa' },
    { id: 'tram', label: 'Tramwaj', icon: Train, color: 'bg-green-500', description: 'Komunikacja tramwajowa' },
  ];

  const currentGTFS = mockGTFSData[selectedTransport];
  const relevantDisruptions = mockDisruptions.filter(d => 
    d.affectedLines.some(line => line.toLowerCase().includes(selectedTransport))
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-96 bg-white shadow-2xl z-[1001] flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Urban Navigator</h1>
              <p className="text-sm text-gray-500">Inteligentny planer podróży miejskich</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Środek transportu</h3>
              <div className="grid grid-cols-1 gap-3">
                {transportModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedTransport(mode.id as any)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedTransport === mode.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${mode.color} rounded-lg flex items-center justify-center`}>
                        <mode.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{mode.label}</div>
                        <div className="text-sm text-gray-500">{mode.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Planowanie trasy</h3>
              
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
                      }`}
                    >
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
                      }`}
                    >
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
                  className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Wyczyść trasę
                </button>
              )}
            </div>

            {routeInfo && (
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
                      {formatDuration(routeInfo.properties.duration)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Dystans</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatDistance(routeInfo.properties.distance)}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Rozkład jazdy - Linia {currentGTFS.line}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Najbliższe odjazdy:</p>
                      <div className="flex gap-2 flex-wrap">
                        {currentGTFS.nextDepartures.map((time, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg font-medium">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Główne przystanki:</p>
                      <div className="text-xs text-gray-700 space-y-1">
                        {currentGTFS.stops.map((stop, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            {stop}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {relevantDisruptions.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-800">Utrudnienia</span>
                    </div>
                    <div className="space-y-3">
                      {relevantDisruptions.map((disruption) => (
                        <div key={disruption.id} className="border-l-4 border-amber-400 pl-3">
                          <h4 className="font-medium text-gray-900 text-sm">{disruption.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{disruption.description}</p>
                          <div className="flex gap-1 mt-2">
                            {disruption.affectedLines.map((line, index) => (
                              <span key={index} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                                {line}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Opinie społeczności</span>
                  </div>
                  <div className="space-y-3">
                    {mockCommunityData.slice(0, 2).map((item) => (
                      <div key={item.id} className="border-l-4 border-green-400 pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{item.user}</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{item.time}</span>
                        </div>
                        <p className="text-xs text-gray-600">{item.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={krakowCenter}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapClickHandler onMapClick={handleMapClick} />
          
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

        {!startPoint && !endPoint && (
          <div className="absolute bottom-6 left-6 right-6 z-[1000]">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 text-center max-w-md mx-auto shadow-lg">
              <p className="text-sm text-gray-600">
                Wybierz środek transportu i zaplanuj swoją trasę używając wyszukiwarki lub klikając na mapę
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}