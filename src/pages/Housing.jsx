import React, { useState, useEffect, useCallback } from 'react';
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

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // 1. Get properties
      const { data, error } = await supabase
        .from('properties')
        .select('*');
        
      if (error) {
        throw error;
      } 
      
      setProperties(data || []);
      setFilteredProperties(data || []);

      // 2. Get active session for favorites
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

  // Validate street view availability for properties without photos
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
                // Priority: photos_urls → Street View (if valid) → Static Map → placeholder
                const hasPhotos = item.photos_urls && item.photos_urls.length > 0;
                const firstImage = hasPhotos
                  ? item.photos_urls[0]
                  : validStreetViews[item.id] === true
                    ? getStreetViewUrl(item)
                    : getStaticMapUrl(item);
                  
                return (
                  <div 
                    key={item.id} 
                    className="house-card" 
                    onClick={() => window.location.href = `/details/${item.id}`} 
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    {favorites.has(item.id) && (
                      <button
                        onClick={(e) => handleRemoveFavorite(e, item.id)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
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
                         <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                         </svg>
                      </button>
                    )}
                    <div className="house-image-container" style={{ backgroundColor: '#ececec' }}>
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={item.name}
                          className="house-image"
                          onError={(e) => {
                            try {
                              // Fallback chain: ibilik failed → try static map
                              const staticMap = getStaticMapUrl(item);
                              if (staticMap && e.target.src !== staticMap) {
                                e.target.src = staticMap;
                              } else {
                                e.target.style.display = 'none';
                              }
                            } catch (err) {
                              console.error('Error handling image fallback:', err);
                            }
                          }}
                        />
                      ) : (
                        <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>
                           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                           No Image Available
                        </div>
                      )}
                    </div>
                    <div className="house-details">
                      <h4>{item.name}</h4>
                      <p>RM {getCompiledPrice(item)}</p>
                      <p className="house-distance">
                        {item.neighborhood ? `${item.neighborhood}` : (item.city || 'Unknown Location')}
                      </p>
                    </div>
                  </div>
                )
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
