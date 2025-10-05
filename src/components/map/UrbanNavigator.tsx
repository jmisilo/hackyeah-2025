'use client';

import {
  Bus,
  Plus,
  Train,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { IncidentReportForm } from '@/components/forms/IncidentReportForm';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import { Icon, LatLng as LeafletLatLng } from 'leaflet';
import { toast } from 'sonner';

import { useMultiModalRouting } from '@/hooks/useMultiModalRouting';
import { type GTFSStop, krakowStops, trainDisruptions, getActiveDisruptionsForStop } from '@/infrastructure/gtfs/gtfs-data';
import { type LatLng, osrmClient } from '@/infrastructure/routing/osrm-client';
import { type RoutingRequest } from '@/types/routing.types';
import { incidentService } from '@/services/incidentService';
import { Incident } from '@/types/dispatcher.types';
import { Button } from '@/ui/button';
import { Modal, useModal } from '@/ui/modal';

import { AnimatedRouteLayer } from './AnimatedRouteLayer';
import { DisruptionMarker } from './DisruptionMarker';
import { EnhancedStopMarker } from './EnhancedStopMarker';
import { IncidentMarker } from './IncidentMarker';
import { IncidentPanel, findIncidentsNearRoute } from './IncidentPanel';
import { RouteSearchLoader } from './RouteSearchLoader';
import { StopDetailsModal } from './StopDetailsModal';
import { VehicleDetailsModal } from './VehicleDetailsModal';
import { VehicleTracker } from './VehicleTracker';
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
  transportMode: 'bus' | 'train' | 'bike';
  onRouteCalculated?: (route: any) => void;
}

function RouteLayer({ start, end, transportMode, onRouteCalculated }: RouteLayerProps) {
  const map = useMap();
  const [routeSegments, setRouteSegments] = useState<any[]>([]);

  const getRouteColor = (mode: 'bus' | 'train' | 'bike') => {
    switch (mode) {
      case 'bus':
        return '#f97316'; 
      case 'train':
        return '#2B87E4'; 
      case 'bike':
        return '#408333'; 
      default:
        return '#f97316';
    }
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
            description: `${
              transportMode === 'bus' 
                ? 'Autobusem' 
                : transportMode === 'train' 
                ? 'Pociągiem' 
                : 'Rowerem'
            } ${startStop.name} → ${endStop.name}`,
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
  console.log('🚀 UrbanNavigator component started rendering');
  
  const router = useRouter();
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<LatLng | null>(null);
  const [startName, setStartName] = useState('');
  const [endName, setEndName] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [clickMode, setClickMode] = useState<'start' | 'end' | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<'bus' | 'train' | 'bike'>('bus');

  const [selectedStop, setSelectedStop] = useState<GTFSStop | null>(null);
  const [showStopDetails, setShowStopDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);

  const [showVehicles, setShowVehicles] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showDisruptions, setShowDisruptions] = useState(true);
  const [animateRoute, setAnimateRoute] = useState(true);
  const [mapBounds, setMapBounds] = useState<any>(null);

  
  const [showIncidentPanel, setShowIncidentPanel] = useState(false);
  const [incidentPanelClosedByUser, setIncidentPanelClosedByUser] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [hasIncidentsNearRoute, setHasIncidentsNearRoute] = useState(false);

  const { openModal, closeModal } = useModal();

  const {
    planRoute,
    currentRoute,
    alternatives,
    isLoading: routeLoading,
    error: routeError,
    warnings: routeWarnings,
    clearRoute: clearCurrentRoute,
    selectRoute,
  } = useMultiModalRouting();

  console.log('UrbanNavigator render - states:', {
    hasIncidentsNearRoute,
    showIncidentPanel,
    allIncidentsCount: allIncidents.length,
    currentRoute: !!currentRoute
  });

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
    setShowVehicleDetails(false);
  };

  const handleVehicleClick = useCallback((vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetails(true);
    setShowStopDetails(false);
  }, []);

  const handlePlanRouteToStop = (stop: GTFSStop) => {
    clearCurrentRoute();

    if (startPoint) {
      setEndPoint({ lat: stop.lat, lng: stop.lng });
      setEndName(stop.name);
      setSearchEnd(stop.name);
    } else {
      setStartPoint({ lat: stop.lat, lng: stop.lng });
      setStartName(stop.name);
      setSearchStart(stop.name);
    }
    setShowStopDetails(false);
  };



  useEffect(() => {
    if (startPoint && endPoint && selectedTransport) {
      
      const transportModeMapping: Record<'bus' | 'train' | 'bike', ('walking' | 'bus' | 'tram' | 'train')> = {
        'bus': 'bus',
        'train': 'train',
        'bike': 'tram' 
      };
      
      const request: RoutingRequest = {
        start: startPoint,
        end: endPoint,
        transportModes: [transportModeMapping[selectedTransport]],
        preferences: {
          minimizeWalking: false,
          minimizeTransfers: true,
          minimizeTime: true,
          avoidStairs: false,
          preferExpress: false
        }
      };
      
      planRoute(request);
    }
  }, [startPoint, endPoint, selectedTransport, planRoute]);

  
  useEffect(() => {
    if (currentRoute) {
      
      console.log('Route found, checking incidents...');
    } else {
      setShowIncidentPanel(false);
      setHasIncidentsNearRoute(false);
      console.log('No route, hiding incident panel and clearing incidents flag');
    }
  }, [currentRoute]);

  
  useEffect(() => {
    if (currentRoute && allIncidents.length > 0) {
      console.log('Checking incidents near route:', {
        routeExists: !!currentRoute,
        incidentsCount: allIncidents.length,
        routeSegments: currentRoute.segments?.length || 0
      });
      
      const nearbyIncidents = findIncidentsNearRoute(allIncidents, currentRoute, 10);
      const hasIncidents = nearbyIncidents.length > 0;
      setHasIncidentsNearRoute(hasIncidents);
      
      console.log('Incidents check result:', {
        hasIncidents,
        nearbyIncidentsCount: nearbyIncidents.length,
        incidents: nearbyIncidents.map(inc => ({ id: inc.id, type: inc.type, distance: inc.distanceFromRoute }))
      });
    } else {
      setHasIncidentsNearRoute(false);
      console.log('No incidents check - route or incidents missing:', {
        hasRoute: !!currentRoute,
        incidentsCount: allIncidents.length
      });
    }
  }, [currentRoute, allIncidents]);

  
  useEffect(() => {
    if (hasIncidentsNearRoute && currentRoute) {
      setShowIncidentPanel(true);
      console.log('Auto-showing incident panel for new route with incidents');
    }
  }, [hasIncidentsNearRoute, currentRoute]);

  
  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const incidents = await incidentService.getAllIncidents();
        console.log('Loaded incidents:', incidents);
        setAllIncidents(incidents);
      } catch (error) {
        console.error('Błąd podczas pobierania incydentów:', error);
      }
    };

    loadIncidents();
  }, []);

  const filteredStops = useMemo(() => {
    if (selectedTransport === 'train') {
      return krakowStops.filter(stop => stop.type === 'train');
    } else if (selectedTransport === 'bus') {
      
      return krakowStops.filter(stop => stop.type === 'bus' || stop.type === 'tram');
    } else if (selectedTransport === 'bike') {
      
      return [];
    }
    return krakowStops;
  }, [selectedTransport]);

  const handleStartLocationSelect = (location: LatLng, name: string) => {
    console.log('🎯 handleStartLocationSelect wywołane:', { location, name });
    try {
      setStartPoint(location);
      setStartName(name);
      setSearchStart(name.split(',')[0] || name);
      console.log('✅ Punkt startowy ustawiony:', location);
    } catch (error) {
      console.error('❌ Błąd podczas ustawiania punktu startowego:', error);
    }
  };

  const handleEndLocationSelect = (location: LatLng, name: string) => {
    console.log('🎯 handleEndLocationSelect wywołane:', { location, name });
    try {
      setEndPoint(location);
      setEndName(name);
      setSearchEnd(name.split(',')[0] || name);
      console.log('✅ Punkt końcowy ustawiony:', location);
    } catch (error) {
      console.error('❌ Błąd podczas ustawiania punktu docelowego:', error);
    }
  };

  const handleIncidentClick = (incident: Incident) => {
    console.log('🚨 Kliknięto incydent:', incident);
    setSelectedIncident(incident);
  };

  const handleResetRoute = () => {
    console.log('🔄 Resetowanie trasy');
    clearCurrentRoute();
    setStartPoint(null);
    setEndPoint(null);
    setSearchStart('');
    setSearchEnd('');
    setStartName('');
    setEndName('');
    setShowIncidentPanel(false);
    setHasIncidentsNearRoute(false);
    setSelectedIncident(null);
  };



  return (
    <div className="flex h-screen bg-gray-50 relative">
      <Sidebar
        setClickMode={setClickMode}
        clickMode={clickMode}
        handleStartLocationSelect={handleStartLocationSelect}
        handleEndLocationSelect={handleEndLocationSelect}
        searchStart={searchStart}
        setSearchStart={setSearchStart}
        searchEnd={searchEnd}
        setSearchEnd={setSearchEnd}
        startPoint={startPoint}
        endPoint={endPoint}
        currentRoute={currentRoute}
        alternatives={alternatives}
        isLoading={routeLoading}
        error={routeError}
        warnings={routeWarnings}
        onRouteSelect={selectRoute}
        selectedTransport={selectedTransport}
        onTransportSelect={setSelectedTransport}
        onResetRoute={handleResetRoute}
      />

      <Button
        className="flex gap-x-2 items-center fixed top-4 right-4 z-1000 rounded-lg cursor-pointer"
        onClick={() => router.push('/dispatcher')}
      >
        Panel dystrybutora <Settings className="size-4.5" />
      </Button>

      <Button
        className="flex gap-x-2 items-center fixed top-16 right-4 z-1000 rounded-lg cursor-pointer"
        onClick={() =>
          openModal(
            <>
              <Modal.Header title="Zgłoś utrudnienie"></Modal.Header>
              <Modal.Content>
                <IncidentReportForm 
                  onClose={closeModal}
                  initialLocation={startPoint || endPoint || undefined}
                  initialLocationName={startName || endName || ''}
                />
              </Modal.Content>
            </>,
          )
        }>
        Zgłoś utrudnienie <Plus className="size-4.5" />
      </Button>

      <div className="flex-1 relative">
        <MapContainer
          center={krakowCenter}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
          whenReady={() => {}}>
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
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

          {showDisruptions &&
            filteredStops.map((stop) => {
              const disruptions = getActiveDisruptionsForStop(stop.id);
              return disruptions.map((disruption) => (
                <DisruptionMarker
                  key={`${stop.id}-${disruption.id}`}
                  disruption={disruption}
                  stop={stop}
                />
              ));
            }).flat()}

          
          {allIncidents.map((incident) => (
            <IncidentMarker
              key={incident.id}
              incident={incident}
              isHighlighted={selectedIncident?.id === incident.id}
              onClick={handleIncidentClick}
            />
          ))}

          {showVehicles && (
            <VehicleTracker
              bounds={mapBounds}
              lineFilter={selectedTransport ? [selectedTransport] : undefined}
              onVehicleClick={handleVehicleClick}
              showStops={showStops}
              onToggleStops={() => setShowStops(!showStops)}
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

        <RouteSearchLoader isVisible={routeLoading} />

        <VehicleDetailsModal
          vehicle={selectedVehicle}
          isVisible={showVehicleDetails}
          onClose={() => setShowVehicleDetails(false)}
        />

        <StopDetailsModal
          stop={selectedStop}
          isVisible={showStopDetails}
          onClose={() => setShowStopDetails(false)}
          onPlanRoute={handlePlanRouteToStop}
        />
      </div>

      
      {hasIncidentsNearRoute && !showIncidentPanel && (
        <button
          onClick={() => {
            console.log('Toggle button clicked, opening incident panel');
            setShowIncidentPanel(true);
          }}
          className="
            fixed left-[336px] top-4 w-12 h-12 
            bg-[#FFA633] hover:bg-[#FF9500] 
            rounded-full shadow-lg z-[1001] 
            flex items-center justify-center
            transition-all duration-200 ease-in-out
            hover:scale-110 hover:shadow-xl
            border-2 border-white
            
            lg:left-[336px] lg:top-4 lg:w-12 lg:h-12
            md:left-[320px] md:top-2 md:w-10 md:h-10
            sm:fixed sm:bottom-4 sm:right-4 sm:left-auto sm:top-auto 
            sm:w-14 sm:h-14
          "
          title="Pokaż incydenty na trasie"
        >
          <AlertTriangle className="w-6 h-6 text-white lg:w-6 lg:h-6 md:w-5 md:h-5 sm:w-7 sm:h-7" />
        </button>
      )}

      
      <IncidentPanel
        route={currentRoute}
        isVisible={showIncidentPanel}
        onClose={() => {
          console.log('Incident panel closed by user');
          setShowIncidentPanel(false);
        }}
        onIncidentClick={handleIncidentClick}
      />
    </div>
  );
}
