import {
  Incident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentFilters,
  SortOptions,
  DispatcherStats,
  TrainStop,
  StopType,
  Location,
  User,
  Dispatcher
} from '@/types/dispatcher.types';


const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Jan Kowalski',
    role: 'user',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'dispatcher-1',
    email: 'dispatcher@example.com',
    name: 'Kamil',
    role: 'dispatcher',
    createdAt: new Date('2024-01-01')
  }
];


const mockDispatchers: Dispatcher[] = [
  {
    id: 'disp-1',
    userId: 'dispatcher-1',
    department: 'Transport Kolejowy',
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];


const mockTrainStops: TrainStop[] = [
  {
    id: 'train-1',
    name: 'Kraków Główny',
    location: { lat: 50.0677, lng: 19.9449 },
    stopType: 'train',
    lines: ['IC', 'TLK', 'REG'],
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'train-2',
    name: 'Kraków Płaszów',
    location: { lat: 50.0354, lng: 19.9584 },
    stopType: 'train',
    lines: ['IC', 'REG', 'SKM'],
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'train-3',
    name: 'Kraków Batowice',
    location: { lat: 50.0833, lng: 19.9167 },
    stopType: 'train',
    lines: ['REG', 'SKM'],
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'train-4',
    name: 'Kraków Łobzów',
    location: { lat: 50.0833, lng: 19.9167 },
    stopType: 'train',
    lines: ['REG'],
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'train-5',
    name: 'Kraków Bronowice',
    location: { lat: 50.0833, lng: 19.8833 },
    stopType: 'train',
    lines: ['REG', 'SKM'],
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];


let mockIncidents: Incident[] = [
  {
    id: 'incident-1',
    reporterId: 'user-1',
    dispatcherId: 'disp-1',
    type: 'delay',
    location: { lat: 50.0647, lng: 19.945 },
    description: 'Opóźnienie pociągu IC na linii Kraków-Warszawa',
    lineNumber: 'IC 1001',
    severity: 'medium',
    status: 'approved',
    estimatedDuration: 30,
    dispatcherNotes: 'Potwierdzone opóźnienie z powodu awarii sygnalizacji',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:45:00Z')
  },
  {
    id: 'incident-2',
    reporterId: 'user-1',
    type: 'breakdown',
    location: { lat: 50.0354, lng: 19.9584 },
    description: 'Awaria pociągu regionalnego na stacji Płaszów',
    lineNumber: 'REG 5401',
    severity: 'high',
    status: 'pending',
    createdAt: new Date('2024-01-15T11:00:00Z'),
    updatedAt: new Date('2024-01-15T11:00:00Z')
  },
  {
    id: 'incident-3',
    reporterId: 'user-1',
    dispatcherId: 'disp-1',
    type: 'maintenance',
    location: { lat: 50.0833, lng: 19.9167 },
    description: 'Planowane prace torowe na odcinku Batowice-Łobzów',
    severity: 'low',
    status: 'approved',
    estimatedDuration: 120,
    dispatcherNotes: 'Zaplanowane prace konserwacyjne',
    createdAt: new Date('2024-01-14T08:00:00Z'),
    updatedAt: new Date('2024-01-14T08:15:00Z')
  }
];

class IncidentService {
  private incidents: Incident[] = [...mockIncidents];
  private trainStops: TrainStop[] = [...mockTrainStops];
  private users: User[] = [...mockUsers];
  private dispatchers: Dispatcher[] = [...mockDispatchers];

  
  async getAllIncidents(filters?: IncidentFilters, sort?: SortOptions): Promise<Incident[]> {
    let filteredIncidents = [...this.incidents];

    
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        filteredIncidents = filteredIncidents.filter(incident => 
          filters.status!.includes(incident.status)
        );
      }
      if (filters.type && filters.type.length > 0) {
        filteredIncidents = filteredIncidents.filter(incident => 
          filters.type!.includes(incident.type)
        );
      }
      if (filters.severity && filters.severity.length > 0) {
        filteredIncidents = filteredIncidents.filter(incident => 
          filters.severity!.includes(incident.severity)
        );
      }
      if (filters.lineNumber) {
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.lineNumber?.toLowerCase().includes(filters.lineNumber!.toLowerCase())
        );
      }
      if (filters.dateFrom) {
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.createdAt >= filters.dateFrom!
        );
      }
      if (filters.dateTo) {
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.createdAt <= filters.dateTo!
        );
      }
    }

    
    if (sort) {
      filteredIncidents.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sort.field) {
          case 'createdAt':
          case 'updatedAt':
            aValue = a[sort.field].getTime();
            bValue = b[sort.field].getTime();
            break;
          case 'severity':
            const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
            aValue = severityOrder[a.severity];
            bValue = severityOrder[b.severity];
            break;
          case 'status':
            const statusOrder = { pending: 1, approved: 2, rejected: 3, resolved: 4 };
            aValue = statusOrder[a.status];
            bValue = statusOrder[b.status];
            break;
          default:
            return 0;
        }

        if (sort.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    return filteredIncidents;
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    return this.incidents.find(incident => incident.id === id) || null;
  }

  async createIncident(request: CreateIncidentRequest, reporterId?: string): Promise<Incident> {
    const newIncident: Incident = {
      id: `incident-${Date.now()}`,
      reporterId,
      type: request.type,
      location: request.location,
      description: request.description,
      lineNumber: request.lineNumber,
      severity: request.severity,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.incidents.push(newIncident);
    return newIncident;
  }

  async updateIncident(id: string, request: UpdateIncidentRequest, dispatcherId?: string): Promise<Incident | null> {
    const incidentIndex = this.incidents.findIndex(incident => incident.id === id);
    if (incidentIndex === -1) return null;

    const updatedIncident = {
      ...this.incidents[incidentIndex],
      status: request.status,
      dispatcherNotes: request.dispatcherNotes,
      estimatedDuration: request.estimatedDuration,
      dispatcherId,
      updatedAt: new Date()
    };

    this.incidents[incidentIndex] = updatedIncident;
    return updatedIncident;
  }

  async deleteIncident(id: string): Promise<boolean> {
    const initialLength = this.incidents.length;
    this.incidents = this.incidents.filter(incident => incident.id !== id);
    return this.incidents.length < initialLength;
  }

  
  async getDispatcherStats(): Promise<DispatcherStats> {
    const totalIncidents = this.incidents.length;
    const pendingIncidents = this.incidents.filter(i => i.status === 'pending').length;
    const approvedIncidents = this.incidents.filter(i => i.status === 'approved').length;
    const rejectedIncidents = this.incidents.filter(i => i.status === 'rejected').length;
    const resolvedIncidents = this.incidents.filter(i => i.status === 'resolved').length;

    
    const averageResponseTime = 25; 

    return {
      totalIncidents,
      pendingIncidents,
      approvedIncidents,
      rejectedIncidents,
      resolvedIncidents,
      averageResponseTime
    };
  }

  
  async getTrainStops(): Promise<TrainStop[]> {
    return this.trainStops.filter(stop => stop.isActive);
  }

  async getTrainStopsByType(stopType: StopType): Promise<TrainStop[]> {
    return this.trainStops.filter(stop => stop.stopType === stopType && stop.isActive);
  }

  async getNearbyTrainStops(location: Location, radiusKm: number = 5): Promise<TrainStop[]> {
    return this.trainStops.filter(stop => {
      const distance = this.calculateDistance(location, stop.location);
      return distance <= radiusKm && stop.isActive;
    });
  }

  
  async authenticateUser(email: string, password: string): Promise<User | null> {
    
    if (email === 'dispatcher@example.com' && password === 'admin123') {
      return this.users.find(user => user.email === email) || null;
    }
    if (email === 'user@example.com' && password === 'user123') {
      return this.users.find(user => user.email === email) || null;
    }
    return null;
  }

  async getCurrentUser(): Promise<User | null> {
    
    
    return this.users.find(user => user.role === 'dispatcher') || null;
  }

  async isDispatcher(userId: string): Promise<boolean> {
    const user = this.users.find(u => u.id === userId);
    return user?.role === 'dispatcher' || false;
  }

  
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; 
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  
  subscribeToIncidents(callback: (incidents: Incident[]) => void): () => void {
    const interval = setInterval(() => {
      callback([...this.incidents]);
    }, 5000); 

    return () => clearInterval(interval);
  }
}


export const incidentService = new IncidentService();
export default incidentService;