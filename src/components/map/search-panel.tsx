import { MapPin, Train } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { type GeocodingResult, nominatimClient } from '@/infrastructure/geocoding/nominatim-client';
import { type LatLng } from '@/infrastructure/routing/osrm-client';
import { krakowStops, GTFSStop } from '@/infrastructure/gtfs/gtfs-data';

interface SearchPanelProps {
  onLocationSelect: (location: LatLng, name: string) => void;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  selectedTransport?: 'bus' | 'train' | 'bike';
}

export function SearchPanel({ onLocationSelect, placeholder, value, onChange, selectedTransport }: SearchPanelProps) {
  console.log('🔍 SearchPanel: render', { value, placeholder, selectedTransport });
  const [suggestions, setSuggestions] = useState<(GeocodingResult | GTFSStop)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchLocations = useCallback(async (query: string) => {
    console.log('🔍 SearchPanel: searchLocations called', { query, selectedTransport });
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      let results: (GeocodingResult | GTFSStop)[] = [];

      
      if (selectedTransport === 'train') {
        const trainStops = krakowStops
          .filter(stop => stop.type === 'train')
          .filter(stop => stop.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);
        results = trainStops;
        console.log('🚂 SearchPanel: train stops found', { trainStops });
      } else {
        
        const geocodingResults = await nominatimClient.search(query);
        results = geocodingResults;
        
        
        if (selectedTransport === 'bus') {
          const busAndTramStops = krakowStops
            .filter(stop => stop.type === 'bus' || stop.type === 'tram' || stop.type === 'both')
            .filter(stop => stop.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3);
          results = [...busAndTramStops, ...geocodingResults].slice(0, 8);
        }
      }
      
      console.log('🔍 SearchPanel: search results', { results, selectedTransport });
      setSuggestions(results);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTransport]);

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

  const handleSuggestionClick = (suggestion: GeocodingResult | GTFSStop) => {
    console.log('🔍 SearchPanel: handleSuggestionClick called', { suggestion });
    const location: LatLng = {
      lat: suggestion.lat,
      lng: suggestion.lng,
    };
    
    
    const name = 'display_name' in suggestion ? suggestion.display_name : suggestion.name;
    
    console.log('🔍 SearchPanel: calling onLocationSelect', { location, name });
    onLocationSelect(location, name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          console.log('🔍 SearchPanel: input onChange', { value: e.target.value });
          onChange(e.target.value);
        }}
        onFocus={() => {
          console.log('🔍 SearchPanel: input onFocus');
          setShowSuggestions(true);
        }}
        onBlur={() => {
          console.log('🔍 SearchPanel: input onBlur');
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        placeholder={placeholder}
        className="w-full text-sm placeholder:text-black/50 text-black focus:outline-none"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const isTrainStop = 'type' in suggestion && suggestion.type === 'train';
            const displayName = 'display_name' in suggestion ? suggestion.display_name : suggestion.name;
            const subtitle = 'display_name' in suggestion 
              ? suggestion.display_name.split(',').slice(1).join(',').trim()
              : `Przystanek kolejowy • Linie: ${suggestion.lines.join(', ')}`;
            
            return (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl">
                <div className="flex items-start gap-3">
                  {isTrainStop ? (
                    <Train className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {'display_name' in suggestion ? displayName.split(',')[0] : displayName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {subtitle}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
