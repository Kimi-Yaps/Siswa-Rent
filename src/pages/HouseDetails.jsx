import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../components/supabaseClient';
import './HouseDetails.css';

const getInitial = (name) => {
  try {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  } catch (err) {
    return '?';
  }
};

const getCompiledPrice = (property) => {
  if (property.price_avg) return property.price_avg;
  if (property.price_min && property.price_max) {
    return ((parseFloat(property.price_min) + parseFloat(property.price_max)) / 2).toFixed(2);
  }
  return property.price || 'N/A';
};

const HouseDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        if (!id) return;

        // Check active session
        const { data: { session } } = await supabase.auth.getSession();
        let user = null;
        if (session) {
          user = session.user;
          setSessionUser(user);
        }

        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        setProperty(data);
        if (data && data.photos_urls) {
           setImages(data.photos_urls);
        }

        // Check favorite status if logged in
        if (user) {
          const { data: favData, error: favError } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('property_id', id)
            .maybeSingle();
            
          if (!favError && favData) {
             setIsFavorite(true);
          }
        }

      } catch (err) {
        console.error('Failed to load property details:', err);
      }
    };
    loadDetails();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      setFavoriteLoading(true);
      if (!sessionUser) {
        alert("Please sign in to add to favorites.");
        return;
      }
      
      const userId = sessionUser.id;

      if (isFavorite) {
        if (!window.confirm("Are you sure you want to remove this property from your favorites?")) {
           setFavoriteLoading(false);
           return;
        }

        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: userId, property_id: id });
        
        if (error) throw error;
        setIsFavorite(false);
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, property_id: id });
          
        if (error) {
           // Handle unique constraint violation gracefully
           if (error.code === '23505') {
               setIsFavorite(true); // already favorited
           } else {
               throw error;
           }
        } else {
           setIsFavorite(true);
           alert("Added to favorites successfully!");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update favorites.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Barebones load state (just empty architecture rather than spinner)
  if (!property) {
    return (
      <main className="house-details-page" style={{ opacity: 0.5 }}>
        <div className="house-details-content">
          <div style={{ height: '400px', backgroundColor: '#f0f0f0', borderRadius: '12px' }} />
        </div>
      </main>
    );
  }

  return (
    <main className="house-details-page">
      <div className="house-details-content">
        <div className="house-top-section">
          
          <div className="house-images-col">
            <div className="main-image-container" style={{ backgroundColor: '#ececec' }}>
              {images.length > 0 ? (
                <>
                  <img src={images[activeIndex] || images[0]} alt={property.name} className="main-image" onError={(e) => {
                    try {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}/>
                  <div className="empty-image-placeholder error-fallback" style={{ display: 'none', width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '16px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    No Image Available
                  </div>
                </>
              ) : (
                <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '16px' }}>
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                   No Image Available
                </div>
              )}

              {isMobile && images.length > 0 && (
                <div className="image-counter">
                  {activeIndex + 1} / {images.length}
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="thumbnails-container">
                {images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className={`thumbnail ${activeIndex === idx ? 'active' : ''}`} 
                    onClick={() => setActiveIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className="house-info-col">
            <h1 className="house-title">{property.name}</h1>
            
            <div className="info-card">
              <div className="info-header">
                <span className="info-label">Price</span>
              </div>
              <div className="info-content expanded">
                <p className="info-value">RM {getCompiledPrice(property)}</p>
                <select
                  defaultValue=""
                  className="compare-dropdown"
                >
                  <option value="" disabled hidden>Compare Distance To...</option>
                  <option value="gas_station">Gas Station</option>
                  <option value="utm">UTM</option>
                  <option value="mall">Mall</option>
                </select>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <span className="info-label">Rating</span>
              </div>
              <div className="info-content expanded">
                <div className="rating-stars">
                  ★ {property.google_rating ? property.google_rating : "No Rating"}
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <span className="info-label">Location / Vibe</span>
              </div>
              <div className="info-content expanded">
                <p className="info-description">
                  {property.address || property.neighborhood || property.city || "No address provided."}
                </p>
                {property.vibes && property.vibes.length > 0 && (
                  <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    Vibes: {property.vibes.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="info-card owner-card">
              <div className="info-header">
                <span className="info-label">Source Info</span>
              </div>
              <div className="info-content expanded">
                <div className="owner-info">
                  <div className="owner-avatar" style={{ backgroundColor: '#2C3E50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {getInitial(property.source)}
                  </div>
                  <div className="owner-details">
                    <p className="owner-name">{property.source}</p>
                    <p className="owner-contact">{property.price_source}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons-container" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={handleToggleFavorite} 
                disabled={favoriteLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: isFavorite ? '#ff4b4b' : '#7D9E4E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: favoriteLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s'
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill={isFavorite ? "currentColor" : "none"} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {isFavorite ? 'Remove Favorite' : 'Save to Favorites'}
              </button>

              {isMobile && (
                <button className="contact-btn" style={{ flex: 1 }}>Contact Owner</button>
              )}
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <h3 className="reviews-title">Reviews:</h3>
          <div className="reviews-container">
            {property.user_review ? (
              <div className="review-card">
                <div className="review-header">
                  <div className="review-avatar" style={{ backgroundColor: '#34495E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {getInitial("Resident")}
                  </div>
                  <div className="review-meta">
                     <span className="review-name">Resident</span>
                  </div>
                </div>
                <div className="review-body">
                  <p>{property.user_review}</p>
                </div>
              </div>
            ) : (
              <p>No reviews available for this property yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default HouseDetails;
