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

const HouseDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  
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
      } catch (err) {
        console.error('Failed to load property details:', err);
      }
    };
    loadDetails();
  }, [id]);

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
                <p className="info-value">RM {property.price}</p>
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

            {isMobile && (
              <button className="contact-btn">Contact Owner</button>
            )}
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
