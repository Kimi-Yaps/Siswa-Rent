import React from 'react';

const MapComponent = ({ height = '85vh' }) => {
  return (
    <div 
      id="google-map-container" 
      style={{ 
        width: '100%', 
        height: height, 
        minHeight: '400px',
        backgroundColor: 'transparent' // No colored background div
      }}
    >
      {/* Google Maps will inject its interactive map here */}
    </div>
  );
};

export default MapComponent;
