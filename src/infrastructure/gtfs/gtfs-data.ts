import { EnhancedGTFSStop, RealTimeDeparture } from '../../types/enhanced-gtfs.types';

export interface GTFSStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'bus' | 'tram' | 'both';
  lines: string[];
  zone?: string;
  realTimeDepartures?: RealTimeDeparture[];
}

export interface GTFSRoute {
  id: string;
  shortName: string;
  longName: string;
  type: 'bus' | 'tram';
  color: string;
  textColor: string;
  stops: string[];
}

export interface GTFSTrip {
  id: string;
  routeId: string;
  serviceId: string;
  headsign: string;
  direction: 0 | 1;
  stopTimes: GTFSStopTime[];
}

export interface GTFSStopTime {
  stopId: string;
  arrivalTime: string;
  departureTime: string;
  stopSequence: number;
}


export const krakowStops: GTFSStop[] = [
  {
    id: "1001",
    name: "Dworzec Główny",
    lat: 50.0677,
    lng: 19.9449,
    type: "both",
    lines: ["1", "3", "6", "8", "13", "24", "52", "124", "152", "208"],
    zone: "A"
  },
  {
    id: "1002",
    name: "Teatr Bagatela",
    lat: 50.0625,
    lng: 19.9375,
    type: "both",
    lines: ["1", "6", "8", "18", "124", "152"],
    zone: "A"
  },
  {
    id: "1003",
    name: "Plac Wszystkich Świętych",
    lat: 50.0614,
    lng: 19.9356,
    type: "both",
    lines: ["1", "6", "8", "18", "124", "152", "184"],
    zone: "A"
  },
  {
    id: "1004",
    name: "Wawel",
    lat: 50.0544,
    lng: 19.9356,
    type: "bus",
    lines: ["124", "152", "184"],
    zone: "A"
  },
  {
    id: "1005",
    name: "Poczta Główna",
    lat: 50.0641,
    lng: 19.9370,
    type: "tram",
    lines: ["1", "3", "6", "8", "13"],
    zone: "A"
  },
  {
    id: "1006",
    name: "Teatr Słowackiego",
    lat: 50.0658,
    lng: 19.9289,
    type: "tram",
    lines: ["1", "3", "6", "8", "13", "24"],
    zone: "A"
  },
  {
    id: "1007",
    name: "Cracovia",
    lat: 50.0697,
    lng: 19.9289,
    type: "tram",
    lines: ["1", "3", "6", "8", "13", "24"],
    zone: "A"
  },
  {
    id: "1008",
    name: "Rondo Mogilskie",
    lat: 50.0775,
    lng: 19.9289,
    type: "both",
    lines: ["1", "3", "6", "8", "13", "24", "130", "139", "208"],
    zone: "A"
  },
  {
    id: "1009",
    name: "Galeria Krakowska",
    lat: 50.0689,
    lng: 19.9467,
    type: "both",
    lines: ["3", "24", "52", "130", "139", "208"],
    zone: "A"
  },
  {
    id: "1010",
    name: "Nowy Kleparz",
    lat: 50.0725,
    lng: 19.9467,
    type: "both",
    lines: ["3", "24", "52", "130", "139"],
    zone: "A"
  },
  {
    id: "1011",
    name: "Rondo Grzegórzeckie",
    lat: 50.0547,
    lng: 19.9667,
    type: "tram",
    lines: ["1", "3", "19", "22"],
    zone: "A"
  },
  {
    id: "1012",
    name: "Muzeum Narodowe",
    lat: 50.0567,
    lng: 19.9234,
    type: "tram",
    lines: ["1", "6", "8", "13"],
    zone: "A"
  },
  {
    id: "1013",
    name: "Filharmonia",
    lat: 50.0589,
    lng: 19.9178,
    type: "tram",
    lines: ["1", "6", "8", "13", "18"],
    zone: "A"
  },
  {
    id: "1014",
    name: "Politechnika",
    lat: 50.0647,
    lng: 19.9234,
    type: "tram",
    lines: ["1", "6", "8", "13", "18", "22"],
    zone: "A"
  },
  {
    id: "1015",
    name: "Biprostal",
    lat: 50.0789,
    lng: 19.9345,
    type: "tram",
    lines: ["4", "5", "9", "10", "44"],
    zone: "A"
  },
  {
    id: "2001",
    name: "Kazimierz",
    lat: 50.0497,
    lng: 19.9445,
    type: "bus",
    lines: ["124", "152", "184", "304", "424"],
    zone: "A"
  },
  {
    id: "2002",
    name: "Podgórze",
    lat: 50.0389,
    lng: 19.9445,
    type: "bus",
    lines: ["152", "184", "304", "424", "502"],
    zone: "A"
  },
  {
    id: "2003",
    name: "Lagiewniki",
    lat: 50.0278,
    lng: 19.9334,
    type: "bus",
    lines: ["304", "424", "502", "608"],
    zone: "B"
  },
  {
    id: "2004",
    name: "Borek Fałęcki",
    lat: 50.0156,
    lng: 19.9223,
    type: "bus",
    lines: ["502", "608", "704"],
    zone: "B"
  },
  {
    id: "2005",
    name: "Bronowice",
    lat: 50.0889,
    lng: 19.8667,
    type: "bus",
    lines: ["139", "208", "209", "239"],
    zone: "B"
  },
  {
    id: "2006",
    name: "Krowodrza",
    lat: 50.0889,
    lng: 19.9556,
    type: "bus",
    lines: ["130", "139", "208", "209"],
    zone: "A"
  },
  {
    id: "2007",
    name: "Nowa Huta Centrum",
    lat: 50.0778,
    lng: 20.0333,
    type: "bus",
    lines: ["130", "139", "174", "502"],
    zone: "B"
  },
  {
    id: "2008",
    name: "Mistrzejowice",
    lat: 50.0944,
    lng: 20.0167,
    type: "bus",
    lines: ["174", "502", "608"],
    zone: "B"
  },
  {
    id: "3001",
    name: "Plac Inwalidów",
    lat: 50.0722,
    lng: 19.9111,
    type: "both",
    lines: ["4", "5", "9", "10", "44", "139", "208"],
    zone: "A"
  },
  {
    id: "3002",
    name: "Rondo Czyżyńskie",
    lat: 50.0833,
    lng: 19.9889,
    type: "both",
    lines: ["4", "5", "9", "10", "130", "174"],
    zone: "A"
  },
  {
    id: "3003",
    name: "Plac Centralny",
    lat: 50.0778,
    lng: 20.0222,
    type: "both",
    lines: ["4", "5", "15", "130", "174", "502"],
    zone: "B"
  },
  {
    id: "3004",
    name: "Kurdwanów",
    lat: 50.0056,
    lng: 19.9556,
    type: "both",
    lines: ["3", "24", "304", "424"],
    zone: "B"
  },
  {
    id: "3005",
    name: "Ruczaj",
    lat: 50.0167,
    lng: 19.9000,
    type: "both",
    lines: ["11", "17", "304", "424", "704"],
    zone: "B"
  }
];

export const krakowRoutes: GTFSRoute[] = [
  {
    id: "route_1",
    shortName: "1",
    longName: "Borek Fałęcki - Wzgórza Krzesławickie",
    type: "tram",
    color: "#FF6B35",
    textColor: "#FFFFFF",
    stops: ["1001", "1005", "1006", "1007", "1008"]
  },
  {
    id: "route_3",
    shortName: "3",
    longName: "Nowy Bieżanów - Krowodrza Górka",
    type: "tram",
    color: "#4ECDC4",
    textColor: "#FFFFFF",
    stops: ["1001", "1005", "1006", "1007", "1008", "1009", "1010"]
  },
  {
    id: "route_6",
    shortName: "6",
    longName: "Bronowice Małe - Pleszów",
    type: "tram",
    color: "#45B7D1",
    textColor: "#FFFFFF",
    stops: ["1001", "1002", "1003", "1005", "1006", "1007"]
  },
  {
    id: "route_8",
    shortName: "8",
    longName: "Borek Fałęcki - Kombinat",
    type: "tram",
    color: "#96CEB4",
    textColor: "#FFFFFF",
    stops: ["1001", "1002", "1003", "1005", "1006", "1007", "1008"]
  },
  {
    id: "route_124",
    shortName: "124",
    longName: "Dworzec Główny - Wawel",
    type: "bus",
    color: "#FECA57",
    textColor: "#000000",
    stops: ["1001", "1002", "1003", "1004"]
  },
  {
    id: "route_152",
    shortName: "152",
    longName: "Dworzec Główny - Kazimierz",
    type: "bus",
    color: "#FF9FF3",
    textColor: "#000000",
    stops: ["1001", "1002", "1003", "1004"]
  }
];

export const generateDepartureTimes = (routeId: string, currentTime: string): string[] => {
  const times: string[] = [];
  const [hours, minutes] = currentTime.split(':').map(Number);
  let currentMinutes = hours * 60 + minutes;
  
  const frequency = routeId.includes('tram') ? 8 : 15; 
  
  for (let i = 0; i < 6; i++) {
    const nextTime = currentMinutes + (i * frequency);
    const nextHours = Math.floor(nextTime / 60) % 24;
    const nextMins = nextTime % 60;
    times.push(`${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`);
  }
  
  return times;
};

export const findNearbyStops = (lat: number, lng: number, radius: number = 0.005): GTFSStop[] => {
  return krakowStops.filter(stop => {
    const distance = Math.sqrt(
      Math.pow(stop.lat - lat, 2) + Math.pow(stop.lng - lng, 2)
    );
    return distance <= radius;
  });
};

export const getRouteByLine = (lineNumber: string): GTFSRoute | undefined => {
  return krakowRoutes.find(route => route.shortName === lineNumber);
};

export function getStopsForRoute(routeId: string): GTFSStop[] {
  const route = krakowRoutes.find(r => r.id === routeId);
  if (!route) return [];
  
  return route.stops.map(stopId => 
    krakowStops.find(stop => stop.id === stopId)
  ).filter(Boolean) as GTFSStop[];
}

export function getStopsByType(type: 'bus' | 'tram' | 'both'): GTFSStop[] {
  return krakowStops.filter(stop => stop.type === type);
}

export function getStopsForTransportType(transportType: 'bus' | 'tram'): GTFSStop[] {
  return krakowStops.filter(stop => 
    stop.type === transportType || stop.type === 'both'
  );
}

export function getStopsByLine(lineNumber: string): GTFSStop[] {
  return krakowStops.filter(stop => 
    stop.lines.includes(lineNumber)
  );
}

export function getStopsInBounds(bounds: { north: number; south: number; east: number; west: number }): GTFSStop[] {
  return krakowStops.filter(stop => 
    stop.lat >= bounds.south && 
    stop.lat <= bounds.north && 
    stop.lng >= bounds.west && 
    stop.lng <= bounds.east
  );
}

export function getEnhancedStopData(stopId: string): EnhancedGTFSStop | null {
  const stop = krakowStops.find(s => s.id === stopId);
  if (!stop) return null;

  
  const hasTramsOnly = stop.lines.every(line => {
    const route = getRouteByLine(line);
    return route?.type === 'tram';
  });
  const hasBusesOnly = stop.lines.every(line => {
    const route = getRouteByLine(line);
    return route?.type === 'bus';
  });
  
  let stopIcon: 'bus' | 'tram' | 'both';
  if (hasTramsOnly) {
    stopIcon = 'tram';
  } else if (hasBusesOnly) {
    stopIcon = 'bus';
  } else {
    stopIcon = 'both';
  }

  return {
    ...stop,
    stopIcon,
    accessibility: Math.random() > 0.3, 
    zone: `Zone ${Math.floor(Math.random() * 3) + 1}`,
    platform: `${Math.floor(Math.random() * 4) + 1}`,
    realTimeDepartures: generateRealTimeDepartures(stopId)
  };
}

export function generateRealTimeDepartures(stopId: string): RealTimeDeparture[] {
  const stop = krakowStops.find(s => s.id === stopId);
  if (!stop) return [];

  const now = new Date();
  const departures: RealTimeDeparture[] = [];

  stop.lines.forEach(line => {
    const departureCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < departureCount; i++) {
      const minutesFromNow = (i + 1) * Math.floor(Math.random() * 15) + 2;
      const scheduledTime = new Date(now.getTime() + minutesFromNow * 60000);
      const delay = Math.floor(Math.random() * 5) - 2; 
      const realTime = new Date(scheduledTime.getTime() + delay * 60000);

      const route = getRouteByLine(line);
      
      departures.push({
        lineNumber: line,
        destination: `Kierunek ${Math.random() > 0.5 ? 'Centrum' : 'Nowa Huta'}`,
        departureTime: scheduledTime.toISOString(),
        realTime: realTime.toISOString(),
        estimatedTime: realTime.toISOString(), 
        delay: delay,
        vehicleId: `${line}_${Math.floor(Math.random() * 100)}`,
        routeColor: route?.color || '#666666',
        routeType: route?.type || 'bus',
        headsign: `Kierunek ${Math.random() > 0.5 ? 'Centrum' : 'Nowa Huta'}`
      });
    }
  });

  return departures.sort((a, b) => 
    new Date(a.realTime).getTime() - new Date(b.realTime).getTime()
  );
};