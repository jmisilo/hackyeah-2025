

export type IncidentType = 'delay' | 'breakdown' | 'accident' | 'construction' | 'power_outage' | 'maintenance' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'pending' | 'approved' | 'rejected' | 'resolved';
export type UpdateType = 'status_change' | 'comment' | 'resolution';

export interface Location {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  reporterId?: string;
  dispatcherId?: string;
  type: IncidentType;
  location: Location;
  description: string;
  lineNumber?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  estimatedDuration?: number; 
  dispatcherNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  userId: string;
  updateType: UpdateType;
  message: string;
  createdAt: Date;
}

export interface Dispatcher {
  id: string;
  userId: string;
  department: string;
  isActive: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'dispatcher' | 'admin';
  createdAt: Date;
}


export type StopType = 'train' | 'metro' | 'regional' | 'bus' | 'tram';

export interface TrainStop {
  id: string;
  name: string;
  location: Location;
  stopType: StopType;
  lines: string[];
  isActive: boolean;
  createdAt: Date;
}


export interface CreateIncidentRequest {
  type: IncidentType;
  location: Location;
  description: string;
  lineNumber?: string;
  severity: IncidentSeverity;
}

export interface UpdateIncidentRequest {
  status: IncidentStatus;
  dispatcherNotes?: string;
  estimatedDuration?: number;
}


export interface IncidentMarkerProps {
  incident: Incident;
  onClick?: (incident: Incident) => void;
}

export interface DispatcherStats {
  totalIncidents: number;
  pendingIncidents: number;
  approvedIncidents: number;
  rejectedIncidents: number;
  resolvedIncidents: number;
  averageResponseTime: number; 
}


export interface IncidentFilters {
  status?: IncidentStatus[];
  type?: IncidentType[];
  severity?: IncidentSeverity[];
  dateFrom?: Date;
  dateTo?: Date;
  lineNumber?: string;
}

export type SortField = 'createdAt' | 'updatedAt' | 'severity' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}