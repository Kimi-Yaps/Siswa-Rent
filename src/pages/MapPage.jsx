import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import MapComponent from '../components/MapComponent';

const MapPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const BurgerButton = !isSidebarOpen ? (
    <button 
      onClick={() => setIsSidebarOpen(true)} 
      style={{
        position: 'absolute',
        top: '60px',
        left: '40px',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <line x1="3" y1="12" x2="21" y2="12"></line>
         <line x1="3" y1="6" x2="21" y2="6"></line>
         <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  ) : null;

  return (
    <main style={{ flex: 1, padding: 0, margin: 0, display: 'flex', width: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {/* Sidebar Push Navigation (ON THE LEFT) */}
      <div style={{
          width: isSidebarOpen ? '300px' : '0px',
          backgroundColor: '#fff',
          transition: 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
          overflow: 'hidden',
          boxShadow: isSidebarOpen ? '2px 0 10px rgba(0,0,0,0.1)' : 'none',
          borderRight: isSidebarOpen ? '1px solid #eee' : 'none',
          flexShrink: 0,
          zIndex: 10
      }}>
         <div style={{ width: '300px', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
               <h2 style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '24px', color: '#1a1a1a' }}>Destinations</h2>
               <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '28px', color: '#1a1a1a', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
            <p style={{ fontFamily: 'Recia, serif', fontSize: '15px', color: '#666' }}>Please select an island target to filter the surrounding availability.</p>
         </div>
      </div>

      {/* Main Map Viewport (Scales Automatically) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'all 0.4s ease', position: 'relative' }}>
        
        {/* Burger Button is floating strictly top left */}
        {BurgerButton}

        {/* Scalable Search Container */}
        <SearchBar />
        
        <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
           <MapComponent height="100%" />
        </div>
      </div>
    </main>
  );
};

export default MapPage;
