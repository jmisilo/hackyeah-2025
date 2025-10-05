'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { toast } from 'sonner';
import { 
  LogOut, 
  Filter, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  User as UserIcon,
  Calendar,
  TrendingUp,
  Plus,
  Train,
  Bus
} from 'lucide-react';
import { incidentService } from '@/services/incidentService';
import { 
  Incident, 
  IncidentStatus, 
  IncidentSeverity, 
  IncidentType, 
  User, 
  DispatcherStats 
} from '@/types/dispatcher.types';

export default function DispatcherPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<DispatcherStats | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIncident, setNewIncident] = useState({
    type: 'delay' as IncidentType,
    severity: 'medium' as IncidentSeverity,
    lineNumber: '',
    description: '',
    location: { lat: 0, lng: 0, address: '' },
    selectedTrain: ''
  });
  const router = useRouter();

  useEffect(() => {
    
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'dispatcher') {
      toast.error('Brak uprawnień do panelu dyspozytora');
      router.push('/');
      return;
    }

    setCurrentUser(user);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [incidentsData, statsData] = await Promise.all([
        incidentService.getAllIncidents(),
        incidentService.getDispatcherStats()
      ]);
      
      setIncidents(incidentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Błąd podczas ładowania danych:', error);
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    toast.success('Wylogowano pomyślnie');
    router.push('/login');
  };

  
  const availableTrains = [
    { id: 'train-001', number: 'IC 1001', route: 'Warszawa - Kraków', type: 'intercity' },
    { id: 'train-002', number: 'TLK 2002', route: 'Gdańsk - Wrocław', type: 'express' },
    { id: 'train-003', number: 'RE 3003', route: 'Poznań - Łódź', type: 'regional' },
    { id: 'train-004', number: 'IC 4004', route: 'Katowice - Szczecin', type: 'intercity' },
    { id: 'train-005', number: 'TLK 5005', route: 'Lublin - Białystok', type: 'express' },
  ];

  const handleCreateIncident = async () => {
    try {
      const incidentRequest = {
        type: newIncident.type,
        severity: newIncident.severity,
        lineNumber: newIncident.lineNumber,
        description: newIncident.description,
        location: newIncident.location
      };

      await incidentService.createIncident(incidentRequest, currentUser?.id);
      
      await loadData();
      
      setNewIncident({
        type: 'delay' as IncidentType,
        severity: 'medium' as IncidentSeverity,
        lineNumber: '',
        description: '',
        location: { lat: 0, lng: 0, address: '' },
        selectedTrain: ''
      });
      
      setShowCreateForm(false);
      toast.success('Zgłoszenie zostało dodane pomyślnie');
    } catch (error) {
      console.error('Błąd podczas tworzenia zgłoszenia:', error);
      toast.error('Błąd podczas tworzenia zgłoszenia');
    }
  };

  const handleIncidentAction = async (incidentId: string, status: IncidentStatus, notes?: string) => {
    try {
      await incidentService.updateIncident(incidentId, {
        status,
        dispatcherNotes: notes
      }, currentUser?.id);
      
      toast.success(`Zgłoszenie zostało ${status === 'approved' ? 'zatwierdzono' : 'odrzucono'}`);
      loadData();
      setSelectedIncident(null);
    } catch (error) {
      console.error('Błąd podczas aktualizacji zgłoszenia:', error);
      toast.error('Błąd podczas aktualizacji zgłoszenia');
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.lineNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'resolved': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: IncidentStatus) => {
    switch (status) {
      case 'pending': return 'Oczekujące';
      case 'approved': return 'Zatwierdzono';
      case 'rejected': return 'Odrzucono';
      case 'resolved': return 'Rozwiązano';
      default: return status;
    }
  };

  const getTypeLabel = (type: IncidentType) => {
    const labels = {
      delay: 'Opóźnienie',
      breakdown: 'Awaria',
      accident: 'Wypadek',
      construction: 'Roboty',
      power_outage: 'Awaria zasilania',
      maintenance: 'Konserwacja',
      other: 'Inne'
    };
    return labels[type] || type;
  };

  const getSeverityLabel = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'low': return 'NISKIE';
      case 'medium': return 'ŚREDNIE';
      case 'high': return 'WYSOKIE';
      case 'critical': return 'KRYTYCZNE';
      default: return 'NIEZNANE';
    }
  };

  const getStatusLabelBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'pending': return 'OCZEKUJĄCE';
      case 'approved': return 'ZATWIERDZONE';
      case 'rejected': return 'ODRZUCONE';
      case 'resolved': return 'ROZWIĄZANE';
      default: return 'NIEZNANE';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie panelu dyspozytora...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      
      <header className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Train className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel Dyspozytora
                </h1>
                {currentUser && (
                  <span className="text-sm text-orange-600 font-medium">
                    Witaj, {currentUser.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/')}
                className="bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Mapa
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Wyloguj
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Łącznie</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalIncidents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Oczekujące</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingIncidents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Zatwierdzono</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedIncidents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Odrzucono</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejectedIncidents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Śr. czas odpowiedzi</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}min</p>
                </div>
              </div>
            </div>
          </div>
        )}

        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Wyszukaj
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="Szukaj w opisie lub numerze linii..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | 'all')}
                className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              >
                <option value="all">Wszystkie</option>
                <option value="pending">Oczekujące</option>
                <option value="approved">Zatwierdzono</option>
                <option value="rejected">Odrzucono</option>
                <option value="resolved">Rozwiązano</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Ważność
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | 'all')}
                className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              >
                <option value="all">Wszystkie</option>
                <option value="low">Niskie</option>
                <option value="medium">Średnie</option>
                <option value="high">Wysokie</option>
                <option value="critical">Krytyczne</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Dodaj zgłoszenie
              </button>
            </div>
          </div>
        </div>

        
        {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Dodaj nowe zgłoszenie</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Typ zgłoszenia
                </label>
                <select
                  value={newIncident.type}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, type: e.target.value as IncidentType }))}
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="delay">Opóźnienie</option>
                  <option value="breakdown">Awaria</option>
                  <option value="accident">Wypadek</option>
                  <option value="construction">Prace budowlane</option>
                  <option value="power_outage">Awaria zasilania</option>
                  <option value="maintenance">Konserwacja</option>
                  <option value="other">Inne</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Ważność
                </label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, severity: e.target.value as IncidentSeverity }))}
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="low">Niskie</option>
                  <option value="medium">Średnie</option>
                  <option value="high">Wysokie</option>
                  <option value="critical">Krytyczne</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Numer linii
                </label>
                <input
                  type="text"
                  value={newIncident.lineNumber}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, lineNumber: e.target.value }))}
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="np. 1, 14, M1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Wybierz pociąg
                </label>
                <select
                  value={newIncident.selectedTrain}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, selectedTrain: e.target.value }))}
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                >
                  <option value="">Wybierz pociąg</option>
                  {availableTrains.map(train => (
                    <option key={train.id} value={train.number}>
                      {train.number} - {train.route}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Opis zgłoszenia
                </label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 h-24 resize-none"
                  placeholder="Opisz szczegóły zgłoszenia..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Adres/Lokalizacja
                </label>
                <input
                  type="text"
                  value={newIncident.location.address}
                  onChange={(e) => setNewIncident(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  placeholder="np. Dworzec Centralny, ul. Marszałkowska 1"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateIncident}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold"
              >
                Dodaj zgłoszenie
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}

        
        <div className="bg-white rounded-xl shadow-lg border border-orange-100">
          <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100">
            <h2 className="text-xl font-bold text-gray-800">
              Zgłoszenia ({filteredIncidents.length})
            </h2>
          </div>
          
          <div className="divide-y divide-orange-100">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Brak zgłoszeń spełniających kryteria</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => (
                <div key={incident.id} className="p-6 hover:bg-orange-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(incident.severity)}`}>
                          {getSeverityLabel(incident.severity)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.status)}`}>
                          {getStatusLabelBadge(incident.status)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {getTypeLabel(incident.type)}
                        </span>
                        {incident.lineNumber && (
                          <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">
                            Linia {incident.lineNumber}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-900 mb-2">{incident.description}</p>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {incident.createdAt.toLocaleDateString('pl-PL')} {incident.createdAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                        </span>
                      </div>
                      
                      {incident.dispatcherNotes && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <strong>Notatki dyspozytora:</strong> {incident.dispatcherNotes}
                        </div>
                      )}
                    </div>
                    
                    {incident.status === 'pending' && (
                      <div className="flex space-x-3 ml-4">
                        <button
                          onClick={() => handleIncidentAction(incident.id, 'approved', 'Zgłoszenie zatwierdzone przez dyspozytora')}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-md"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Zatwierdź
                        </button>
                        <button
                          onClick={() => handleIncidentAction(incident.id, 'rejected', 'Zgłoszenie odrzucone przez dyspozytora')}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-md"
                        >
                          <XCircle className="w-4 h-4" />
                          Odrzuć
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}