import React, { useEffect, useRef, useState } from 'react';

const MapComponent = ({ height = '85vh', houses = [], selectedId = null, onMarkerClick = () => {} }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

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

    const scriptId = 'google-maps-script';
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

  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current) return;

    if (!mapInstance.current) {
      // Initialize map
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 3.1390, lng: 101.6869 }, // Default to KL
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      });
    }

    const map = mapInstance.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidMarkers = false;

    houses.forEach((house) => {
      if (typeof house.latitude === 'number' && typeof house.longitude === 'number') {
        const position = { lat: house.latitude, lng: house.longitude };
        const isSelected = house.id === selectedId;

        const marker = new window.google.maps.Marker({
          position,
          map,
          title: house.name,
          animation: isSelected ? window.google.maps.Animation.BOUNCE : null,
          icon: isSelected 
             ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
             : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });

        if (isSelected) {
          // Stop bouncing after 3 seconds so it's not annoying
          setTimeout(() => {
             if (marker.getMap()) marker.setAnimation(null);
          }, 3000);
        }

        marker.addListener('click', () => {
          onMarkerClick(house.id);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
        hasValidMarkers = true;
      }
    });

    if (hasValidMarkers) {
      if (houses.length === 1 || selectedId) {
         // If there's only one marker or a selected one, we center and optionally adjust zoom
         const targetId = selectedId || houses[0].id;
         const targetHouse = houses.find(h => h.id === targetId);
         if (targetHouse && typeof targetHouse.latitude === 'number') {
            map.setCenter({ lat: targetHouse.latitude, lng: targetHouse.longitude });
            map.setZoom(14);
         } else {
            map.fitBounds(bounds);
         }
      } else {
         map.fitBounds(bounds);
      }
    }
  }, [googleMapsLoaded, houses, selectedId, onMarkerClick]);

  return (
    <div 
      ref={mapRef}
      id="google-map-container" 
      style={{ 
        width: '100%', 
        height: height, 
        minHeight: '400px',
        backgroundColor: '#e5e3df',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}
    >
      {/* Google Maps will inject its interactive map here */}
    </div>
  );
};

export default MapComponent;
