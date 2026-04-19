import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './CompareLocations.css';

const SEARCH_RADIUS = 5000; // 5km search radius in meters

// Default fallback locations
const DEFAULT_COMPARISON_POINTS = {
  gas_station: {
    label: 'Gas Station',
    coordinates: { lat: 3.1390, lng: 101.6869 },
    color: '#FFB703',
  },
  utm: {
    label: 'UTM',
    coordinates: { lat: 1.5544, lng: 103.7618 },
    color: '#FB5607',
  },
  mall: {
    label: 'Mall',
    coordinates: { lat: 3.1890, lng: 101.6969 },
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
  const [distance, setDistance] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [nearbyLocation, setNearbyLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    if (window.google?.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_JAVASCRIPT_MAP_API;
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      return;
    }

    const scriptId = 'google-maps-compare-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize map and calculate distance
  useEffect(() => {
    if (!isOpen || !googleMapsLoaded || !mapRef.current || !propertyLocation || !comparisonType) {
      return;
    }

    setLoading(true);

    // Get comparison data (either from nearby search or fallback)
    const getComparisonLocation = async () => {
      let comparisonData = DEFAULT_COMPARISON_POINTS[comparisonType];
      let location = comparisonData.coordinates;
      let label = comparisonData.label;

      // Search for nearest gas station or mall
      if ((comparisonType === 'gas_station' || comparisonType === 'mall') && window.google?.maps) {
        const placeType = comparisonType === 'gas_station' ? 'gas_station' : 'shopping_mall';
        const nearby = await findNearestPlace(window.google, propertyLocation, placeType);
        
        if (nearby) {
          location = nearby.coordinates;
          label = nearby.name || comparisonData.label;
          setNearbyLocation(nearby);
        }
      }

      return { coordinates: location, label, ...comparisonData };
    };

    getComparisonLocation().then((comparisonData) => {
      if (!comparisonData) return;

      // Calculate distance using Haversine formula
      const distanceKm = calculateDistance(
        propertyLocation.lat,
        propertyLocation.lng,
        comparisonData.coordinates.lat,
        comparisonData.coordinates.lng
      );

      // Estimate driving time (roughly 60 km/h average)
      const drivingTimeMinutes = Math.round((distanceKm / 60) * 60);
      const hours = Math.floor(drivingTimeMinutes / 60);
      const minutes = drivingTimeMinutes % 60;
      const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      setDistance({ km: distanceKm.toFixed(2), duration: timeString });

      // Initialize map if not already done
      if (!mapInstance.current) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(propertyLocation);
        bounds.extend(comparisonData.coordinates);

        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 12,
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
        mapInstance.current.panToBounds(bounds);
      }

      // Add markers for both locations
      const propertyMarker = new window.google.maps.Marker({
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

      const comparisonMarker = new window.google.maps.Marker({
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

      // Add info windows
      const propertyInfo = new window.google.maps.InfoWindow({
        content: `<div style="font-family: 'Recia', serif; font-size: 14px; color: #1a1a1a;"><strong>${propertyName || 'Property'}</strong></div>`,
      });
      propertyInfo.open(mapInstance.current, propertyMarker);

      const comparisonInfo = new window.google.maps.InfoWindow({
        content: `<div style="font-family: 'Recia', serif; font-size: 14px; color: #1a1a1a;"><strong>${comparisonData.label}</strong></div>`,
      });
      comparisonInfo.open(mapInstance.current, comparisonMarker);

      // Draw a line between locations
      const polyline = new window.google.maps.Polyline({
        path: [propertyLocation, comparisonData.coordinates],
        geodesic: true,
        strokeColor: '#7D9E4E',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        map: mapInstance.current,
      });

      setLoading(false);

      return () => {
        propertyInfo.close();
        comparisonInfo.close();
        polyline.setMap(null);
      };
    });
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
              <div ref={mapRef} className="compare-map" />
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
