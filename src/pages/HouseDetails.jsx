import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../components/supabaseClient';
import CompareLocations from '../components/CompareLocations';
import './HouseDetails.css';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_JAVASCRIPT_MAP_API;

const getStreetViewUrl = (property) => {
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
  if (!lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${lat},${lng}&fov=80&pitch=0&radius=25&source=outdoor&key=${MAPS_API_KEY}`;
};

const getStaticMapUrl = (property) => {
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
  if (!lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=800x600&maptype=roadmap&markers=color:0x7D9E4E%7C${lat},${lng}&key=${MAPS_API_KEY}`;
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
  
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [validStreetView, setValidStreetView] = useState(null); // null = checking, true/false = result

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check Street View availability when property has no photos
  useEffect(() => {
    if (!property) return;
    if (images.length > 0) return; // already have photos
    checkStreetViewExists(property).then(exists => setValidStreetView(exists));
  }, [property, images.length]);

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

        // Try place_id first (AI search results), then fall back to primary key id
        let { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('place_id', id)
          .maybeSingle();

        if (!data) {
          ({ data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .maybeSingle());
        }

        if (error) throw error;
        if (!data) throw new Error('Property not found');

        setProperty(data);
        if (data && data.photos_urls) {
           setImages(data.photos_urls);
        }

        // Check favorite status if logged in (use resolved DB id)
        if (user) {
          const { data: favData, error: favError } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('property_id', data.id)
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

  const handleComparisonChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    // Validate that we have real numeric coordinates
    const lat = parseFloat(property?.latitude);
    const lng = parseFloat(property?.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setSelectedComparison(value);
      setIsCompareOpen(true);
    } else {
      alert('This property does not have location data needed for distance comparison.');
    }
    // Reset dropdown
    e.target.value = '';
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;
    if (!sessionUser) {
      alert('Please sign in to add a review.');
      return;
    }
    setReviewSubmitting(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ user_review: reviewText.trim() })
        .eq('id', property.id);

      if (error) {
        console.error('Review update error:', error);
        alert('Could not save review. Please try again.');
      } else {
        setProperty(prev => ({ ...prev, user_review: reviewText.trim() }));
        setReviewText('');
        setShowReviewModal(false);
        alert('Review submitted!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!property) {
    return (
      <main className="house-details-page">
        <div className="house-details-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e0e0e0', borderTop: '3px solid #7D9E4E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontFamily: 'Recia, serif', color: '#888', fontSize: '14px' }}>Loading property...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
                      // Try Street View fallback first
                      const svUrl = getStreetViewUrl(property);
                      if (svUrl) {
                        const fallbackImg = document.createElement('img');
                        fallbackImg.className = 'main-image';
                        fallbackImg.src = svUrl;
                        fallbackImg.alt = property.name;
                        fallbackImg.onerror = () => {
                          // Try static map
                          const smUrl = getStaticMapUrl(property);
                          if (smUrl) {
                            fallbackImg.src = smUrl;
                            fallbackImg.onerror = () => {
                              fallbackImg.remove();
                              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                            };
                          } else {
                            fallbackImg.remove();
                            if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                          }
                        };
                        e.target.parentNode.insertBefore(fallbackImg, e.target.nextElementSibling);
                      } else {
                        if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
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
              ) : validStreetView === true ? (
                <img
                  src={getStreetViewUrl(property)}
                  alt={property.name}
                  className="main-image"
                  onError={(e) => {
                    const smUrl = getStaticMapUrl(property);
                    if (smUrl && e.target.src !== smUrl) {
                      e.target.src = smUrl;
                    } else {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : validStreetView === false && getStaticMapUrl(property) ? (
                <img
                  src={getStaticMapUrl(property)}
                  alt={property.name}
                  className="main-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '16px' }}>
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                   {validStreetView === null ? 'Loading...' : 'No Image Available'}
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
                  onChange={handleComparisonChange}
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

        {/* Reviews — full-width section below main image + info columns */}
        <div className="reviews-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontFamily: 'Recia, serif', fontSize: '20px', color: '#1a1a1a' }}>Reviews</h3>
            <button
              onClick={() => {
                if (!sessionUser) {
                  alert('Please sign in to add a review.');
                } else {
                  setShowReviewModal(true);
                }
              }}
              style={{
                padding: '8px 18px',
                backgroundColor: 'transparent',
                color: '#7D9E4E',
                border: '1.5px solid #7D9E4E',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Recia, serif',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#7D9E4E'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#7D9E4E'; }}
            >
              + Add Review
            </button>
          </div>

          {property.user_review ? (
            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar" style={{ backgroundColor: '#34495E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0 }}>
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
            <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#aaa', fontStyle: 'italic', margin: 0 }}>
              No reviews yet. Be the first to share your experience!
            </p>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div
            onClick={() => setShowReviewModal(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#f4f1eb',
                borderRadius: '16px',
                padding: '32px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
            >
              <h2 style={{ margin: '0 0 6px', fontFamily: 'Recia, serif', fontSize: '22px', color: '#1a1a1a' }}>Add a Review</h2>
              <p style={{ margin: '0 0 20px', fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#888' }}>
                Share your experience at {property.name}
              </p>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell others what you think about this property..."
                maxLength={600}
                style={{
                  width: '100%',
                  minHeight: '130px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1.5px solid #d0ccc0',
                  background: '#fff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  color: '#1a1a1a',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  lineHeight: '1.5',
                }}
              />
              <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#bbb', margin: '6px 0 20px', textAlign: 'right' }}>
                {reviewText.length} / 600
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setShowReviewModal(false); setReviewText(''); }}
                  style={{
                    flex: 1, padding: '12px', background: 'transparent',
                    border: '1.5px solid #ccc', borderRadius: '8px',
                    cursor: 'pointer', fontFamily: 'Recia, serif', fontSize: '14px', color: '#666',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || !reviewText.trim()}
                  style={{
                    flex: 1, padding: '12px',
                    background: reviewText.trim() ? '#7D9E4E' : '#ccc',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    cursor: reviewText.trim() && !reviewSubmitting ? 'pointer' : 'not-allowed',
                    fontFamily: 'Recia, serif', fontSize: '14px', fontWeight: 'bold',
                    transition: 'background 0.2s',
                  }}
                >
                  {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CompareLocations
        isOpen={isCompareOpen}
        onClose={() => {
          setIsCompareOpen(false);
          setSelectedComparison(null);
        }}
        propertyLocation={{ lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) }}
        propertyName={property.name}
        comparisonType={selectedComparison}
      />
    </main>
  );
};

export default HouseDetails;
