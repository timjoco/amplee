/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import {
  calculateTourRoutes,
  geocodeAddress,
  isMapboxConfigured,
} from '../lib/mapbox';
import type { TourStopWithFinancials } from '../types/tourTypes';

/**
 * Hook for geocoding tour stops and calculating routes
 */
export function useTourGeocode() {
  /**
   * Geocode a single stop and update its coordinates in the database
   */
  const geocodeStop = useCallback(
    async (stop: {
      id: string;
      venue_name: string;
      venue_address?: string | null;
      venue_city?: string | null;
      venue_state?: string | null;
      venue_country?: string | null;
    }): Promise<{ lat: number; lng: number } | null> => {
      if (!isMapboxConfigured()) {
        console.warn('[useTourGeocode] Mapbox not configured');
        return null;
      }

      // Build address for geocoding
      const addressParts = [
        stop.venue_name,
        stop.venue_address,
        stop.venue_city,
        stop.venue_state,
        stop.venue_country || 'USA', // Default to USA
      ].filter(Boolean);

      if (addressParts.length < 2) {
        console.warn('[useTourGeocode] Not enough address info to geocode');
        return null;
      }

      const result = await geocodeAddress(
        stop.venue_address || stop.venue_name,
        stop.venue_city,
        stop.venue_state,
        stop.venue_country
      );

      if (!result) {
        return null;
      }

      // Update the stop with coordinates
      const { error } = await supabase
        .from('tour_stops')
        .update({
          venue_lat: result.coordinates.lat,
          venue_lng: result.coordinates.lng,
        })
        .eq('id', stop.id);

      if (error) {
        console.error('[useTourGeocode] Failed to update stop coordinates:', error);
        return null;
      }

      return result.coordinates;
    },
    []
  );

  /**
   * Geocode all stops in a tour that don't have coordinates yet
   */
  const geocodeTourStops = useCallback(
    async (
      stops: TourStopWithFinancials[]
    ): Promise<Map<string, { lat: number; lng: number }>> => {
      const results = new Map<string, { lat: number; lng: number }>();

      for (const stop of stops) {
        // Skip if already has coordinates
        if (stop.venue_lat != null && stop.venue_lng != null) {
          results.set(stop.id, { lat: stop.venue_lat, lng: stop.venue_lng });
          continue;
        }

        const coords = await geocodeStop(stop);
        if (coords) {
          results.set(stop.id, coords);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      return results;
    },
    [geocodeStop]
  );

  /**
   * Calculate and save routes between all stops in a tour
   */
  const calculateAndSaveRoutes = useCallback(
    async (stops: TourStopWithFinancials[]): Promise<void> => {
      if (!isMapboxConfigured()) {
        return;
      }

      // Get stops with coordinates
      const stopsWithCoords = stops.filter(
        (s) => s.venue_lat != null && s.venue_lng != null
      );

      if (stopsWithCoords.length < 2) {
        return;
      }

      // Calculate routes
      const routes = await calculateTourRoutes(
        stopsWithCoords.map((s) => ({
          id: s.id,
          venue_lat: s.venue_lat,
          venue_lng: s.venue_lng,
          date: s.date,
        }))
      );

      // Update each stop with its route info
      for (const [stopId, route] of routes) {
        const { error } = await supabase
          .from('tour_stops')
          .update({
            distance_to_next_miles: route.distanceMiles,
            drive_time_to_next_minutes: route.durationMinutes,
          })
          .eq('id', stopId);

        if (error) {
          console.error('[useTourGeocode] Failed to update route:', error);
        }
      }

      // Clear the last stop's route info (no next stop)
      const sortedStops = [...stopsWithCoords].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const lastStop = sortedStops[sortedStops.length - 1];

      await supabase
        .from('tour_stops')
        .update({
          distance_to_next_miles: null,
          drive_time_to_next_minutes: null,
        })
        .eq('id', lastStop.id);
    },
    []
  );

  /**
   * Full geocode and route calculation for a tour
   */
  const processAllStops = useCallback(
    async (stops: TourStopWithFinancials[]): Promise<void> => {
      if (!isMapboxConfigured() || stops.length === 0) {
        return;
      }

      // First, geocode any stops missing coordinates
      await geocodeTourStops(stops);

      // Then calculate routes
      await calculateAndSaveRoutes(stops);
    },
    [geocodeTourStops, calculateAndSaveRoutes]
  );

  return {
    geocodeStop,
    geocodeTourStops,
    calculateAndSaveRoutes,
    processAllStops,
    isConfigured: isMapboxConfigured(),
  };
}
