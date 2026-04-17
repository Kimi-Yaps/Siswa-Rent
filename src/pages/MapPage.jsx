import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '../components/SearchBar';
import MapComponent from '../components/MapComponent';
import './MapPage.css';

const dummyHouses = [
  { 
    id: 1, 
    name: 'Pulau Hujung', 
    price: 'RM260 for Night', 
    distance: '21KM From UTM', 
    image: '/Pulau_Tengah_11.webp',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.'
  },
  { 
    id: 2, 
    name: 'Pulau Tengah', 
    price: 'RM350 for Night', 
    distance: '15KM From UTM', 
    image: '/Pulau_Tengah_11.webp',
    description: 'Beautiful serene island getaway. Experience the blue waters and white sands like never before with absolute privacy.'
  },
  { 
    id: 3, 
    name: 'Pulau Rawa', 
    price: 'RM500 for Night', 
    distance: '35KM From UTM', 
    image: '/Pulau_Tengah_11.webp',
    description: 'Premium resort experience wrapped in lush nature. Wake up to the sound of waves and singing birds.'
  }
];

const MapPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const selectedHouse = dummyHouses.find(h => h.id === selectedId);

  const BurgerButton = !isSidebarOpen ? (
    <button 
      className="map-burger-btn"
      onClick={() => setIsSidebarOpen(true)} 
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <line x1="3" y1="12" x2="21" y2="12"></line>
         <line x1="3" y1="6" x2="21" y2="6"></line>
         <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  ) : null;

  return (
    <main style={{ flex: 1, padding: 0, margin: 0, display: 'flex', width: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {/* Sidebar Push Navigation (ON THE LEFT) */}
      <div className={`map-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
         <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: '300px', position: 'relative' }}>
            
            <AnimatePresence mode="wait">
                {!selectedId ? (
                   <motion.div 
                     key="stack"
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }}
                     style={{ position: 'absolute', width: '100%', height: '100%', padding: '40px 20px' }}>
                     
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '24px', color: '#1a1a1a' }}>Destinations</h2>
                        <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '28px', color: '#1a1a1a', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px' }}>
                         {dummyHouses.map((house, index) => (
                            <motion.div
                               key={house.id}
                               layoutId={`card-container-${house.id}`}
                               onClick={() => setSelectedId(house.id)}
                               initial={{ opacity: 0, y: 50 }}
                               animate={{ 
                                 opacity: 1, 
                                 y: 0, 
                               }}
                               exit={{ opacity: 0 }}
                               whileHover={{ y: -5 }}
                               style={{
                                 position: 'relative',
                                 zIndex: dummyHouses.length - index,
                                 marginBottom: '15px',
                                 width: '100%',
                                 height: '110px',
                                 backgroundColor: '#fff',
                                 borderRadius: '16px',
                                 boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
                                 display: 'flex',
                                 alignItems: 'center',
                                 padding: '12px',
                                 boxSizing: 'border-box',
                                 cursor: 'pointer',
                                 border: '1px solid rgba(0,0,0,0.03)'
                               }}
                            >
                               <motion.div layoutId={`image-container-${house.id}`} style={{ width: '86px', height: '86px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#ececec' }}>
                                  {house.image ? (
                                    <motion.img src={house.image} layoutId={`image-${house.id}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px', textAlign: 'center', padding: '5px' }}>
                                      No Image
                                    </div>
                                  )}
                               </motion.div>
                               
                               <div style={{ marginLeft: '16px', flex: 1 }}>
                                  <motion.h4 layoutId={`title-${house.id}`} style={{ margin: '0 0 6px 0', fontFamily: 'Recia, serif', fontSize: '18px', color: '#1a1a1a' }}>{house.name}</motion.h4>
                                  <motion.p layoutId={`price-${house.id}`} style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '13px', color: '#4a4a4a' }}>{house.price}</motion.p>
                                  <motion.p layoutId={`dist-${house.id}`} style={{ margin: '4px 0 0 0', fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#888' }}>{house.distance}</motion.p>
                               </div>
                            </motion.div>
                         ))}
                     </div>
                   </motion.div>
                ) : (
                   <motion.div 
                     key={`details-${selectedHouse.id}`}
                     layoutId={`card-container-${selectedHouse.id}`}
                     style={{ 
                       width: '100%', 
                       height: '100%', 
                       backgroundColor: '#f4f1eb',
                       padding: '24px', 
                       boxSizing: 'border-box',
                       display: 'flex',
                       flexDirection: 'column',
                       position: 'relative',
                       zIndex: 20
                     }}
                   >
                      <button 
                         onClick={() => setSelectedId(null)}
                         style={{
                           position: 'absolute',
                           top: '16px',
                           left: '16px',
                           background: 'rgba(255,255,255,0.8)',
                           backdropFilter: 'blur(4px)',
                           border: 'none',
                           borderRadius: '50%',
                           width: '32px',
                           height: '32px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           cursor: 'pointer',
                           zIndex: 30,
                           boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                         }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                         </svg>
                      </button>

                      <motion.div layoutId={`image-container-${selectedHouse.id}`} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', backgroundColor: '#ececec' }}>
                        {selectedHouse.image ? (
                          <motion.img layoutId={`image-${selectedHouse.id}`} src={selectedHouse.image} alt={selectedHouse.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '16px', flexDirection: 'column' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            No Image Available
                          </div>
                        )}
                      </motion.div>
                      
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <motion.h2 layoutId={`title-${selectedHouse.id}`} style={{ margin: '0 0 8px 0', fontFamily: 'Recia, serif', fontSize: '22px', color: '#1a1a1a' }}>{selectedHouse.name}</motion.h2>
                        <motion.p layoutId={`price-${selectedHouse.id}`} style={{ margin: '0 0 4px 0', fontFamily: 'Recia, serif', fontSize: '14px', color: '#4a4a4a' }}>{selectedHouse.price}</motion.p>
                        <motion.p layoutId={`dist-${selectedHouse.id}`} style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '12px', color: '#888' }}>{selectedHouse.distance}</motion.p>
                      </div>

                      <div>
                        <p style={{ fontFamily: 'Recia, serif', fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1a1a1a' }}>Description:</p>
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          style={{ 
                          fontFamily: 'Arial, sans-serif', 
                          fontSize: '12px', 
                          color: '#555', 
                          lineHeight: '1.6', 
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {selectedHouse.description}
                        </motion.p>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ marginTop: 'auto', paddingTop: '20px' }}
                      >
                        <button 
                          onClick={() => window.location.href = `/details/${selectedHouse.id}`} 
                          style={{
                            width: '100%',
                            backgroundColor: '#7D9E4E',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '14px 0',
                            fontSize: '15px',
                            fontFamily: 'Recia, serif',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            boxShadow: '0 4px 6px rgba(125, 158, 78, 0.2)'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#6c8843'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#7D9E4E'}
                        >
                          View Details
                        </button>
                      </motion.div>
                   </motion.div>
                )}
            </AnimatePresence>
         </div>
      </div>

      {/* Main Map Viewport (Scales Automatically) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'all 0.4s ease', position: 'relative' }}>
        
        {/* Top Controls Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ flexShrink: 0, zIndex: 50 }}>
               {BurgerButton}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
               <SearchBar />
            </div>
        </div>
        
        <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
           <MapComponent height="100%" />
        </div>
      </div>
    </main>
  );
};

export default MapPage;
