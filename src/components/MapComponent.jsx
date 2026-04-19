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

    houses.forEach((house, index) => {
      const hLat = house.lat !== undefined ? house.lat : house.latitude;
      const hLng = house.lng !== undefined ? house.lng : house.longitude;
      
      if (hLat != null && hLng != null) {
        const position = { lat: Number(hLat), lng: Number(hLng) };
        const isSelected = house.id === selectedId;

        const marker = new window.google.maps.Marker({
          position,
          map,
          title: house.name,
          label: {
            text: String(index + 1),
            color: 'white',
            fontSize: isSelected ? '14px' : '11px',
            fontWeight: 'bold'
          },
          animation: null,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: isSelected ? '#4285F4' : '#7D9E4E',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: isSelected ? 3 : 2,
            scale: isSelected ? 16 : 12
          }
        });

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
         if (targetHouse) {
            const tLat = targetHouse.lat !== undefined ? targetHouse.lat : targetHouse.latitude;
            const tLng = targetHouse.lng !== undefined ? targetHouse.lng : targetHouse.longitude;
            if (tLat != null && tLng != null) {
               map.setCenter({ lat: Number(tLat), lng: Number(tLng) });
               map.setZoom(14);
            } else {
               map.fitBounds(bounds);
            }
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
