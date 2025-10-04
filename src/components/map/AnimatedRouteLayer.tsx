import React, { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { MultiModalRoute, RouteSegment } from '../../types/routing.types';

interface AnimatedRouteLayerProps {
  route: MultiModalRoute | null;
  animate?: boolean;
  animationSpeed?: number;
  showSegmentLabels?: boolean;
  onSegmentClick?: (segment: RouteSegment) => void;
  onAnimationComplete?: () => void;
}

export const AnimatedRouteLayer: React.FC<AnimatedRouteLayerProps> = ({
  route,
  animate = true,
  animationSpeed = 1000,
  showSegmentLabels = true,
  onSegmentClick,
  onAnimationComplete
}) => {
  const map = useMap();
  const [animationProgress, setAnimationProgress] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const animationRef = useRef<number | null>(null);

  
  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };
  }, [map]);

  
  useEffect(() => {
    if (route && route.segments.length > 0) {
      startAnimation();
    } else {
      clearRoute();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [route]);

  const startAnimation = () => {
    if (!route || !layerGroupRef.current) return;

    setIsAnimating(true);
    setAnimationProgress(0);
    setCurrentSegmentIndex(0);
    layerGroupRef.current.clearLayers();

    animateRoute();
  };

  const animateRoute = () => {
    if (!route || !layerGroupRef.current) return;

    const totalSegments = route.segments.length;
    const segmentDuration = animationSpeed / totalSegments;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationSpeed, 1);
      
      setAnimationProgress(progress);

      const currentSegment = Math.floor(progress * totalSegments);
      setCurrentSegmentIndex(currentSegment);

      
      drawSegmentsUpTo(currentSegment, progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        onAnimationComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const drawSegmentsUpTo = (segmentIndex: number, totalProgress: number) => {
    if (!route || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    route.segments.forEach((segment, index) => {
      if (index <= segmentIndex) {
        const isCurrentSegment = index === segmentIndex;
        const segmentProgress = isCurrentSegment 
          ? (totalProgress * route.segments.length) % 1 
          : 1;

        drawSegment(segment, segmentProgress, index);
      }
    });
  };

  const drawSegment = (segment: RouteSegment, progress: number, index: number) => {
    if (!layerGroupRef.current || !segment.geometry) return;

    const coordinates = segment.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
    
    if (coordinates.length < 2) return;

    
    const pointsToShow = Math.max(2, Math.floor(coordinates.length * progress));
    const visibleCoordinates = coordinates.slice(0, pointsToShow);

    
    const style = getSegmentStyle(segment, index);

    
    const polyline = L.polyline(visibleCoordinates, style);
    
    
    polyline.on('click', () => onSegmentClick?.(segment));
    
    
    polyline.bindTooltip(getSegmentTooltip(segment), {
      sticky: true,
      className: 'route-segment-tooltip'
    });

    layerGroupRef.current.addLayer(polyline);

    
    if ((segment.type === 'bus' || segment.type === 'tram') && progress === 1) {
      addTransferMarkers(segment, index);
    }

    
    if (showSegmentLabels && progress > 0.5) {
      addSegmentLabel(segment, visibleCoordinates, index);
    }

    
    if ((segment.type === 'bus' || segment.type === 'tram') && progress > 0.3) {
      addMovingVehicleIcon(segment, visibleCoordinates, progress);
    }
  };

  const getSegmentStyle = (segment: RouteSegment, index: number) => {
    const baseStyle = {
      weight: 6,
      opacity: 0.8,
      lineCap: 'round' as const,
      lineJoin: 'round' as const
    };

    switch (segment.type) {
      case 'walking':
        return {
          ...baseStyle,
          color: '#6b7280',
          dashArray: '10, 5',
          weight: 4
        };
      case 'bus':
      case 'tram':
        return {
          ...baseStyle,
          color: segment.routeColor || (segment.type === 'tram' ? '#3b82f6' : '#10b981'),
          weight: 8
        };
      default:
        return {
          ...baseStyle,
          color: '#8b5cf6'
        };
    }
  };

  const getSegmentTooltip = (segment: RouteSegment): string => {
    switch (segment.type) {
      case 'walking':
        return `🚶 Marsz: ${Math.round(segment.distance)}m (${segment.duration}min)`;
      case 'bus':
        return `🚌 Linia ${segment.lineNumber}: ${Math.round(segment.distance)}m (${segment.duration}min)`;
      case 'tram':
        return `🚋 Linia ${segment.lineNumber}: ${Math.round(segment.distance)}m (${segment.duration}min)`;
      default:
        return `Segment: ${Math.round(segment.distance)}m (${segment.duration}min)`;
    }
  };

  const addTransferMarkers = (segment: RouteSegment, index: number) => {
    if (!layerGroupRef.current || (segment.type !== 'bus' && segment.type !== 'tram')) return;

    
    if (segment.startStop) {
      const startMarker = L.circleMarker([segment.startStop.lat, segment.startStop.lng], {
        radius: 8,
        fillColor: '#ffffff',
        color: segment.routeColor || '#3b82f6',
        weight: 3,
        fillOpacity: 1
      });
      
      startMarker.bindTooltip(`🚏 ${segment.startStop.name}`, { permanent: false });
      layerGroupRef.current.addLayer(startMarker);
    }

    
    if (segment.endStop) {
      const endMarker = L.circleMarker([segment.endStop.lat, segment.endStop.lng], {
        radius: 8,
        fillColor: '#ffffff',
        color: segment.routeColor || '#3b82f6',
        weight: 3,
        fillOpacity: 1
      });
      
      endMarker.bindTooltip(`🚏 ${segment.endStop.name}`, { permanent: false });
      layerGroupRef.current.addLayer(endMarker);
    }
  };

  const addSegmentLabel = (segment: RouteSegment, coordinates: [number, number][], index: number) => {
    if (!layerGroupRef.current || coordinates.length < 2) return;

    
    const midIndex = Math.floor(coordinates.length / 2);
    const midPoint = coordinates[midIndex];

    let labelText = '';
    let labelClass = 'route-segment-label';

    switch (segment.type) {
      case 'walking':
        labelText = `🚶 ${segment.duration}min`;
        labelClass += ' walking-label';
        break;
      case 'bus':
        labelText = `🚌 ${segment.lineNumber}`;
        labelClass += ' transit-label';
        break;
      case 'tram':
        labelText = `🚋 ${segment.lineNumber}`;
        labelClass += ' transit-label';
        break;
    }

    if (labelText) {
      const labelIcon = L.divIcon({
        html: `<div class="${labelClass}">${labelText}</div>`,
        className: 'route-label-container',
        iconSize: [60, 20],
        iconAnchor: [30, 10]
      });

      const labelMarker = L.marker(midPoint, { icon: labelIcon });
      layerGroupRef.current.addLayer(labelMarker);
    }
  };

  const addMovingVehicleIcon = (segment: RouteSegment, coordinates: [number, number][], progress: number) => {
    if (!layerGroupRef.current || (segment.type !== 'bus' && segment.type !== 'tram') || coordinates.length < 2) return;

    
    const vehicleIndex = Math.floor((coordinates.length - 1) * progress);
    const vehiclePosition = coordinates[Math.min(vehicleIndex, coordinates.length - 1)];

    
    let bearing = 0;
    if (vehicleIndex < coordinates.length - 1) {
      const current = coordinates[vehicleIndex];
      const next = coordinates[vehicleIndex + 1];
      bearing = Math.atan2(next[1] - current[1], next[0] - current[0]) * 180 / Math.PI;
    }

    const vehicleIcon = L.divIcon({
      html: `
        <div class="moving-vehicle-icon" style="
          transform: rotate(${bearing}deg);
          background: ${segment.routeColor || '#3b82f6'};
        ">
          ${segment.type === 'tram' ? '🚋' : '🚌'}
        </div>
      `,
      className: 'moving-vehicle-container',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const vehicleMarker = L.marker(vehiclePosition, { icon: vehicleIcon });
    layerGroupRef.current.addLayer(vehicleMarker);
  };

  const clearRoute = () => {
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    }
    setAnimationProgress(0);
    setCurrentSegmentIndex(0);
    setIsAnimating(false);
  };

  
  const AnimationControls = () => (
    <AnimatePresence>
      {route && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000]"
        >
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-4">
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Postęp trasy</span>
                <span>{Math.round(animationProgress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${animationProgress * 100}%` }}
                />
              </div>
            </div>

            {route.segments[currentSegmentIndex] && (
              <div className="text-sm">
                <div className="font-medium">
                  {route.segments[currentSegmentIndex].type === 'walking' ? '🚶 Marsz' : 
                   `${route.segments[currentSegmentIndex].type === 'tram' ? '🚋' : '🚌'} Linia ${route.segments[currentSegmentIndex].lineNumber || ''}`}
                </div>
                <div className="text-gray-600">
                  {route.segments[currentSegmentIndex].duration}min
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={startAnimation}
                disabled={isAnimating}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isAnimating ? 'Animacja...' : 'Powtórz'}
              </button>
              <button
                onClick={clearRoute}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Wyczyść
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return <AnimationControls />;
};


export const routeLayerStyles = `
  .route-segment-tooltip {
    background: rgba(0, 0, 0, 0.8) !important;
    border: none !important;
    border-radius: 6px !important;
    color: white !important;
    font-size: 12px !important;
    padding: 6px 10px !important;
  }

  .route-label-container {
    background: none !important;
    border: none !important;
  }

  .route-segment-label {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
  }

  .walking-label {
    background: rgba(107, 114, 128, 0.95);
    color: white;
    border-color: #6b7280;
  }

  .transit-label {
    background: rgba(59, 130, 246, 0.95);
    color: white;
    border-color: #3b82f6;
  }

  .moving-vehicle-container {
    background: none !important;
    border: none !important;
  }

  .moving-vehicle-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
  }

  .moving-vehicle-icon:hover {
    transform: scale(1.1);
  }
`;