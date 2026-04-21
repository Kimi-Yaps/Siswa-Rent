import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SearchBar from '../components/SearchBar';
import { supabase } from '../components/supabaseClient';
import { heapSort } from '../utils/heapSort';
import './Housing.css';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_JAVASCRIPT_MAP_API;

const getStreetViewUrl = (property) => {
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
  if (!lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&fov=80&pitch=0&radius=25&source=outdoor&key=${MAPS_API_KEY}`;
};

const getStaticMapUrl = (property) => {
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
  if (!lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=600x400&maptype=roadmap&markers=color:0x7D9E4E%7C${lat},${lng}&key=${MAPS_API_KEY}`;
};

const checkStreetViewExists = async (property) => {
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
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

const getCompiledPrice = (property) => {
  if (property.price_avg) return property.price_avg;
  if (property.price_min && property.price_max) {
    return ((parseFloat(property.price_min) + parseFloat(property.price_max)) / 2).toFixed(2);
  }
  return property.price || 'N/A';
};

const Housing = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [sessionUser, setSessionUser] = useState(null);
  const [validStreetViews, setValidStreetViews] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) throw error;

      setProperties(data || []);
      setFilteredProperties(data || []);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionUser(session.user);
        const { data: favs, error: favErr } = await supabase
          .from('favorites')
          .select('property_id')
          .eq('user_id', session.user.id);

        if (!favErr && favs) {
          const favSet = new Set(favs.map(f => f.property_id));
          setFavorites(favSet);
        }
      }
    } catch (err) {
      console.error('Error fetching data from DB:', err);
      setProperties([]);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const propertiesNeedingCheck = properties.filter(
      p => !(p.photos_urls && p.photos_urls.length > 0)
    );
    if (propertiesNeedingCheck.length === 0) return;

    propertiesNeedingCheck.forEach(async (p) => {
      const isValid = await checkStreetViewExists(p);
      setValidStreetViews(prev => ({ ...prev, [p.id]: isValid }));
    });
  }, [properties]);

  const handleRemoveFavorite = async (e, propertyId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this property from your favorites?")) return;

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

  const handleSearch = useCallback((filters) => {
    try {
      const { destination, minBudget, maxBudget } = filters;

      let results = properties.filter((prop) => {
        if (!prop) return false;

        let matchesDest = true;
        let matchesMin = true;
        let matchesMax = true;

        if (destination && destination.trim() !== '') {
          const destLower = destination.toLowerCase();
          matchesDest =
            (prop.name && prop.name.toLowerCase().includes(destLower)) ||
            (prop.address && prop.address.toLowerCase().includes(destLower)) ||
            (prop.neighborhood && prop.neighborhood.toLowerCase().includes(destLower));
        }

        const price = parseFloat(prop.price);
        if (!isNaN(price)) {
          if (minBudget !== '') matchesMin = price >= parseFloat(minBudget);
          if (maxBudget !== '') matchesMax = price <= parseFloat(maxBudget);
        }

        return matchesDest && matchesMin && matchesMax;
      });

      if (results.length > 0) {
        results = heapSort(results, 'price');
      }

      setFilteredProperties(results);
    } catch (err) {
      console.error('Error processing search filters:', err);
    }
  }, [properties]);

  return (
    <main className="housing-page">
      <div className="housing-hero-banner">
        <SearchBar onSearch={handleSearch} />
      </div>

      <section className="houses-grid-section">
        {loading ? (
          <p>Loading real estate mappings...</p>
        ) : (
          <div className="houses-grid">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((item) => {
                const hasPhotos = item.photos_urls && item.photos_urls.length > 0;
                const firstImage = hasPhotos
                  ? item.photos_urls[0]
                  : validStreetViews[item.id] === true
                    ? getStreetViewUrl(item)
                    : getStaticMapUrl(item);

                const isSelected = selectedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="house-card"
                    style={{ cursor: 'pointer', position: 'relative', zIndex: isSelected ? 50 : 1 }}
                    onClick={() => setSelectedId(isSelected ? null : item.id)}
                  >
                    {/* Fav button */}
                    {favorites.has(item.id) && (
                      <button
                        onClick={(e) => handleRemoveFavorite(e, item.id)}
                        style={{
                          position: 'absolute', top: '10px', right: '10px',
                          background: 'white', border: 'none', borderRadius: '50%',
                          width: '32px', height: '32px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', zIndex: 20,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)', color: '#ff4b4b'
                        }}
                        title="Remove Favorite"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                    )}

                    {/* Normal card content */}
                    <div className="house-image-container" style={{ backgroundColor: '#ececec' }}>
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={item.name}
                          className="house-image"
                          onError={(e) => {
                            try {
                              const staticMap = getStaticMapUrl(item);
                              if (staticMap && e.target.src !== staticMap) e.target.src = staticMap;
                              else e.target.style.display = 'none';
                            } catch (err) { console.error(err); }
                          }}
                        />
                      ) : (
                        <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          No Image Available
                        </div>
                      )}
                    </div>
                    <div className="house-details">
                      <h4>{item.name}</h4>
                      <p>RM {getCompiledPrice(item)}</p>
                      <p className="house-distance">
                        {item.neighborhood || item.city || 'Unknown Location'}
                      </p>
                    </div>

                    {/* Click-to-expand overlay */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scaleY: 0.9 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          exit={{ opacity: 0, scaleY: 0.92 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0,
                            transformOrigin: 'top center',
                            background: '#f4f1eb',
                            borderRadius: '16px',
                            boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
                            zIndex: 200,
                            overflow: 'hidden',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Square image with close button */}
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#ececec', overflow: 'hidden' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                              style={{
                                position: 'absolute', top: '12px', left: '12px',
                                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
                                border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', zIndex: 10,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                            {firstImage ? (
                              <img
                                src={firstImage}
                                alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                onError={(e) => {
                                  const fb = getStaticMapUrl(item);
                                  if (fb && e.target.src !== fb) e.target.src = fb;
                                  else e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#e8f0db,#c9d9a8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7D9E4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                                  <path d="M9 21V12h6v9"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div style={{ padding: '20px 20px 20px', textAlign: 'center' }}>
                            <h2 style={{ margin: '0 0 6px', fontFamily: 'Recia, serif', fontSize: '18px', color: '#1a1a1a', lineHeight: '1.25', fontWeight: 'normal' }}>
                              {item.name}
                            </h2>
                            <p style={{ margin: '0 0 4px', fontFamily: 'Recia, serif', fontSize: '14px', color: '#4a4a4a' }}>
                              RM{getCompiledPrice(item)}
                            </p>
                            <p style={{ margin: '0 0 14px', fontFamily: 'Recia, serif', fontSize: '12px', color: '#888' }}>
                              {item.neighborhood || item.city || item.address || 'Unknown Location'}
                            </p>

                            {/* Rating */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', gap: '6px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              <span style={{ fontFamily: 'Recia, serif', fontSize: '15px', color: '#1a1a1a', fontWeight: 'bold' }}>
                                {item.google_rating || 'New'}
                              </span>
                            </div>

                            {/* Amenities */}
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ margin: '0 0 8px', fontFamily: 'Recia, serif', fontSize: '13px', fontWeight: 'bold', color: '#1a1a1a' }}>
                                Amenities:
                              </p>
                              {item.amenities && item.amenities.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                                  {item.amenities.map((a, i) => (
                                    <span key={i} style={{ background: '#e9ecef', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#1a1a1a', fontWeight: 'bold' }}>
                                      {a.replace(/[{"}]/g, '').trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ margin: '0 0 18px', fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                                  No amenities listed
                                </p>
                              )}
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); window.location.href = `/details/${item.id}`; }}
                              style={{
                                width: '100%', padding: '14px 0',
                                background: '#7D9E4E', color: '#fff',
                                border: 'none', borderRadius: '8px',
                                fontFamily: 'Recia, serif', fontSize: '15px',
                                cursor: 'pointer', fontWeight: 'bold',
                                boxShadow: '0 4px 6px rgba(125,158,78,0.25)',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#6c8843'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#7D9E4E'}
                            >
                              View Details
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <p>No properties match your exact search criteria.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default Housing;