import React, { useState } from 'react';
import { Button } from '@/ui/button';
import { toast } from 'sonner';
import { 
  CircleQuestionMark, 
  Hourglass, 
  Pin, 
  Clock, 
  MoveRight,
  AlertTriangle,
  Construction,
  Zap,
  Car
} from 'lucide-react';
import { incidentService } from '@/services/incidentService';
import { IncidentType, IncidentSeverity, CreateIncidentRequest } from '@/types/dispatcher.types';

interface IncidentReportFormProps {
  onSubmit?: (incident: CreateIncidentRequest) => void;
  onClose?: () => void;
  initialLocation?: { lat: number; lng: number };
  initialLocationName?: string;
}

const incidentTypes: { value: IncidentType; label: string; icon: React.ReactNode }[] = [
  { value: 'delay', label: 'Opóźnienie', icon: <Clock className="w-4 h-4" /> },
  { value: 'breakdown', label: 'Awaria pojazdu', icon: <Car className="w-4 h-4" /> },
  { value: 'accident', label: 'Wypadek', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'construction', label: 'Roboty drogowe', icon: <Construction className="w-4 h-4" /> },
  { value: 'power_outage', label: 'Awaria zasilania', icon: <Zap className="w-4 h-4" /> },
  { value: 'other', label: 'Inne', icon: <CircleQuestionMark className="w-4 h-4" /> }
];

const severityLevels: { value: IncidentSeverity; label: string; color: string }[] = [
  { value: 'low', label: 'Niskie', color: 'text-green-600' },
  { value: 'medium', label: 'Średnie', color: 'text-yellow-600' },
  { value: 'high', label: 'Wysokie', color: 'text-orange-600' },
  { value: 'critical', label: 'Krytyczne', color: 'text-red-600' }
];

export function IncidentReportForm({ 
  onSubmit, 
  onClose, 
  initialLocation, 
  initialLocationName 
}: IncidentReportFormProps) {
  const [formData, setFormData] = useState<Partial<CreateIncidentRequest>>({
    type: undefined,
    severity: 'medium',
    location: initialLocation || { lat: 50.0647, lng: 19.9450 }, 
    description: '',
    lineNumber: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSeverityDropdown, setShowSeverityDropdown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.description) {
      toast.error('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    setIsSubmitting(true);

    try {
      const incidentData: CreateIncidentRequest = {
        type: formData.type,
        severity: formData.severity || 'medium',
        location: formData.location!,
        description: formData.description,
        lineNumber: formData.lineNumber
      };

      const newIncident = await incidentService.createIncident(incidentData);
      
      toast.success('Zgłoszenie zostało wysłane pomyślnie!');
      
      if (onSubmit) {
        onSubmit(incidentData);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Błąd podczas wysyłania zgłoszenia:', error);
      toast.error('Wystąpił błąd podczas wysyłania zgłoszenia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIncidentType = incidentTypes.find(type => type.value === formData.type);
  const selectedSeverity = severityLevels.find(severity => severity.value === formData.severity);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
      
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Typ zdarzenia *
        </label>
        <div 
          className="py-2 px-3 flex items-center gap-x-2 bg-[#F5F5F5] rounded-lg cursor-pointer"
          onClick={() => setShowTypeDropdown(!showTypeDropdown)}
        >
          {selectedIncidentType ? (
            <>
              {selectedIncidentType.icon}
              <span className="text-black/70">{selectedIncidentType.label}</span>
            </>
          ) : (
            <>
              <CircleQuestionMark className="text-black/50" />
              <span className="text-black/50">Wybierz rodzaj zdarzenia</span>
            </>
          )}
        </div>
        
        {showTypeDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {incidentTypes.map((type) => (
              <div
                key={type.value}
                className="py-2 px-3 flex items-center gap-x-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setFormData({ ...formData, type: type.value });
                  setShowTypeDropdown(false);
                }}
              >
                {type.icon}
                <span>{type.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ważność
        </label>
        <div 
          className="py-2 px-3 flex items-center gap-x-2 bg-[#F5F5F5] rounded-lg cursor-pointer"
          onClick={() => setShowSeverityDropdown(!showSeverityDropdown)}
        >
          <AlertTriangle className="text-black/50" />
          <span className={selectedSeverity?.color || 'text-black/70'}>
            {selectedSeverity?.label || 'Wybierz ważność'}
          </span>
        </div>
        
        {showSeverityDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {severityLevels.map((severity) => (
              <div
                key={severity.value}
                className="py-2 px-3 flex items-center gap-x-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setFormData({ ...formData, severity: severity.value });
                  setShowSeverityDropdown(false);
                }}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className={severity.color}>{severity.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      
      <label className="py-2 px-3 flex items-center gap-x-2 bg-[#F5F5F5] rounded-lg">
        <Pin className="text-black/50" />
        <input
          className="text-black/70 placeholder:text-black/50 focus:outline-none w-full bg-transparent"
          placeholder="Numer linii (np. IC 1001, REG 5401)"
          value={formData.lineNumber || ''}
          onChange={(e) => setFormData({ ...formData, lineNumber: e.target.value })}
        />
      </label>

      
      <textarea
        placeholder="Opis zdarzenia... *"
        className="resize-none py-2 px-3 bg-[#F5F5F5] rounded-lg text-black/70 placeholder:text-black/50 focus:outline-none"
        rows={3}
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        required
      />

      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-[#FFA633] hover:bg-[#FF9520] disabled:opacity-50 flex items-center justify-center gap-x-2"
      >
        {isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'} 
        <MoveRight className="size-4" />
      </Button>
    </form>
  );
}