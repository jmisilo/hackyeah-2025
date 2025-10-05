import { EnhancedGTFSStop, RealTimeDeparture, TransportDisruption } from '../../types/enhanced-gtfs.types';

export interface GTFSStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'bus' | 'tram' | 'train' | 'both';
  lines: string[];
  zone?: string;
  realTimeDepartures?: RealTimeDeparture[];
}

export interface GTFSRoute {
  id: string;
  shortName: string;
  longName: string;
  type: 'bus' | 'tram' | 'train';
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



const UNIVERSAL_LINES = [
  
  "1", "3", "4", "5", "6", "8", "9", "11", "13", "14", "15", "17", "18", "19", "22", "24",
  
  "52", "104", "114", "124", "130", "139", "152", "174", "184", "194", "208", 
  "304", "424", "502", "608", "704",
  
  "E1", "E2", "E3", "E4", "E5", "E6",
  
  "N1", "N2", "N3", "N4", "N5", "N6"
];


const TRAIN_LINES = [
  "R1", "R2", "R3", "R4", "R5", "IC1", "IC2", "EC1"
];


export const TRAIN_LINES_DATA = [
  { 
    id: 'IC-101', 
    name: 'IC Cracovia', 
    type: 'IC' as const,
    route: ['4001', '4002', '4003', '4004', '4005', '4006', '4009', '4010', '4011', '4012'], 
    description: 'Kraków Główny - Przemyśl Główny'
  },
  { 
    id: 'TLK-15', 
    name: 'TLK Beskid', 
    type: 'TLK' as const,
    route: ['4001', '4007', '4008', '4009'], 
    description: 'Kraków Główny - Bochnia - Brzesko - Tarnów'
  },
  { 
    id: 'RE-7', 
    name: 'RE Kraków-Tarnów', 
    type: 'RE' as const,
    route: ['4001', '4013', '4014', '4015', '4016', '4007', '4008', '4009'], 
    description: 'Kraków Główny - Tarnów'
  },
];

export const krakowStops: GTFSStop[] = [
  {
    id: "1001",
    name: "Dworzec Główny",
    lat: 50.0677,
    lng: 19.9449,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1002",
    name: "Teatr Bagatela",
    lat: 50.0625,
    lng: 19.9375,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1003",
    name: "Plac Wszystkich Świętych",
    lat: 50.0614,
    lng: 19.9356,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1004",
    name: "Wawel",
    lat: 50.0544,
    lng: 19.9356,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1005",
    name: "Poczta Główna",
    lat: 50.0641,
    lng: 19.9370,
    type: "tram",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1006",
    name: "Teatr Słowackiego",
    lat: 50.0658,
    lng: 19.9289,
    type: "tram",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1007",
    name: "Cracovia",
    lat: 50.0697,
    lng: 19.9289,
    type: "tram",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1008",
    name: "Rondo Mogilskie",
    lat: 50.0775,
    lng: 19.9289,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1009",
    name: "Galeria Krakowska",
    lat: 50.0689,
    lng: 19.9467,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1010",
    name: "Nowy Kleparz",
    lat: 50.0725,
    lng: 19.9467,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1011",
    name: "Rondo Grzegórzeckie",
    lat: 50.0547,
    lng: 19.9667,
    type: "tram",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1012",
    name: "Muzeum Narodowe",
    lat: 50.0567,
    lng: 19.9234,
    type: "tram",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1013",
    name: "Filharmonia",
    lat: 50.0589,
    lng: 19.9178,
    type: "tram",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1014",
    name: "Politechnika",
    lat: 50.0647,
    lng: 19.9234,
    type: "tram",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "1015",
    name: "Biprostal",
    lat: 50.0789,
    lng: 19.9345,
    type: "tram",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "2001",
    name: "Kazimierz",
    lat: 50.0497,
    lng: 19.9445,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "2002",
    name: "Podgórze",
    lat: 50.0389,
    lng: 19.9445,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "2003",
    name: "Lagiewniki",
    lat: 50.0278,
    lng: 19.9334,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "B"
  },
  {
    id: "2004",
    name: "Borek Fałęcki",
    lat: 50.0156,
    lng: 19.9223,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "B"
  },
  {
    id: "2005",
    name: "Bronowice",
    lat: 50.0889,
    lng: 19.8667,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "B"
  },
  {
    id: "2006",
    name: "Krowodrza",
    lat: 50.0889,
    lng: 19.9556,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "2007",
    name: "Nowa Huta Centrum",
    lat: 50.0778,
    lng: 20.0333,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "B"
  },
  {
    id: "2008",
    name: "Mistrzejowice",
    lat: 50.0944,
    lng: 20.0167,
    type: "bus",
    lines: UNIVERSAL_LINES,
    zone: "B"
  },
  {
    id: "3001",
    name: "Plac Inwalidów",
    lat: 50.0722,
    lng: 19.9111,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "3002",
    name: "Rondo Czyżyńskie",
    lat: 50.0833,
    lng: 19.9889,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "A"
  },
  {
    id: "3003",
    name: "Plac Centralny",
    lat: 50.0778,
    lng: 20.0222,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "B"
  },
  {
    id: "3004",
    name: "Kurdwanów",
    lat: 50.0056,
    lng: 19.9556,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "B"
  },
  {
    id: "3005",
    name: "Ruczaj",
    lat: 50.0167,
    lng: 19.9000,
    type: "both",
    lines: UNIVERSAL_LINES,
    zone: "B"
  },
  
  
  {
    id: "4001",
    name: "Kraków Główny",
    lat: 50.0677,
    lng: 19.9449,
    type: "train",
    lines: ["IC-101", "TLK-15", "RE-7"],
    zone: "A"
  },
  {
    id: "4002",
    name: "Kraków Płaszów",
    lat: 50.0347,
    lng: 19.9661,
    type: "train",
    lines: ["IC-101"],
    zone: "A"
  },
  {
    id: "4003",
    name: "Kielce",
    lat: 50.8661,
    lng: 20.6286,
    type: "train",
    lines: ["IC-101"],
    zone: "B"
  },
  {
    id: "4004",
    name: "Radom",
    lat: 51.4027,
    lng: 21.1471,
    type: "train",
    lines: ["IC-101"],
    zone: "B"
  },
  {
    id: "4005",
    name: "Warszawa Wschodnia",
    lat: 52.2533,
    lng: 21.0458,
    type: "train",
    lines: ["IC-101"],
    zone: "C"
  },
  {
    id: "4006",
    name: "Warszawa Centralna",
    lat: 52.2297,
    lng: 21.0122,
    type: "train",
    lines: ["IC-101"],
    zone: "C"
  },
  {
    id: "4007",
    name: "Bochnia",
    lat: 49.9691,
    lng: 20.4347,
    type: "train",
    lines: ["TLK-15", "RE-7"],
    zone: "B"
  },
  {
    id: "4008",
    name: "Brzesko",
    lat: 49.9691,
    lng: 20.6069,
    type: "train",
    lines: ["TLK-15", "RE-7"],
    zone: "B"
  },
  {
    id: "4009",
    name: "Tarnów",
    lat: 50.0133,
    lng: 20.9858,
    type: "train",
    lines: ["TLK-15", "RE-7", "IC-101"],
    zone: "C"
  },
  
  {
    id: "4010",
    name: "Dębica",
    lat: 50.0515,
    lng: 21.4114,
    type: "train",
    lines: ["IC-101"],
    zone: "C"
  },
  {
    id: "4011",
    name: "Rzeszów Główny",
    lat: 50.0412,
    lng: 21.9991,
    type: "train",
    lines: ["IC-101"],
    zone: "C"
  },
  {
    id: "4012",
    name: "Przemyśl Główny",
    lat: 49.7838,
    lng: 22.7685,
    type: "train",
    lines: ["IC-101"],
    zone: "D"
  },
  
  {
    id: "4013",
    name: "Kraków Batowice",
    lat: 50.0889,
    lng: 19.9778,
    type: "train",
    lines: ["RE-7"],
    zone: "A"
  },
  {
    id: "4014",
    name: "Wieliczka Rynek Kopalnia",
    lat: 49.9875,
    lng: 20.0647,
    type: "train",
    lines: ["RE-7"],
    zone: "B"
  },
  {
    id: "4015",
    name: "Gdów",
    lat: 49.9069,
    lng: 20.2047,
    type: "train",
    lines: ["RE-7"],
    zone: "B"
  },
  {
    id: "4016",
    name: "Szczurowa",
    lat: 49.9347,
    lng: 20.3114,
    type: "train",
    lines: ["RE-7"],
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
    stops: ["1001", "1005", "1006", "1007", "1008", "1011", "1012", "1013"]
  },
  {
    id: "route_3",
    shortName: "3",
    longName: "Nowy Bieżanów - Krowodrza Górka",
    type: "tram",
    color: "#4ECDC4",
    textColor: "#FFFFFF",
    stops: ["1001", "1005", "1006", "1007", "1008", "1009", "1010", "3004"]
  },
  {
    id: "route_4",
    shortName: "4",
    longName: "Wzgórza Krzesławickie - Bronowice",
    type: "tram",
    color: "#E74C3C",
    textColor: "#FFFFFF",
    stops: ["1011", "1012", "1013", "1014", "1015", "3001", "3002"]
  },
  {
    id: "route_5",
    shortName: "5",
    longName: "Krowodrza - Nowa Huta",
    type: "tram",
    color: "#9B59B6",
    textColor: "#FFFFFF",
    stops: ["1015", "3001", "3002", "3003"]
  },
  {
    id: "route_6",
    shortName: "6",
    longName: "Bronowice Małe - Pleszów",
    type: "tram",
    color: "#45B7D1",
    textColor: "#FFFFFF",
    stops: ["1001", "1002", "1003", "1005", "1006", "1007", "1012", "1013"]
  },
  {
    id: "route_8",
    shortName: "8",
    longName: "Borek Fałęcki - Kombinat",
    type: "tram",
    color: "#96CEB4",
    textColor: "#FFFFFF",
    stops: ["1001", "1002", "1003", "1005", "1006", "1007", "1008", "1011"]
  },
  {
    id: "route_9",
    shortName: "9",
    longName: "Łagiewniki - Mistrzejowice",
    type: "tram",
    color: "#F39C12",
    textColor: "#FFFFFF",
    stops: ["1011", "1012", "1013", "1014", "1015", "3001", "3002"]
  },
  {
    id: "route_11",
    shortName: "11",
    longName: "Ruczaj - Rondo Grzegórzeckie",
    type: "tram",
    color: "#1ABC9C",
    textColor: "#FFFFFF",
    stops: ["3005", "1011", "1012", "1013", "1014"]
  },
  {
    id: "route_13",
    shortName: "13",
    longName: "Dworzec Główny - Politechnika",
    type: "tram",
    color: "#34495E",
    textColor: "#FFFFFF",
    stops: ["1001", "1005", "1006", "1007", "1008", "1012", "1013", "1014"]
  },
  {
    id: "route_14",
    shortName: "14",
    longName: "Muzeum Narodowe - Filharmonia",
    type: "tram",
    color: "#8E44AD",
    textColor: "#FFFFFF",
    stops: ["1012", "1013", "1014", "1011"]
  },
  
  
  {
    id: "route_104",
    shortName: "104",
    longName: "Dworzec Główny - Bronowice",
    type: "bus",
    color: "#3498DB",
    textColor: "#FFFFFF",
    stops: ["1001", "1002", "1008", "1009", "1010", "2005", "2006"]
  },
  {
    id: "route_114",
    shortName: "114",
    longName: "Teatr Bagatela - Krowodrza",
    type: "bus",
    color: "#2ECC71",
    textColor: "#FFFFFF",
    stops: ["1002", "1003", "1008", "1009", "2006", "3001"]
  },
  {
    id: "route_124",
    shortName: "124",
    longName: "Dworzec Główny - Wawel",
    type: "bus",
    color: "#FECA57",
    textColor: "#000000",
    stops: ["1001", "1002", "1003", "1004", "2001"]
  },
  {
    id: "route_130",
    shortName: "130",
    longName: "Rondo Mogilskie - Nowa Huta",
    type: "bus",
    color: "#E67E22",
    textColor: "#FFFFFF",
    stops: ["1008", "1009", "1010", "2006", "2007", "3002", "3003"]
  },
  {
    id: "route_139",
    shortName: "139",
    longName: "Galeria Krakowska - Bronowice",
    type: "bus",
    color: "#95A5A6",
    textColor: "#FFFFFF",
    stops: ["1009", "1010", "2005", "2006", "2007", "3001"]
  },
  {
    id: "route_152",
    shortName: "152",
    longName: "Dworzec Główny - Kazimierz",
    type: "bus",
    color: "#FF9FF3",
    textColor: "#000000",
    stops: ["1001", "1002", "1003", "1004", "2001", "2002"]
  },
  {
    id: "route_174",
    shortName: "174",
    longName: "Rondo Mogilskie - Mistrzejowice",
    type: "bus",
    color: "#16A085",
    textColor: "#FFFFFF",
    stops: ["1008", "2007", "2008", "3002", "3003"]
  },
  {
    id: "route_184",
    shortName: "184",
    longName: "Plac Wszystkich Świętych - Podgórze",
    type: "bus",
    color: "#C0392B",
    textColor: "#FFFFFF",
    stops: ["1003", "1004", "2001", "2002"]
  },
  {
    id: "route_194",
    shortName: "194",
    longName: "Dworzec Główny - Kazimierz",
    type: "bus",
    color: "#D35400",
    textColor: "#FFFFFF",
    stops: ["1001", "1002", "2001", "2002", "3002"]
  },
  {
    id: "route_208",
    shortName: "208",
    longName: "Dworzec Główny - Bronowice",
    type: "bus",
    color: "#7F8C8D",
    textColor: "#FFFFFF",
    stops: ["1001", "1008", "1009", "2005", "2006", "3001"]
  },
  {
    id: "route_304",
    shortName: "304",
    longName: "Wawel - Łagiewniki",
    type: "bus",
    color: "#27AE60",
    textColor: "#FFFFFF",
    stops: ["1004", "2001", "2002", "2003", "3004", "3005"]
  },
  {
    id: "route_424",
    shortName: "424",
    longName: "Dworzec Główny - Ruczaj",
    type: "bus",
    color: "#8E44AD",
    textColor: "#FFFFFF",
    stops: ["1001", "1002", "1004", "2001", "2002", "2003", "3004", "3005"]
  },
  {
    id: "route_502",
    shortName: "502",
    longName: "Teatr Bagatela - Nowa Huta",
    type: "bus",
    color: "#E74C3C",
    textColor: "#FFFFFF",
    stops: ["1002", "1003", "1004", "2002", "2003", "2007", "2008", "3003"]
  },
  {
    id: "route_608",
    shortName: "608",
    longName: "Łagiewniki - Mistrzejowice",
    type: "bus",
    color: "#9B59B6",
    textColor: "#FFFFFF",
    stops: ["2003", "2004", "2008"]
  },
  
  
  {
    id: "route_E1",
    shortName: "E1",
    longName: "Ekspres: Dworzec Główny - Rondo Mogilskie",
    type: "bus",
    color: "#FF0000",
    textColor: "#FFFFFF",
    stops: ["1001", "1002", "1008", "3001"]
  },
  {
    id: "route_E2",
    shortName: "E2",
    longName: "Ekspres: Dworzec Główny - Krowodrza",
    type: "bus",
    color: "#FF0000",
    textColor: "#FFFFFF",
    stops: ["1001", "1008", "1009", "1010", "2006", "3002"]
  },
  {
    id: "route_E3",
    shortName: "E3",
    longName: "Ekspres: Plac Wszystkich Świętych - Podgórze",
    type: "bus",
    color: "#FF0000",
    textColor: "#FFFFFF",
    stops: ["1003", "1004", "2001", "2002"]
  },
  {
    id: "route_E4",
    shortName: "E4",
    longName: "Ekspres: Łagiewniki - Ruczaj",
    type: "bus",
    color: "#FF0000",
    textColor: "#FFFFFF",
    stops: ["2003", "2004", "3004", "3005"]
  },
  {
    id: "route_E5",
    shortName: "E5",
    longName: "Ekspres: Bronowice - Plac Inwalidów",
    type: "bus",
    color: "#FF0000",
    textColor: "#FFFFFF",
    stops: ["2005", "2006", "3001"]
  },
  {
    id: "route_E6",
    shortName: "E6",
    longName: "Ekspres: Nowa Huta - Plac Centralny",
    type: "bus",
    color: "#FF0000",
    textColor: "#FFFFFF",
    stops: ["2007", "2008", "3002", "3003"]
  },
  
  
  {
    id: "route_N1",
    shortName: "N1",
    longName: "Nocny: Dworzec Główny - Rondo Grzegórzeckie",
    type: "bus",
    color: "#000080",
    textColor: "#FFFFFF",
    stops: ["1001", "1005", "1006", "1007", "1008", "1011", "1012", "1013"]
  },
  {
    id: "route_N2",
    shortName: "N2",
    longName: "Nocny: Dworzec Główny - Krowodrza",
    type: "bus",
    color: "#000080",
    textColor: "#FFFFFF",
    stops: ["1001", "1008", "1009", "1010", "2006", "3001"]
  },
  {
    id: "route_N3",
    shortName: "N3",
    longName: "Nocny: Plac Wszystkich Świętych - Kazimierz",
    type: "bus",
    color: "#000080",
    textColor: "#FFFFFF",
    stops: ["1003", "1004", "2001", "1011"]
  },
  {
    id: "route_N4",
    shortName: "N4",
    longName: "Nocny: Poczta Główna - Łagiewniki",
    type: "bus",
    color: "#000080",
    textColor: "#FFFFFF",
    stops: ["1005", "1006", "1012", "1013", "1014", "2003", "2004", "3004"]
  },
  {
    id: "route_N5",
    shortName: "N5",
    longName: "Nocny: Bronowice - Rondo Grzegórzeckie",
    type: "bus",
    color: "#000080",
    textColor: "#FFFFFF",
    stops: ["2005", "3001", "1013", "1011"]
  },
  {
    id: "route_N6",
    shortName: "N6",
    longName: "Nocny: Nowa Huta - Plac Centralny",
    type: "bus",
    color: "#000080",
    textColor: "#FFFFFF",
    stops: ["2007", "2008", "3002", "3003"]
  },
  
  
  {
    id: "route_R1",
    shortName: "R1",
    longName: "Regionalna: Kraków Główny - Kraków Prokocim",
    type: "train",
    color: "#2B87E4",
    textColor: "#FFFFFF",
    stops: ["4001", "4002", "4004", "4006"]
  },
  {
    id: "route_R2",
    shortName: "R2",
    longName: "Regionalna: Kraków Główny - Kraków Swoszowice",
    type: "train",
    color: "#2B87E4",
    textColor: "#FFFFFF",
    stops: ["4001", "4002", "4005"]
  },
  {
    id: "route_R3",
    shortName: "R3",
    longName: "Regionalna: Kraków Płaszów - Kraków Swoszowice",
    type: "train",
    color: "#2B87E4",
    textColor: "#FFFFFF",
    stops: ["4002", "4005"]
  },
  {
    id: "route_R4",
    shortName: "R4",
    longName: "Regionalna: Kraków Główny - Kraków Mydlniki",
    type: "train",
    color: "#2B87E4",
    textColor: "#FFFFFF",
    stops: ["4001", "4004", "4003", "4008"]
  },
  {
    id: "route_R5",
    shortName: "R5",
    longName: "Regionalna: Kraków Batowice - Kraków Nowa Huta",
    type: "train",
    color: "#2B87E4",
    textColor: "#FFFFFF",
    stops: ["4003", "4007", "4008"]
  },
  {
    id: "route_IC1",
    shortName: "IC1",
    longName: "InterCity: Kraków Główny - Kraków Prokocim",
    type: "train",
    color: "#1565C0",
    textColor: "#FFFFFF",
    stops: ["4001", "4002", "4006"]
  },
  {
    id: "route_IC2",
    shortName: "IC2",
    longName: "InterCity: Kraków Główny - Kraków Prokocim",
    type: "train",
    color: "#1565C0",
    textColor: "#FFFFFF",
    stops: ["4001", "4006"]
  },
  {
    id: "route_EC1",
    shortName: "EC1",
    longName: "EuroCity: Kraków Główny - Kraków Nowa Huta",
    type: "train",
    color: "#0D47A1",
    textColor: "#FFFFFF",
    stops: ["4001", "4007"]
  },
  
  {
    id: "route_IC-101",
    shortName: "IC-101",
    longName: "IC Cracovia: Kraków Główny - Przemyśl Główny",
    type: "train",
    color: "#1565C0",
    textColor: "#FFFFFF",
    stops: ["4001", "4002", "4003", "4004", "4005", "4006", "4009", "4010", "4011", "4012"]
  },
  {
    id: "route_TLK-15",
    shortName: "TLK-15",
    longName: "TLK Beskid: Kraków Główny - Tarnów",
    type: "train",
    color: "#2B87E4",
    textColor: "#FFFFFF",
    stops: ["4001", "4007", "4008", "4009"]
  },
  {
    id: "route_RE-7",
    shortName: "RE-7",
    longName: "RE Kraków-Tarnów: Kraków Główny - Tarnów",
    type: "train",
    color: "#42A5F5",
    textColor: "#FFFFFF",
    stops: ["4001", "4013", "4014", "4015", "4016", "4007", "4008", "4009"]
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

export function getStopsByType(type: 'bus' | 'tram' | 'train' | 'both'): GTFSStop[] {
  return krakowStops.filter(stop => stop.type === type);
}

export function getStopsForTransportType(transportType: 'bus' | 'tram' | 'train'): GTFSStop[] {
  if (transportType === 'train') {
    return krakowStops.filter(stop => stop.type === 'train');
  }
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

  
  if (stop.type === 'train') {
    return {
      ...stop,
      stopIcon: 'train',
      accessibility: Math.random() > 0.3, 
      zone: stop.zone || `Zone ${Math.floor(Math.random() * 3) + 1}`,
      platform: `${Math.floor(Math.random() * 4) + 1}`,
      realTimeDepartures: generateRealTimeDepartures(stopId)
    };
  }
  
  const hasTramsOnly = stop.lines.every(line => {
    const route = getRouteByLine(line);
    return route?.type === 'tram';
  });
  const hasBusesOnly = stop.lines.every(line => {
    const route = getRouteByLine(line);
    return route?.type === 'bus';
  });
  
  let stopIcon: 'bus' | 'tram' | 'train' | 'both';
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
    zone: stop.zone || `Zone ${Math.floor(Math.random() * 3) + 1}`,
    platform: `${Math.floor(Math.random() * 4) + 1}`,
    realTimeDepartures: generateRealTimeDepartures(stopId)
  };
}


export const trainDisruptions: TransportDisruption[] = [
  {
    id: "disruption_001",
    type: "maintenance",
    severity: "high",
    title: "Prace torowe na linii R1",
    description: "Prace modernizacyjne na odcinku Kraków Główny - Kraków Płaszów. Opóźnienia do 15 minut.",
    affectedRoutes: ["route_R1", "route_IC1"],
    affectedStops: ["4001", "4002"],
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), 
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), 
    isActive: true,
    estimatedDelay: 15,
    alternativeRoutes: ["route_R2", "route_R3"]
  },
  {
    id: "disruption_002",
    type: "breakdown",
    severity: "critical",
    title: "Awaria składu na linii IC2",
    description: "Awaria techniczna pociągu InterCity. Kursowanie wstrzymane.",
    affectedRoutes: ["route_IC2"],
    affectedStops: ["4001", "4006"],
    startTime: new Date(Date.now() - 30 * 60 * 1000), 
    endTime: new Date(Date.now() + 90 * 60 * 1000), 
    isActive: true,
    estimatedDelay: 60,
    alternativeRoutes: ["route_IC1", "route_R1"]
  },
  {
    id: "disruption_003",
    type: "delay",
    severity: "medium",
    title: "Opóźnienia na linii R4",
    description: "Zwiększony ruch kolejowy powoduje opóźnienia do 10 minut.",
    affectedRoutes: ["route_R4"],
    affectedStops: ["4001", "4004", "4003", "4008"],
    startTime: new Date(Date.now() - 60 * 60 * 1000), 
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), 
    isActive: true,
    estimatedDelay: 10,
    alternativeRoutes: ["route_R5"]
  },
  {
    id: "disruption_004",
    type: "service_alert",
    severity: "low",
    title: "Zmiana rozkładu jazdy linii EC1",
    description: "Tymczasowa zmiana rozkładu jazdy z powodu prac infrastrukturalnych.",
    affectedRoutes: ["route_EC1"],
    affectedStops: ["4001", "4007"],
    startTime: new Date(Date.now() - 12 * 60 * 60 * 1000), 
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), 
    isActive: true,
    estimatedDelay: 5,
    alternativeRoutes: ["route_R5"]
  }
];


export const getActiveDisruptionsForRoute = (routeId: string): TransportDisruption[] => {
  const now = new Date();
  return trainDisruptions.filter(disruption => 
    disruption.isActive &&
    disruption.affectedRoutes.includes(routeId) &&
    disruption.startTime <= now &&
    (!disruption.endTime || disruption.endTime >= now)
  );
};


export const getActiveDisruptionsForStop = (stopId: string): TransportDisruption[] => {
  const now = new Date();
  return trainDisruptions.filter(disruption => 
    disruption.isActive &&
    disruption.affectedStops.includes(stopId) &&
    disruption.startTime <= now &&
    (!disruption.endTime || disruption.endTime >= now)
  );
};

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