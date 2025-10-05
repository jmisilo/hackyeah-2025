import { Bike, BusFront, Clock, FlagTriangleRight, Pin, Settings2, Train, X } from 'lucide-react';
import { type Dispatch, type FC, type SetStateAction } from 'react';

import { type LatLng } from '@/infrastructure/routing/osrm-client';
import { type MultiModalRoute, type RoutingWarning } from '@/types/routing.types';

import { SearchPanel } from './search-panel';

type SidebarProps = {
  setClickMode: Dispatch<SetStateAction<'start' | 'end' | null>>;
  clickMode: 'start' | 'end' | null;
  handleStartLocationSelect: (location: LatLng, name: string) => void;
  handleEndLocationSelect: (location: LatLng, name: string) => void;
  searchStart: string;
  setSearchStart: Dispatch<SetStateAction<string>>;
  searchEnd: string;
  setSearchEnd: Dispatch<SetStateAction<string>>;
  startPoint: LatLng | null;
  endPoint: LatLng | null;
  currentRoute: MultiModalRoute | null;
  alternatives: MultiModalRoute[];
  isLoading: boolean;
  error: string | null;
  warnings?: RoutingWarning[];
  onRouteSelect?: (route: MultiModalRoute) => void;
  selectedTransport?: 'bus' | 'train' | 'bike';
  onTransportSelect?: (transport: 'bus' | 'train' | 'bike') => void;
  onResetRoute?: () => void;
};

export const Sidebar: FC<SidebarProps> = ({
  setClickMode,
  clickMode,
  handleStartLocationSelect,
  handleEndLocationSelect,
  searchStart,
  setSearchStart,
  searchEnd,
  setSearchEnd,
  startPoint,
  endPoint,
  currentRoute,
  alternatives,
  isLoading,
  error,
  warnings = [],
  onRouteSelect,
  selectedTransport = 'bus',
  onTransportSelect,
  onResetRoute,
}) => {
  console.log('🔍 Sidebar render:', {
    startPoint,
    endPoint,
    currentRoute,
    alternatives,
    isLoading,
    error,
    hasCurrentRoute: !!currentRoute,
    alternativesLength: alternatives?.length || 0
  });

  
  const handleRouteClick = () => {
    if (!currentRoute || !alternatives || alternatives.length === 0) {
      return;
    }

    
    const allRoutes = [currentRoute, ...alternatives];
    
    
    const currentIndex = 0; 
    
    
    const nextIndex = (currentIndex + 1) % allRoutes.length;
    const nextRoute = allRoutes[nextIndex];
    
    console.log('🔄 Przełączanie trasy:', {
      currentIndex,
      nextIndex,
      totalRoutes: allRoutes.length,
      nextRoute: nextRoute.id
    });
    
    if (onRouteSelect) {
      onRouteSelect(nextRoute);
    }
  };

  const handleTransportClick = (transport: 'bus' | 'train' | 'bike') => {
    if (onTransportSelect) {
      onTransportSelect(transport);
    }
    
    if (onResetRoute && (currentRoute || startPoint || endPoint)) {
      onResetRoute();
    }
  };
  return (
    <aside className="fixed left-4 top-4 h-[calc(100vh-2rem)] w-80 bg-[#F7F7F7]/50 shadow-2xl z-[1001] flex flex-col gap-y-6 rounded-[12px] border border-black/4 backdrop-blur-[50px] p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-black">Wyszukaj trasę</h1>
        {(currentRoute || startPoint || endPoint) && (
          <button
            onClick={onResetRoute}
            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
            title="Resetuj trasę"
          >
            <X className="w-5 h-5 text-black/60" />
          </button>
        )}
      </div>

      <div className="w-full h-px bg-black/8"></div>

      <div className="flex gap-x-3">
        <div 
          className={`flex-1 px-4 py-2.5 border border-black/12 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
            selectedTransport === 'bus' ? 'bg-white' : 'bg-[#eeeeee]'
          }`}
          onClick={() => handleTransportClick('bus')}
        >
          <BusFront className={`text-2xl ${selectedTransport === 'bus' ? 'text-black' : 'text-black/30'}`} />
        </div>

        <div 
           className={`flex-1 px-4 py-2.5 border border-black/12 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
             selectedTransport === 'train' ? 'bg-white' : 'bg-[#eeeeee]'
           }`}
           onClick={() => handleTransportClick('train')}
         >
          <Train className={`text-2xl ${selectedTransport === 'train' ? 'text-black' : 'text-black/30'}`} />
        </div>

        <div 
          className={`flex-1 px-4 py-2.5 border border-black/12 rounded-lg flex items-center justify-center transition-colors bg-gray-200 cursor-not-allowed opacity-50`}
          title="Opcja rowerowa jest obecnie niedostępna"
        >
          <Bike className="text-2xl text-black/20" />
        </div>
      </div>

      <div className="flex flex-col gap-y-3">
        <div className="relative rounded-lg p-2 bg-white flex items-center gap-x-1.5">
          <button
            onClick={() => setClickMode(clickMode === 'start' ? null : 'start')}
            className="p-1 rounded hover:bg-[#eeeeee] transition-colors duration-200">
            <Pin className="size-4 text-[#408333]" />
          </button>

          <SearchPanel
            onLocationSelect={handleStartLocationSelect}
            placeholder="Wyszukaj punkt startowy..."
            value={searchStart}
            onChange={(value) => {
              console.log('🔍 Sidebar: searchStart onChange', { value });
              setSearchStart(value);
            }}
            selectedTransport={selectedTransport}
          />
        </div>

        <div className="relative rounded-lg p-2 bg-white flex items-center gap-x-1.5">
          <button
            onClick={() => setClickMode(clickMode === 'end' ? null : 'end')}
            className="p-1 rounded hover:bg-[#eeeeee] transition-colors duration-200">
            <FlagTriangleRight className="size-4 text-[#2B87E4]" />
          </button>

          <SearchPanel
            onLocationSelect={handleEndLocationSelect}
            placeholder="Wyszukaj punkt docelowy..."
            value={searchEnd}
            onChange={(value) => {
              console.log('🔍 Sidebar: searchEnd onChange', { value });
              setSearchEnd(value);
            }}
            selectedTransport={selectedTransport}
          />
        </div>

        <div className="relative rounded-lg p-2 bg-white flex items-center gap-x-1.5">
          <button
            onClick={() => setClickMode(clickMode === 'end' ? null : 'end')}
            className="p-1 rounded hover:bg-[#eeeeee] transition-colors duration-200">
            <Clock className="size-4 text-black" />
          </button>

          <input
            type="datetime-local"
            className="w-full text-sm text-black focus:outline-none"
            defaultValue={new Date(new Date().getTime() + 2 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 16)}
          />
        </div>

        <div className="flex justify-between items-center ">
          <div className="flex gap-x-2">
            <div className="flex rounded-full p-0.5 bg-white  ">
              <div className="size-3" />
              <div className="size-3 rounded-full bg-[#FFA633]" />
            </div>

            <p className="text-xs">bez przesiadek</p>
          </div>

          <div className="p-1 rounded hover:bg-[#eeeeee] transition-colors duration-200">
            <Settings2 className="size-4 text-black" />
          </div>
        </div>
      </div>

      
      {currentRoute && !isLoading && <p className="text-base">Sugerowane trasy</p>}
      
      
      {isLoading && !!startPoint?.lat && !!endPoint?.lat && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFA633]"></div>
          <span className="ml-2 text-sm text-gray-600">Szukam najlepszych tras...</span>
        </div>
      )}
      
      
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      
      {warnings && warnings.length > 0 && !isLoading && (
        <div className="flex flex-col gap-y-2">
          {warnings.map((warning, index) => (
            <div 
              key={index}
              className={`rounded-lg p-3 border ${
                warning.severity === 'error' 
                  ? 'bg-red-50 border-red-200' 
                  : warning.severity === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <p className={`text-sm ${
                warning.severity === 'error' 
                  ? 'text-red-600' 
                  : warning.severity === 'warning'
                  ? 'text-yellow-700'
                  : 'text-blue-600'
              }`}>
                {warning.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <ul className="flex-1 overflow-y-auto -mt-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/30 scrollbar-track-rounded-full flex flex-col gap-y-3">
        
        {currentRoute && !isLoading && (
          <SidebarRouteListItem 
            key="main-route"
            route={currentRoute}
            isRecommended={true}
            onClick={handleRouteClick}
            isClickable={alternatives && alternatives.length > 0}
          />
        )}
        
        
        {alternatives && !isLoading && alternatives.map((route, index) => (
          <SidebarRouteListItem 
            key={`alt-${index}`}
            route={route}
            isRecommended={false}
          />
        ))}
      </ul>

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
    </aside>
  );
};


const analyzeRouteSegments = (route: MultiModalRoute) => {
  console.log('🔍 Analizuję trasę:', route);
  console.log('🔍 Raw segments:', route.segments);
  
  const segments = route.segments.map((segment, index) => {
    console.log(`🔍 Segment ${index}:`, {
      type: segment.type,
      rawDuration: segment.duration,
      rawDistance: segment.distance,
      lineNumber: segment.lineNumber,
      startStop: segment.startStop,
      endStop: segment.endStop,
      stopSequence: segment.stopSequence
    });
    
    
    
    const isInSeconds = segment.duration > 1000;
    const durationMinutes = isInSeconds ? Math.round(segment.duration / 60) : Math.round(segment.duration);
    const distanceMeters = Math.round(segment.distance);
    
    console.log(`🔍 Segment ${index} converted:`, {
      isInSeconds,
      durationMinutes,
      distanceMeters
    });
    
    if (segment.type === 'walking') {
      return {
        type: 'walking',
        duration: durationMinutes,
        distance: distanceMeters,
        description: `${durationMinutes} min pieszo (${distanceMeters}m)`,
        icon: '🚶‍♂️'
      };
    } else if (segment.type === 'bus' || segment.type === 'tram' || segment.type === 'train') {
      const stopsCount = segment.stopSequence?.length || 1;
      const lineNumber = segment.lineNumber || '?';
      const startStop = segment.startStop?.name || 'Przystanek';
      const endStop = segment.endStop?.name || 'Przystanek';
      
      let icon = '❓';
      if (segment.type === 'bus') icon = '🚌';
      else if (segment.type === 'tram') icon = '🚋';
      else if (segment.type === 'train') icon = '🚆';
      
      return {
        type: segment.type,
        duration: durationMinutes,
        lineNumber,
        startStop,
        endStop,
        stopsCount,
        description: `Linia ${lineNumber} (${stopsCount} przyst.)`,
        icon
      };
    }
    
    return {
      type: 'unknown',
      duration: durationMinutes,
      description: `${durationMinutes} min`,
      icon: '❓'
    };
  });
  
  console.log('📊 Segmenty trasy po konwersji:', segments);
  return segments;
};


const convertRouteToListItem = (route: MultiModalRoute) => {
  console.log('🔧 convertRouteToListItem - route:', {
    totalDuration: route.totalDuration,
    walkingTime: route.walkingTime,
    segments: route.segments.map(s => ({ type: s.type, duration: s.duration }))
  });

  const segments = analyzeRouteSegments(route);
  
  
  const transitSegment = route.segments.find(segment => segment.type === 'bus' || segment.type === 'tram' || segment.type === 'train');
  
  
  const tillDeparture = Math.floor(Math.random() * 10) + 2; 
  
  
  const now = new Date();
  const startTime = new Date(now.getTime() + tillDeparture * 60000);
  const endTime = new Date(startTime.getTime() + route.totalDuration * 60000); 
  
  
  const firstTransitStop = segments.find(s => s.type === 'bus' || s.type === 'tram' || s.type === 'train')?.startStop;
  const lastTransitStop = segments.find(s => s.type === 'bus' || s.type === 'tram' || s.type === 'train')?.endStop;
  
  const result = {
    duration: Math.round(route.totalDuration), 
    tillDeparture,
    startTime: startTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
    startStop: firstTransitStop || 'Punkt startowy',
    endStop: lastTransitStop || 'Punkt docelowy',
    endTime: endTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
    lineDirection: transitSegment?.stopSequence?.[transitSegment.stopSequence.length - 1]?.name || 'Kierunek',
    lineNumber: transitSegment?.lineNumber || '?',
    segments, 
    walkingDistance: route.walkingDistance,
    walkingTime: Math.round(route.walkingTime), 
    transferCount: route.transferCount,
  };

  console.log('🔧 convertRouteToListItem - result:', {
    duration: result.duration,
    walkingTime: result.walkingTime,
    segments: result.segments.map(s => ({ type: s.type, duration: s.duration }))
  });

  return result;
};

const SidebarRouteListItem: FC<{
  route?: MultiModalRoute;
  isRecommended?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
  
  duration?: number;
  tillDeparture?: number;
  startTime?: string;
  startStop?: string;
  endStop?: string;
  endTime?: string;
  lineDirection?: string;
  lineNumber?: number;
}> = (props) => {
  console.log('🔧 SidebarRouteListItem - props:', {
    hasRoute: !!props.route,
    route: props.route,
    isRecommended: props.isRecommended
  });
  
  
  const routeData = props.route ? convertRouteToListItem(props.route) : {
    duration: props.duration || 0,
    tillDeparture: props.tillDeparture || 0,
    startTime: props.startTime || '',
    startStop: props.startStop || '',
    endStop: props.endStop || '',
    endTime: props.endTime || '',
    lineDirection: props.lineDirection || '',
    lineNumber: props.lineNumber || 0,
    segments: [],
    walkingDistance: 0,
    walkingTime: 0,
    transferCount: 0,
  };

  const {
    startTime,
    endTime,
    duration,
    tillDeparture,
    segments,
    walkingDistance,
    walkingTime,
    transferCount,
  } = routeData;

  return (
    <li 
      className={`group px-3 pt-3 pb-4 rounded-lg bg-white border ${props.isRecommended ? 'border-[#FF9000]' : 'border-black/8'} flex flex-col gap-y-4 transition-all duration-200 ${
        props.isClickable ? 'cursor-pointer hover:shadow-lg hover:border-[#FF9000] hover:bg-gray-50' : ''
      }`}
      onClick={props.isClickable ? props.onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <p className="flex items-end gap-x-1.5">
          <span className="text-black/40 text-xs leading-4">Odjazd za</span>
          <span className="text-lg font-medium leading-4.5">{tillDeparture} minut</span>
        </p>

        <div className="flex items-center gap-x-2">
          
          {props.isClickable && (
            <p className="py-0.5 px-2 bg-blue-100 text-blue-600 rounded-full text-[11px]">
              Kliknij dla alternatyw
            </p>
          )}
        </div>
      </div>

      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-x-2">
          <span className="text-[#15AD12] font-medium">{startTime}</span>
          <span className="text-black/40">→</span>
          <span className="text-[#15AD12] font-medium">{endTime}</span>
        </div>
        <div className="text-black/60">
          {duration} min • {transferCount} przesiadki
        </div>
      </div>

      
      <div className="flex flex-col gap-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-x-2 text-sm">
            <span className="text-lg">{segment.icon}</span>
            <div className="flex-1">
              <span className="text-black">{segment.description}</span>
              {segment.type !== 'walking' && segment.startStop && segment.endStop && (
                <div className="text-xs text-black/60 mt-0.5">
                  {segment.startStop} → {segment.endStop}
                </div>
              )}
            </div>
            <span className="text-xs text-black/40 min-w-fit">
              {segment.duration} min
            </span>
          </div>
        ))}
      </div>

      
      {walkingDistance > 0 && (
        <div className="text-xs text-black/60 bg-gray-50 px-2 py-1 rounded">
          🚶‍♂️ Łącznie pieszo: {walkingTime} min ({Math.round(walkingDistance)}m)
        </div>
      )}
    </li>
  );
};

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
