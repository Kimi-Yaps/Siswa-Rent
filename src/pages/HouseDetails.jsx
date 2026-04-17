import React, { useState, useEffect } from 'react';
import './HouseDetails.css';

const HouseDetails = () => {
  const images = [
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp"
  ];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [isExpanded, setIsExpanded] = useState({
    price: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
    rating: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
    description: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
    owner: typeof window !== 'undefined' ? window.innerWidth > 768 : true
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsExpanded({
          price: false,
          rating: false,
          description: false,
          owner: false
        });
      } else {
        setIsExpanded({
          price: true,
          rating: true,
          description: true,
          owner: true
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleExpand = (section) => {
    if (!isMobile) return;
    setIsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <main className="house-details-page">
      <div className="house-details-content">
        <div className="house-top-section">
          
          <div className="house-images-col">
            <div className="main-image-container">
              <img src={images[activeIndex]} alt="Pulau Hujung Bilik 2" className="main-image" />
              {isMobile && (
                <div className="image-counter">
                  {activeIndex + 1} / {images.length}
                </div>
              )}
            </div>
            
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
          </div>
          
          <div className="house-info-col">
            <h1 className="house-title">Pulau Hujung Bilik 2</h1>
            
            <div className="info-card">
              <div 
                className={`info-header ${isMobile ? 'mobile-clickable' : ''}`} 
                onClick={() => toggleExpand('price')}
              >
                <span className="info-label">Price</span>
                {isMobile && (
                  <span className="expand-icon">{isExpanded.price ? '−' : '+'}</span>
                )}
              </div>
              <div className={`info-content ${isExpanded.price ? 'expanded' : ''}`}>
                <p className="info-value">Contact for pricing</p>
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
              <div 
                className={`info-header ${isMobile ? 'mobile-clickable' : ''}`} 
                onClick={() => toggleExpand('rating')}
              >
                <span className="info-label">Rating</span>
                {isMobile && (
                  <span className="expand-icon">{isExpanded.rating ? '−' : '+'}</span>
                )}
              </div>
              <div className={`info-content ${isExpanded.rating ? 'expanded' : ''}`}>
                <div className="rating-stars">★★★★☆ (4.5/5)</div>
              </div>
            </div>

            <div className="info-card">
              <div 
                className={`info-header ${isMobile ? 'mobile-clickable' : ''}`} 
                onClick={() => toggleExpand('description')}
              >
                <span className="info-label">Description</span>
                {isMobile && (
                  <span className="expand-icon">{isExpanded.description ? '−' : '+'}</span>
                )}
              </div>
              <div className={`info-content ${isExpanded.description ? 'expanded' : ''}`}>
                <p className="info-description">
                  Experience tranquility at Pulau Hujung Bilik 2, a serene getaway 
                  nestled in nature. Perfect for those seeking peace and personal space.
                </p>
              </div>
            </div>

            <div className="info-card owner-card">
              <div 
                className={`info-header ${isMobile ? 'mobile-clickable' : ''}`} 
                onClick={() => toggleExpand('owner')}
              >
                <span className="info-label">Home Owner Information</span>
                {isMobile && (
                  <span className="expand-icon">{isExpanded.owner ? '−' : '+'}</span>
                )}
              </div>
              <div className={`info-content ${isExpanded.owner ? 'expanded' : ''}`}>
                <div className="owner-info">
                  <div className="owner-avatar"></div>
                  <div className="owner-details">
                    <p className="owner-name">John Doe</p>
                    <p className="owner-contact">Verified Host</p>
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
            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar"></div>
                <div className="review-meta">
                  <span className="review-name">Sarah M.</span>
                  {isMobile && <span className="review-date">2 weeks ago</span>}
                </div>
                {isMobile && <div className="review-rating">★★★★★</div>}
              </div>
              <div className="review-body">
                <p>Amazing stay! The place was exactly as described. Perfect for a weekend getaway.</p>
              </div>
            </div>
            
            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar"></div>
                <div className="review-meta">
                  <span className="review-name">Michael R.</span>
                  {isMobile && <span className="review-date">1 month ago</span>}
                </div>
                {isMobile && <div className="review-rating">★★★★☆</div>}
              </div>
              <div className="review-body">
                <p>Great location and peaceful environment. Would definitely recommend!</p>
              </div>
            </div>
          </div>
          
          {isMobile && (
            <button className="view-all-reviews">View All Reviews</button>
          )}
        </div>
      </div>
    </main>
  );
};

export default HouseDetails;
