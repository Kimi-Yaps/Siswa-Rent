import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '../components/SearchBar';
import MapComponent from '../components/MapComponent';
import { supabase } from '../components/supabaseClient';
import './MapPage.css';

const API_BASE = 'http://localhost:3400';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_JAVASCRIPT_MAP_API;

const getStreetViewUrl = (house, size = '600x400') => {
  const lat = house.latitude ?? house.lat;
  const lng = house.longitude ?? house.lng;
  if (!lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&fov=80&pitch=0&radius=25&source=outdoor&key=${MAPS_API_KEY}`;
};

const getStaticMapUrl = (house, size = '600x400') => {
  const lat = house.latitude ?? house.lat;
  const lng = house.longitude ?? house.lng;
  if (!lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=${size}&maptype=roadmap&markers=color:0x7D9E4E%7C${lat},${lng}&key=${MAPS_API_KEY}`;
};

const checkStreetViewExists = async (house) => {
  const lat = house.latitude ?? house.lat;
  const lng = house.longitude ?? house.lng;
  if (!lat || !lng) return false;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=25&source=outdoor&key=${MAPS_API_KEY}`
    );
    const data = await res.json();
    return data.status === 'OK';
  } catch {
    return false;
  }
};

const MapPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => JSON.parse(sessionStorage.getItem('map_isSidebarOpen')) ?? false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [lastQuery, setLastQuery] = useState(() => sessionStorage.getItem('map_lastQuery') || '');
  const [selectedId, setSelectedId] = useState(() => sessionStorage.getItem('map_selectedId') || null);
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState(() => JSON.parse(sessionStorage.getItem('map_filteredHouses')) || []);
  const [favorites, setFavorites] = useState(new Set());
  const [sessionUser, setSessionUser] = useState(null);
  const [validStreetViews, setValidStreetViews] = useState({});
  const [viewMode, setViewMode] = useState('map');

  const fetchHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*');

      if (error) throw error;

      setHouses(data || []);

      if (!sessionStorage.getItem('map_lastQuery')) {
        setFilteredHouses(data || []);
      }

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
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      alert("Failed to remove favorite.");
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  useEffect(() => {
    const toCheck = filteredHouses.filter(
      h => !(h.photos_urls && h.photos_urls.length > 0) && !(h.id in validStreetViews)
    );
    if (toCheck.length === 0) return;

    toCheck.forEach(async (h) => {
      const isValid = await checkStreetViewExists(h);
      setValidStreetViews(prev => ({ ...prev, [h.id]: isValid }));
    });
  }, [filteredHouses]);

  useEffect(() => {
    sessionStorage.setItem('map_isSidebarOpen', JSON.stringify(isSidebarOpen));
    sessionStorage.setItem('map_lastQuery', lastQuery);
    sessionStorage.setItem('map_filteredHouses', JSON.stringify(filteredHouses));
    if (selectedId) sessionStorage.setItem('map_selectedId', selectedId);
    else sessionStorage.removeItem('map_selectedId');
  }, [isSidebarOpen, lastQuery, filteredHouses, selectedId]);

  const handleSearchSubmit = async (filters) => {
    console.log('[handleSearchSubmit] blocked?', { isSearching, filters });
    if (isSearching) return;
    setIsSidebarOpen(true);
    setViewMode('map');
    if (!filters) return;

    let query = filters.destination?.trim() || '';

    const alreadyHasBudget = /\b(bawah|atas|antara)\s+RM/i.test(query);
    if (!alreadyHasBudget && filters.minBudget && filters.maxBudget) {
      query += ` antara RM${filters.minBudget} hingga RM${filters.maxBudget}`;
    } else if (!alreadyHasBudget && filters.maxBudget) {
      query += ` bawah RM${filters.maxBudget}`;
    } else if (!alreadyHasBudget && filters.minBudget) {
      query += ` atas RM${filters.minBudget}`;
    }
    query = query.trim();
    if (!query) return;

    setSearchError(null);
    setLastQuery(query);
    setIsSearching(true);
    try {
      console.log('[handleSearchSubmit] POSTing payload:', { query, user_id: sessionUser?.id });
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_id: sessionUser?.id }),
      });

      console.log('[handleSearchSubmit] response status:', res.status);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);

      const data = await res.json();

      const mapped = (data.properties || []).map((p) => ({
        id: p.place_id,
        name: p.name,
        price: p.min_price ?? p.max_price,
        rating: p.google_rating,
        description: p.summary,
        address: p.address,
        neighborhood: p.neighborhood,
        city: p.city,
        lat: p.latitude ?? p.lat,
        lng: p.longitude ?? p.lng,
        photos_urls: p.photos_urls,
        amenities: p.amenities,
        reasoning: p.reasoning,
        fit_score: p.fit_score,
      }));

      setFilteredHouses(mapped);
      setSelectedId(null);
    } catch (err) {
      console.error('[handleSearchSubmit] fetch error:', err);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectedHouse = filteredHouses.find(h => h.id === selectedId) ?? houses.find(h => h.id === selectedId);

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
      <div className={`map-sidebar ${viewMode === 'map' && isSidebarOpen ? 'open' : 'closed'}`}>
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
                {/* Sidebar header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '24px', color: '#1a1a1a' }}>
                      {lastQuery ? 'Top picks' : 'Destinations'}
                    </h2>
                    {lastQuery && !isSearching && filteredHouses.length > 0 && (
                      <span style={{
                        fontSize: '11px', fontFamily: 'Arial, sans-serif', fontWeight: 700,
                        background: '#eaf2d7', color: '#5a7a2e',
                        padding: '2px 8px', borderRadius: '99px'
                      }}>
                        {filteredHouses.length} result{filteredHouses.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '28px', color: '#1a1a1a', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
                </div>

                {/* Loading overlay */}
                {isSearching && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '60px 20px', gap: '14px'
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#7D9E4E" strokeWidth="2.5" strokeLinecap="round"
                      style={{ width: '36px', height: '36px', animation: 'sb-spin 0.9s linear infinite' }}>
                      <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
                      <path d="M12 3 a9 9 0 0 1 9 9" />
                    </svg>
                    <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#888', margin: 0 }}>Finding best matches…</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px' }}>
                  {!isSearching && (filteredHouses.length > 0 ? filteredHouses.map((house, index) => (
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
                        minHeight: '110px',
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'flex-start',
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
                        style={{ width: '86px', height: '86px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}
                      >
                        {/* Number Badge */}
                        <div style={{
                          position: 'absolute', top: '4px', left: '4px',
                          background: 'rgba(0,0,0,0.65)', color: '#fff',
                          width: '18px', height: '18px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 'bold', zIndex: 10
                        }}>
                          {index + 1}
                        </div>
                        {(() => {
                          const hasPhotos = house.photos_urls && house.photos_urls.length > 0;
                          const imgSrc = hasPhotos
                            ? house.photos_urls[0]
                            : validStreetViews[house.id] === true
                              ? getStreetViewUrl(house, '200x200')
                              : getStaticMapUrl(house, '200x200');
                          return imgSrc ? (
                            <>
                              <motion.img
                                src={imgSrc}
                                layoutId={`image-${house.id}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  try {
                                    const staticMap = getStaticMapUrl(house, '200x200');
                                    if (staticMap && e.target.src !== staticMap) {
                                      e.target.src = staticMap;
                                    } else {
                                      e.target.style.display = 'none';
                                    }
                                  } catch (err) { console.error(err); }
                                }}
                              />
                            </>
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              background: 'linear-gradient(135deg,#e8f0db 0%,#c9d9a8 100%)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px'
                            }}>
                              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7D9E4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                                <path d="M9 21V12h6v9" />
                              </svg>
                            </div>
                          );
                        })()}
                      </motion.div>

                      {/* Text content */}
                      <div style={{ marginLeft: '12px', flex: 1, overflow: 'hidden', paddingTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <motion.h4 layoutId={`title-${house.id}`} style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '15px', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>{house.name}</motion.h4>
                          {house.fit_score != null && (() => {
                            let label = 'Good fit';
                            let bg = '#f0ede0';
                            let fg = '#888';
                            if (index === 0) {
                              label = 'Top pick';
                              bg = '#7D9E4E';
                              fg = '#fff';
                            } else if (index <= 2) {
                              label = 'Strong match';
                              bg = '#eaf2d7';
                              fg = '#5a7a2e';
                            }
                            return (
                              <span style={{
                                fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                                background: bg, color: fg, fontWeight: 700,
                                flexShrink: 0, whiteSpace: 'nowrap'
                              }}>
                                {label}
                              </span>
                            );
                          })()}
                        </div>
                        <motion.p layoutId={`price-${house.id}`} style={{ margin: '0 0 2px', fontFamily: 'Recia, serif', fontSize: '13px', color: '#4a4a4a' }}>RM{house.price}</motion.p>
                        <motion.p layoutId={`dist-${house.id}`} style={{ margin: '0 0 4px', fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#888' }}>
                          {house.neighborhood || house.city || 'Unknown Location'}
                        </motion.p>
                        {house.description && (
                          <p style={{
                            margin: 0, fontSize: '10px', color: '#666', fontFamily: 'Arial, sans-serif',
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4'
                          }}>
                            {house.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )) : (
                    <div style={{ textAlign: 'center', marginTop: '40px', padding: '0 10px' }}>
                      {searchError ? (
                        <>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#c0392b', marginBottom: '8px' }}>⚠ {searchError}</p>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#aaa' }}>Check your connection and try again.</p>
                        </>
                      ) : lastQuery ? (
                        <>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#888', marginBottom: '4px' }}>No properties matched your search.</p>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#aaa' }}>Try a different area or adjust your budget.</p>
                        </>
                      ) : (
                        <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#aaa' }}>Search above to find properties.</p>
                      )}
                    </div>
                  ))}
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
                  {filteredHouses.findIndex(h => h.id === selectedHouse.id) !== -1 && (
                    <div style={{
                      position: 'absolute', top: '16px', right: '16px',
                      background: '#4285F4', color: '#fff',
                      width: '32px', height: '32px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: 'bold', zIndex: 10,
                      boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)'
                    }}>
                      {filteredHouses.findIndex(h => h.id === selectedHouse.id) + 1}
                    </div>
                  )}
                  {(() => {
                    const hasPhotos = selectedHouse.photos_urls && selectedHouse.photos_urls.length > 0;
                    const imgSrc = hasPhotos
                      ? selectedHouse.photos_urls[0]
                      : validStreetViews[selectedHouse.id] === true
                        ? getStreetViewUrl(selectedHouse, '600x400')
                        : getStaticMapUrl(selectedHouse, '600x400');
                    return imgSrc ? (
                      <motion.img
                        layoutId={`image-${selectedHouse.id}`}
                        src={imgSrc}
                        alt={selectedHouse.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          try {
                            const staticMap = getStaticMapUrl(selectedHouse, '600x400');
                            if (staticMap && e.target.src !== staticMap) {
                              e.target.src = staticMap;
                            } else {
                              e.target.style.display = 'none';
                            }
                          } catch (err) { console.error(err); }
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg,#e8f0db 0%,#c9d9a8 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7D9E4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                          <path d="M9 21V12h6v9" />
                        </svg>
                      </div>
                    );
                  })()}
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
                      {selectedHouse.rating ? parseFloat(selectedHouse.rating).toFixed(1) : 'New'}
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

      {/* Main Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'all 0.4s ease', position: 'relative' }}>

        {/* Search bar row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ flexShrink: 0, zIndex: 50 }}>
            {viewMode === 'map' && BurgerButton}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchBar
              onSubmit={handleSearchSubmit}
              isSearching={isSearching}
              lastResultCount={lastQuery && !isSearching ? filteredHouses.length : null}
              lastQueryLabel={lastQuery && !isSearching ? lastQuery : null}
            />
          </div>
        </div>

        {/* Toggle pill */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 20px 4px' }}>
          <div style={{
            display: 'inline-flex',
            background: '#ece9e0',
            borderRadius: '99px',
            padding: '3px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            gap: '2px',
          }}>
            {['map', 'list'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 20px',
                  borderRadius: '99px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'Recia, serif',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  background: viewMode === mode ? '#7D9E4E' : 'transparent',
                  color: viewMode === mode ? '#fff' : '#666',
                  boxShadow: viewMode === mode ? '0 2px 6px rgba(125,158,78,0.3)' : 'none',
                }}
              >
                {mode === 'map' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                    </svg>
                    Map
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    List
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Map view */}
        {viewMode === 'map' && (
          <div style={{ padding: '0 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <MapComponent
              height="100%"
              houses={filteredHouses}
              selectedId={selectedId}
              onMarkerClick={setSelectedId}
            />
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 32px' }}>
            {isSearching ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '14px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7D9E4E" strokeWidth="2.5" strokeLinecap="round"
                  style={{ width: '36px', height: '36px', animation: 'sb-spin 0.9s linear infinite' }}>
                  <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
                  <path d="M12 3 a9 9 0 0 1 9 9" />
                </svg>
                <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#888', margin: 0 }}>Finding best matches…</p>
              </div>
            ) : filteredHouses.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '20px',
                overflow: 'visible',
              }}>
                {filteredHouses.map((house, index) => {
                  const hasPhotos = house.photos_urls && house.photos_urls.length > 0;
                  const imgSrc = hasPhotos
                    ? house.photos_urls[0]
                    : validStreetViews[house.id] === true
                      ? getStreetViewUrl(house, '600x400')
                      : getStaticMapUrl(house, '600x400');

                  return (
                    <motion.div
                      key={house.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => window.location.href = `/details/${house.id}`}
                      style={{
                        background: '#fff',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        cursor: 'pointer',
                        border: '1px solid rgba(0,0,0,0.04)',
                        position: 'relative',
                        zIndex: 1,
                      }}
                      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                    >
                      {/* Card image */}
                      <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#ececec', overflow: 'hidden', position: 'relative', borderRadius: '16px 16px 0 0' }}>
                        {house.fit_score != null && index < 3 && (
                          <div style={{
                            position: 'absolute', top: '10px', left: '10px', zIndex: 10,
                            background: index === 0 ? '#7D9E4E' : '#eaf2d7',
                            color: index === 0 ? '#fff' : '#5a7a2e',
                            fontSize: '10px', fontWeight: 700, fontFamily: 'Arial, sans-serif',
                            padding: '3px 10px', borderRadius: '99px',
                          }}>
                            {index === 0 ? 'Top pick' : 'Strong match'}
                          </div>
                        )}
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={house.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              const staticMap = getStaticMapUrl(house, '600x400');
                              if (staticMap && e.target.src !== staticMap) e.target.src = staticMap;
                              else e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#e8f0db 0%,#c9d9a8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7D9E4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                              <path d="M9 21V12h6v9"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Card details */}
                      <div style={{ padding: '14px 16px', borderRadius: '0 0 16px 16px', background: '#fff' }}>
                        <h4 style={{ margin: '0 0 4px', fontFamily: 'Recia, serif', fontSize: '15px', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {house.name}
                        </h4>
                        <p style={{ margin: '0 0 2px', fontFamily: 'Recia, serif', fontSize: '14px', color: '#4a4a4a' }}>
                          RM {house.price}
                        </p>
                        <p style={{ margin: 0, fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#888' }}>
                          {house.neighborhood || house.city || 'Unknown Location'}
                        </p>
                        {house.description && (
                          <p style={{
                            margin: '8px 0 0', fontSize: '11px', color: '#666',
                            fontFamily: 'Arial, sans-serif', lineHeight: '1.5',
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {house.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '80px' }}>
                {lastQuery
                  ? <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#888' }}>No properties matched your search.</p>
                  : <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#aaa' }}>Search above to find properties.</p>
                }
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default MapPage;