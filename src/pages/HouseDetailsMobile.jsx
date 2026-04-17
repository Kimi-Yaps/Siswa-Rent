import React, { useState } from 'react';
import './HouseDetailsMobile.css';

const HouseDetailsMobile = () => {
  const images = [
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp"
  ];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState({});

  const toggleExpand = (section) => {
    setIsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <main className="hdm-page">
      <div className="hdm-content">
        <div className="hdm-top-section">
          <div className="hdm-images-col">
            <div className="hdm-main-image-container">
              <img 
                src={images[activeIndex]} 
                alt="Pulau Hujung Bilik 2" 
                className="hdm-main-image" 
              />
              <div className="hdm-image-counter">
                {activeIndex + 1} / {images.length}
              </div>
            </div>
            
            <div className="hdm-thumbnails-container">
              {images.map((img, idx) => (
                <button
                  key={idx} 
                  className={`hdm-thumbnail-btn ${activeIndex === idx ? 'active' : ''}`} 
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="hdm-thumbnail-img"
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="hdm-info-col">
            <h1 className="hdm-title">Pulau Hujung Bilik 2</h1>
            
            <div className="hdm-info-card">
              <button 
                className="hdm-info-header" 
                onClick={() => toggleExpand('price')}
                aria-expanded={isExpanded.price}
              >
                <span className="hdm-info-label">Price</span>
                <span className="hdm-expand-icon">{isExpanded.price ? '−' : '+'}</span>
              </button>
              <div className={`hdm-info-content ${isExpanded.price ? 'expanded' : ''}`}>
                <p className="hdm-info-value">Contact for pricing</p>
              </div>
            </div>

            <div className="hdm-info-card">
              <button 
                className="hdm-info-header" 
                onClick={() => toggleExpand('rating')}
                aria-expanded={isExpanded.rating}
              >
                <span className="hdm-info-label">Rating</span>
                <span className="hdm-expand-icon">{isExpanded.rating ? '−' : '+'}</span>
              </button>
              <div className={`hdm-info-content ${isExpanded.rating ? 'expanded' : ''}`}>
                <div className="hdm-rating-stars">★★★★☆ (4.5/5)</div>
              </div>
            </div>

            <div className="hdm-info-card">
              <button 
                className="hdm-info-header" 
                onClick={() => toggleExpand('description')}
                aria-expanded={isExpanded.description}
              >
                <span className="hdm-info-label">Description</span>
                <span className="hdm-expand-icon">{isExpanded.description ? '−' : '+'}</span>
              </button>
              <div className={`hdm-info-content ${isExpanded.description ? 'expanded' : ''}`}>
                <p className="hdm-info-description">
                  Experience tranquility at Pulau Hujung Bilik 2, a serene getaway 
                  nestled in nature. Perfect for those seeking peace and personal space.
                </p>
              </div>
            </div>

            <div className="hdm-info-card hdm-owner-card">
              <button 
                className="hdm-info-header" 
                onClick={() => toggleExpand('owner')}
                aria-expanded={isExpanded.owner}
              >
                <span className="hdm-info-label">Home Owner Information</span>
                <span className="hdm-expand-icon">{isExpanded.owner ? '−' : '+'}</span>
              </button>
              <div className={`hdm-info-content ${isExpanded.owner ? 'expanded' : ''}`}>
                <div className="hdm-owner-info">
                  <div className="hdm-owner-avatar"></div>
                  <div className="hdm-owner-details">
                    <p className="hdm-owner-name">John Doe</p>
                    <p className="hdm-owner-contact">Verified Host</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="hdm-contact-btn">Contact Owner</button>
          </div>
        </div>

        <div className="hdm-reviews-section">
          <h3 className="hdm-reviews-title">Reviews:</h3>
          <div className="hdm-reviews-container">
            <div className="hdm-review-card">
              <div className="hdm-review-header">
                <div className="hdm-review-avatar"></div>
                <div className="hdm-review-meta">
                  <span className="hdm-review-name">Sarah M.</span>
                  <span className="hdm-review-date">2 weeks ago</span>
                </div>
                <div className="hdm-review-rating">★★★★★</div>
              </div>
              <div className="hdm-review-body">
                <p>Amazing stay! The place was exactly as described. Perfect for a weekend getaway.</p>
              </div>
            </div>
            
            <div className="hdm-review-card">
              <div className="hdm-review-header">
                <div className="hdm-review-avatar"></div>
                <div className="hdm-review-meta">
                  <span className="hdm-review-name">Michael R.</span>
                  <span className="hdm-review-date">1 month ago</span>
                </div>
                <div className="hdm-review-rating">★★★★☆</div>
              </div>
              <div className="hdm-review-body">
                <p>Great location and peaceful environment. Would definitely recommend!</p>
              </div>
            </div>
          </div>
          
          <button className="hdm-view-all-reviews">View All Reviews</button>
        </div>
      </div>
    </main>
  );
};

export default HouseDetailsMobile;
