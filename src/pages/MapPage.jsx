import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '../components/SearchBar';
import MapComponent from '../components/MapComponent';
import { supabase } from '../components/supabaseClient';
import './MapPage.css';

const MapPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [sessionUser, setSessionUser] = useState(null);

  const fetchHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*');

      if (error) throw error;

      setHouses(data || []);
      setFilteredHouses(data || []);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionUser(session.user);
        const { data: favs, error: favErr } = await supabase
          .from('favorites')
          .select('property_id')
          .eq('user_id', session.user.id);
        
        if (!favErr && favs) {
          setFavorites(new Set(favs.map(f => f.property_id)));
        }
      }

    } catch (err) {
      console.error('Failed to fetch houses:', err);
      setHouses([]);
      setFilteredHouses([]);
    }
  };

  const handleRemoveFavorite = async (e, propertyId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this property from your favorites?")) {
      return;
    }
    
    try {
       const { error } = await supabase
         .from('favorites')
         .delete()
         .match({ user_id: sessionUser.id, property_id: propertyId });
         
       if (error) throw error;
       
       setFavorites(prev => {
         const newFavs = new Set(prev);
         newFavs.delete(propertyId);
         return newFavs;
       });
    } catch(err) {
      console.error("Failed to remove favorite:", err);
      alert("Failed to remove favorite.");
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  const handleSearchSubmit = (filters) => {
    setIsSidebarOpen(true);
    if (!filters) return;
    const dest = (filters.destination || '').toLowerCase();

    const results = houses.filter((h) => {
      if (!h) return false;
      const matchDest =
        (h.name && h.name.toLowerCase().includes(dest)) ||
        (h.address && h.address.toLowerCase().includes(dest)) ||
        (h.neighborhood && h.neighborhood.toLowerCase().includes(dest)) ||
        (h.description && h.description.toLowerCase().includes(dest));
      let matchMin = true;
      let matchMax = true;
      const priceVal = parseFloat(h.price);
      if (filters.minBudget && !isNaN(priceVal)) matchMin = priceVal >= parseFloat(filters.minBudget);
      if (filters.maxBudget && !isNaN(priceVal)) matchMax = priceVal <= parseFloat(filters.maxBudget);
      return matchDest && matchMin && matchMax;
    });
    setFilteredHouses(results);
  };

  const selectedHouse = houses.find(h => h.id === selectedId);

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

      {/* Sidebar */}
      <div className={`map-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: '300px', position: 'relative' }}>

          <AnimatePresence mode="wait">
            {!selectedId ? (
              <motion.div
                key="stack"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', width: '100%', height: '100%', padding: '40px 20px', overflowY: 'auto', boxSizing: 'border-box' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '24px', color: '#1a1a1a' }}>Destinations</h2>
                  <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '28px', color: '#1a1a1a', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px' }}>
                  {filteredHouses.length > 0 ? filteredHouses.map((house, index) => (
                    <motion.div
                      key={house.id}
                      layoutId={`card-container-${house.id}`}
                      onClick={() => setSelectedId(house.id)}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      whileHover={{ y: -5 }}
                      style={{
                        position: 'relative',
                        zIndex: filteredHouses.length - index,
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
                      {favorites.has(house.id) && (
                        <button
                          onClick={(e) => handleRemoveFavorite(e, house.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 20,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            color: '#ff4b4b'
                          }}
                          title="Remove Favorite"
                        >
                           <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                           </svg>
                        </button>
                      )}
                      
                      {/* Thumbnail */}
                      <motion.div
                        layoutId={`image-container-${house.id}`}
                        style={{ width: '86px', height: '86px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#ececec' }}
                      >
                        {(house.photos_urls && house.photos_urls.length > 0) ? (
                          <>
                            <motion.img
                              src={house.photos_urls[0]}
                              layoutId={`image-${house.id}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                try {
                                  e.target.style.display = 'none';
                                  if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                                } catch (err) { console.error(err); }
                              }}
                            />
                            <div className="empty-image-placeholder error-fallback" style={{ display: 'none', width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px', textAlign: 'center', padding: '5px' }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                              No Image
                            </div>
                          </>
                        ) : (
                          <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px', textAlign: 'center', padding: '5px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            No Image
                          </div>
                        )}
                      </motion.div>

                      {/* ✅ FIX: restored missing wrapper div for text content */}
                      <div style={{ marginLeft: '16px', flex: 1, overflow: 'hidden' }}>
                        <motion.h4 layoutId={`title-${house.id}`} style={{ margin: '0 0 6px 0', fontFamily: 'Recia, serif', fontSize: '18px', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{house.name}</motion.h4>
                        <motion.p layoutId={`price-${house.id}`} style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '13px', color: '#4a4a4a' }}>RM{house.price}</motion.p>
                        <motion.p layoutId={`dist-${house.id}`} style={{ margin: '4px 0 0 0', fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#888' }}>
                          {house.neighborhood || house.city || 'Unknown Location'}
                        </motion.p>
                      </div>
                    </motion.div>
                  )) : (
                    <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#888', textAlign: 'center', marginTop: '40px' }}>No results found.</p>
                  )}
                </div>
              </motion.div>
            ) : selectedHouse ? (
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
                  zIndex: 20,
                  overflowY: 'auto'
                }}
              >
                <button
                  onClick={() => setSelectedId(null)}
                  style={{
                    position: 'absolute', top: '16px', left: '16px',
                    background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)',
                    border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 30, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>

                <motion.div
                  layoutId={`image-container-${selectedHouse.id}`}
                  style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', backgroundColor: '#ececec' }}
                >
                  {(selectedHouse.photos_urls && selectedHouse.photos_urls.length > 0) ? (
                    <>
                      <motion.img
                        layoutId={`image-${selectedHouse.id}`}
                        src={selectedHouse.photos_urls[0]}
                        alt={selectedHouse.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          try {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                          } catch (err) { console.error(err); }
                        }}
                      />
                      <div className="empty-image-placeholder error-fallback" style={{ display: 'none', width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '16px' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        No Image Available
                      </div>
                    </>
                  ) : (
                    <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '16px', flexDirection: 'column' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      No Image Available
                    </div>
                  )}
                </motion.div>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <motion.h2 layoutId={`title-${selectedHouse.id}`} style={{ margin: '0 0 8px 0', fontFamily: 'Recia, serif', fontSize: '22px', color: '#1a1a1a' }}>{selectedHouse.name}</motion.h2>
                  <motion.p layoutId={`price-${selectedHouse.id}`} style={{ margin: '0 0 4px 0', fontFamily: 'Recia, serif', fontSize: '14px', color: '#4a4a4a' }}>RM{selectedHouse.price}</motion.p>
                  <motion.p layoutId={`dist-${selectedHouse.id}`} style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '12px', color: '#888' }}>
                    {selectedHouse.neighborhood || selectedHouse.city || 'Unknown Location'}
                  </motion.p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span style={{ fontFamily: 'Recia, serif', fontSize: '15px', color: '#1a1a1a', fontWeight: 'bold' }}>
                      {selectedHouse.rating || 'New'}
                    </span>
                  </div>

                  <p style={{ fontFamily: 'Recia, serif', fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1a1a1a' }}>Amenities:</p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{
                      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#555',
                      lineHeight: '1.6', margin: 0, display: 'flex', flexWrap: 'wrap', gap: '8px'
                    }}
                  >
                    {selectedHouse.amenities && selectedHouse.amenities.length > 0
                      ? selectedHouse.amenities.map((amenity, i) => (
                          <span key={i} style={{ backgroundColor: '#e9ecef', padding: '6px 10px', borderRadius: '6px', color: '#1a1a1a', fontWeight: 'bold' }}>
                            {amenity.replace(/[{"}]/g, '').trim()}
                          </span>
                        ))
                      : <span style={{ fontStyle: 'italic' }}>No amenities listed</span>}
                  </motion.div>
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
                      width: '100%', backgroundColor: '#7D9E4E', color: '#fff',
                      border: 'none', borderRadius: '8px', padding: '14px 0',
                      fontSize: '15px', fontFamily: 'Recia, serif', cursor: 'pointer',
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
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'all 0.4s ease', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ flexShrink: 0, zIndex: 50 }}>
            {BurgerButton}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchBar onSubmit={handleSearchSubmit} />
          </div>
        </div>

        <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <MapComponent 
            height="100%" 
            houses={filteredHouses} 
            selectedId={selectedId} 
            onMarkerClick={setSelectedId} 
          />
        </div>
      </div>
    </main>
  );
};

export default MapPage;