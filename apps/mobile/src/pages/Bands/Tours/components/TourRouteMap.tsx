/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  alertCircleOutline,
  locationOutline,
  navigateOutline,
  refreshOutline,
} from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { glassCard, TEAL } from '../lib/styles';
import {
  formatDriveTime,
  getDriveWarningColor,
  getDriveWarningLevel,
  getTotalDriveTime,
  getTotalTourMiles,
  isMapboxConfigured,
} from '../lib/mapbox';
import type { TourStopWithFinancials } from '../types/tourTypes';

// Mapbox GL JS is loaded via CDN to avoid build issues
declare const mapboxgl: any;

type Props = {
  stops: TourStopWithFinancials[];
  onStopClick?: (stopId: string) => void;
  onCalculateRoutes?: () => Promise<void>;
  isCalculating?: boolean;
};

// Amplee dark map style - using Mapbox dark style with customizations
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

export function TourRouteMap({ stops, onStopClick, onCalculateRoutes, isCalculating }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter stops with coordinates, sorted by date
  const stopsWithCoords = stops
    .filter((s) => s.venue_lat != null && s.venue_lng != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Stops without coordinates
  const stopsNeedingGeocode = stops.filter(
    (s) => s.venue_lat == null || s.venue_lng == null
  );

  // Calculate totals
  const totalMiles = getTotalTourMiles(stops);
  const totalDriveTime = getTotalDriveTime(stops);

  // Check for long drives
  const longDrives = stops.filter(
    (s) => s.distance_to_next_miles && getDriveWarningLevel(s.distance_to_next_miles) !== 'none'
  );

  useEffect(() => {
    if (!mapContainer.current) return;
    if (!isMapboxConfigured()) {
      setMapError('Mapbox not configured. Add VITE_MAPBOX_TOKEN to enable maps.');
      return;
    }
    if (stopsWithCoords.length === 0) {
      return;
    }

    // Check if mapboxgl is available (loaded via CDN in index.html)
    if (typeof mapboxgl === 'undefined') {
      setMapError('Mapbox GL JS not loaded. Please check your internet connection.');
      return;
    }

    // Set the access token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [stopsWithCoords[0].venue_lng, stopsWithCoords[0].venue_lat],
      zoom: 4,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add route line if we have multiple stops
      if (stopsWithCoords.length > 1) {
        const routeCoords = stopsWithCoords.map((s) => [s.venue_lng!, s.venue_lat!]);

        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoords,
            },
          },
        });

        // Route line glow effect
        map.current.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': TEAL.primary,
            'line-width': 8,
            'line-opacity': 0.3,
            'line-blur': 3,
          },
        });

        // Main route line
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': TEAL.primary,
            'line-width': 3,
            'line-opacity': 0.9,
          },
        });
      }

      // Add markers for each stop
      stopsWithCoords.forEach((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stopsWithCoords.length - 1;

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'tour-stop-marker';
        el.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${isFirst || isLast ? TEAL.primary : 'rgba(217, 119, 87, 0.9)'};
            border: 3px solid #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.2s;
          ">${index + 1}</div>
        `;

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        if (onStopClick) {
          el.addEventListener('click', () => onStopClick(stop.id));
        }

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          className: 'amplee-popup',
        }).setHTML(`
          <div style="
            background: rgba(8, 8, 14, 0.95);
            padding: 12px;
            border-radius: 8px;
            min-width: 180px;
          ">
            <div style="font-weight: 700; color: #f9fafb; margin-bottom: 4px;">
              ${stop.venue_name}
            </div>
            <div style="font-size: 12px; color: #9ca3af;">
              ${[stop.venue_city, stop.venue_state].filter(Boolean).join(', ')}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
              ${new Date(stop.date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            ${stop.distance_to_next_miles ? `
              <div style="
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255,255,255,0.1);
                font-size: 11px;
                color: ${getDriveWarningColor(stop.distance_to_next_miles)};
              ">
                Next stop: ${stop.distance_to_next_miles} mi
                ${stop.drive_time_to_next_minutes ? ` • ${formatDriveTime(stop.drive_time_to_next_minutes)}` : ''}
              </div>
            ` : ''}
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([stop.venue_lng!, stop.venue_lat!])
          .setPopup(popup)
          .addTo(map.current);
      });

      // Fit bounds to show all stops
      if (stopsWithCoords.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        stopsWithCoords.forEach((stop) => {
          bounds.extend([stop.venue_lng!, stop.venue_lat!]);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [stopsWithCoords.length]);

  // No coordinates available
  if (stopsWithCoords.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: TEAL.subtle,
            border: `1px solid ${TEAL.border}`,
            display: 'grid',
            placeItems: 'center',
            marginBottom: 16,
          }}
        >
          <IonIcon icon={locationOutline} style={{ fontSize: 28, color: TEAL.light }} />
        </div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
          No locations mapped
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', maxWidth: 280 }}>
          Add venue addresses to your tour stops to see the route map and calculate mileage.
        </p>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'grid',
            placeItems: 'center',
            marginBottom: 16,
          }}
        >
          <IonIcon icon={alertCircleOutline} style={{ fontSize: 28, color: '#f87171' }} />
        </div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#e5e7eb', marginBottom: 8 }}>
          Map unavailable
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280', maxWidth: 280 }}>
          {mapError}
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tour Stats Bar */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(8, 8, 14, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Total Miles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IonIcon icon={navigateOutline} style={{ fontSize: 16, color: TEAL.light }} />
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>
              Total Miles
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb' }}>
              {Math.round(totalMiles).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Drive Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: TEAL.subtle,
              display: 'grid',
              placeItems: 'center',
              fontSize: 10,
              color: TEAL.light,
            }}
          >
            🚐
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>
              Drive Time
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb' }}>
              {totalDriveTime.hours}h {totalDriveTime.minutes}m
            </div>
          </div>
        </div>

        {/* Stops */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IonIcon icon={locationOutline} style={{ fontSize: 16, color: TEAL.light }} />
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>
              Stops
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb' }}>
              {stopsWithCoords.length}
            </div>
          </div>
        </div>

        {/* Long Drive Warning */}
        {longDrives.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
            }}
          >
            <IonIcon icon={alertCircleOutline} style={{ fontSize: 14, color: '#eab308' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#eab308' }}>
              {longDrives.length} long {longDrives.length === 1 ? 'drive' : 'drives'}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Calculate Routes Button */}
        {onCalculateRoutes && (stopsNeedingGeocode.length > 0 || totalMiles === 0) && (
          <button
            onClick={onCalculateRoutes}
            disabled={isCalculating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: TEAL.primary,
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              opacity: isCalculating ? 0.6 : 1,
              cursor: isCalculating ? 'wait' : 'pointer',
            }}
          >
            {isCalculating ? (
              <>
                <IonSpinner style={{ '--color': '#fff', width: 14, height: 14 }} />
                Calculating...
              </>
            ) : (
              <>
                <IonIcon icon={navigateOutline} style={{ fontSize: 14 }} />
                Calculate Routes
              </>
            )}
          </button>
        )}
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div
          ref={mapContainer}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        {!mapLoaded && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#050509',
            }}
          >
            <IonSpinner style={{ '--color': TEAL.light }} />
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(8, 8, 14, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          color: '#6b7280',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: TEAL.primary,
              border: '2px solid #fff',
            }}
          />
          <span>Start/End</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'rgba(217, 119, 87, 0.9)',
              border: '2px solid #fff',
            }}
          />
          <span>Stop</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 20,
              height: 3,
              background: TEAL.primary,
              borderRadius: 2,
            }}
          />
          <span>Route</span>
        </div>
      </div>

      {/* Custom popup styles */}
      <style>{`
        .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: rgba(8, 8, 14, 0.95) !important;
        }
      `}</style>
    </div>
  );
}
