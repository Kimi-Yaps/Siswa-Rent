import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './CompareLocations.css';

const SEARCH_RADIUS = 5000; // 5km search radius in meters

// Default fallback locations (JB / Skudai area)
const DEFAULT_COMPARISON_POINTS = {
  gas_station: {
    label: 'Gas Station',
    // Petronas Skudai – central fallback in Skudai area
    coordinates: { lat: 1.5330, lng: 103.6750 },
    color: '#FFB703',
  },
  utm: {
    label: 'UTM',
    // Universiti Teknologi Malaysia, Skudai, Johor
    coordinates: { lat: 1.5594, lng: 103.6389 },
    color: '#FB5607',
  },
  mall: {
    label: 'Mall',
    // AEON Mall Tebrau City, JB
    coordinates: { lat: 1.5735, lng: 103.7894 },
    color: '#7D9E4E',
  },
};

// Calculate distance using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearest place using Places API
const findNearestPlace = (googleMaps, location, placeType) => {
  return new Promise((resolve) => {
    try {
      if (!googleMaps?.maps?.places?.PlacesService) {
        resolve(null);
        return;
      }

      // Create a temporary div for the service
      const tempDiv = document.createElement('div');
      const service = new googleMaps.maps.places.PlacesService(tempDiv);

      const request = {
        location: new googleMaps.maps.LatLng(location.lat, location.lng),
        radius: SEARCH_RADIUS,
        type: placeType,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === googleMaps.maps.places.PlacesServiceStatus.OK && results?.length > 0) {
          const nearest = results[0];
          resolve({
            coordinates: {
              lat: nearest.geometry.location.lat(),
              lng: nearest.geometry.location.lng(),
            },
            name: nearest.name,
            address: nearest.vicinity,
          });
        } else {
          resolve(null);
        }
      });
    } catch (err) {
      console.warn('Places search failed:', err);
      resolve(null);
    }
  });
};

const CompareLocations = ({ isOpen, onClose, propertyLocation, propertyName, comparisonType }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const boundsRef = useRef(null);
  const [distance, setDistance] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [nearbyLocation, setNearbyLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDistance(null);
      setNearbyLocation(null);
      setLoading(false);
      setMapError(null);
      mapInstance.current = null;
    }
  }, [isOpen]);

  // Load Google Maps API
  useEffect(() => {
    // Already loaded
    if (window.google?.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_JAVASCRIPT_MAP_API;
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      setMapError('Map configuration error.');
      return;
    }

    // Check both script IDs (MapComponent uses 'google-maps-script')
    const existingScriptIds = ['google-maps-script', 'google-maps-compare-script'];
    const alreadyLoading = existingScriptIds.find(id => document.getElementById(id));

    if (alreadyLoading) {
      // Script is in DOM but Maps not ready yet — wait for it
      const el = document.getElementById(alreadyLoading);
      const onLoad = () => setGoogleMapsLoaded(true);
      el.addEventListener('load', onLoad, { once: true });
      // In case it loaded between our check and the listener
      if (window.google?.maps) setGoogleMapsLoaded(true);
      return () => el.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.id = 'google-maps-compare-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setGoogleMapsLoaded(true);
    script.onerror = () => setMapError('Failed to load map. Check your connection.');
    document.head.appendChild(script);
  }, []);

  // Initialize map and calculate distance
  useEffect(() => {
    if (!isOpen || !googleMapsLoaded || !mapRef.current || !propertyLocation || !comparisonType) {
      return;
    }

    // Guard: ensure coordinates are valid numbers
    if (isNaN(propertyLocation.lat) || isNaN(propertyLocation.lng)) {
      setMapError('This property has no location coordinates.');
      return;
    }

    setLoading(true);
    setMapError(null);

    let cancelled = false;

    // Get comparison data (either from nearby search or fallback)
    const getComparisonLocation = async () => {
      let comparisonData = DEFAULT_COMPARISON_POINTS[comparisonType];
      let location = comparisonData.coordinates;
      let label = comparisonData.label;

      // Search for nearest gas station or mall
      if ((comparisonType === 'gas_station' || comparisonType === 'mall') && window.google?.maps?.places) {
        const placeType = comparisonType === 'gas_station' ? 'gas_station' : 'shopping_mall';
        const nearby = await findNearestPlace(window.google, propertyLocation, placeType);

        if (nearby && !cancelled) {
          location = nearby.coordinates;
          label = nearby.name || comparisonData.label;
          setNearbyLocation(nearby);
        }
      }

      return { coordinates: location, label, ...comparisonData };
    };

    getComparisonLocation().then((comparisonData) => {
      if (cancelled || !comparisonData || !mapRef.current) return;

      // Calculate straight-line distance using Haversine formula
      const straightLineKm = calculateDistance(
        propertyLocation.lat,
        propertyLocation.lng,
        comparisonData.coordinates.lat,
        comparisonData.coordinates.lng
      );

      // Road distance is typically 1.3–1.4× the straight-line distance
      const distanceKm = straightLineKm * 1.35;

      // Estimate driving time at 30 km/h average (city traffic in JB/Skudai)
      const drivingTimeMinutes = Math.round((distanceKm / 30) * 60);
      const hours = Math.floor(drivingTimeMinutes / 60);
      const minutes = drivingTimeMinutes % 60;
      const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      if (!cancelled) setDistance({ km: straightLineKm.toFixed(2), duration: timeString });

      // Build bounds for fitBounds using the actual resolved location
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(propertyLocation.lat, propertyLocation.lng));
      bounds.extend(new window.google.maps.LatLng(comparisonData.coordinates.lat, comparisonData.coordinates.lng));
      boundsRef.current = bounds;

      // Initialize map fresh (mapInstance.current was reset on open)
      if (!mapInstance.current && mapRef.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 12,
          center: propertyLocation,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstance.current.fitBounds(bounds);

        // Trigger resize after animation completes to ensure tiles fill correctly
        setTimeout(() => {
          if (mapInstance.current && boundsRef.current) {
            window.google.maps.event.trigger(mapInstance.current, 'resize');
            mapInstance.current.fitBounds(boundsRef.current);
          }
        }, 350);
      }

      // Add markers for both locations
      new window.google.maps.Marker({
        position: propertyLocation,
        map: mapInstance.current,
        title: propertyName || 'Property',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#7D9E4E',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
      });

      new window.google.maps.Marker({
        position: comparisonData.coordinates,
        map: mapInstance.current,
        title: comparisonData.label,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: comparisonData.color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
      });

      // Draw a line between locations
      new window.google.maps.Polyline({
        path: [propertyLocation, comparisonData.coordinates],
        geodesic: true,
        strokeColor: '#7D9E4E',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        map: mapInstance.current,
      });

      if (!cancelled) setLoading(false);
    }).catch((err) => {
      console.error('CompareLocations error:', err);
      if (!cancelled) {
        setLoading(false);
        setMapError('Could not load map. Please try again.');
      }
    });

    return () => { cancelled = true; };
  }, [isOpen, googleMapsLoaded, propertyLocation, comparisonType, propertyName]);

  if (!isOpen) return null;

  const defaultData = DEFAULT_COMPARISON_POINTS[comparisonType];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="compare-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
          />

        {/* Modal */}
<motion.div
  className="compare-modal"
  style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
            {/* Header */}
            <div className="compare-header">
              <div className="compare-title-section">
                <h2 className="compare-title">Compare Distance</h2>
                <p className="compare-subtitle">
                  Distance from {propertyName} to {defaultData?.label}
                </p>
              </div>
              <button className="compare-close-btn" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>

            {/* Map Container */}
            <div className="compare-map-container">
              {mapError ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', color: '#888', fontFamily: 'Arial, sans-serif', fontSize: '14px', padding: '20px', boxSizing: 'border-box' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ margin: 0, textAlign: 'center', color: '#999' }}>{mapError}</p>
                </div>
              ) : (
                <div ref={mapRef} className="compare-map" />
              )}
            </div>

            {/* Distance Info */}
            {distance && (
              <motion.div
                className="compare-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="info-item property-item">
                  <div className="info-details">
                    <p className="info-label">Property</p>
                    <p className="info-value">{propertyName}</p>
                  </div>
                </div>

                <div className="distance-divider">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                </div>

                <div className="info-item comparison-item">
                  <span className="info-icon">{defaultData?.icon}</span>
                  <div className="info-details">
                    <p className="info-label">{nearbyLocation?.name || defaultData?.label}</p>
                    <p className="info-value">
                      <strong>{distance.km} km</strong>
                      <span className="duration-text">({distance.duration})</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="compare-loading">
                <div className="spinner"></div>
                <p>Finding nearest location...</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default CompareLocations;
