import React, { useState } from 'react';
import './HouseDetails.css';

const HouseDetails = () => {
  const images = [
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp",
    "/Pulau_Tengah_11.webp"
  ];
  
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <main className="house-details-page">
      <div className="house-details-content">
        <div className="house-top-section">
          <div className="house-images-col">
            <div className="main-image-container">
              <img src={images[activeIndex]} alt="Pulau Hujung Bilik 2" className="main-image" />
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
            <div className="info-item">
              <span className="info-label">Price:</span>
            </div>
            <div className="info-item">
              <span className="info-label">Rating:</span>
            </div>
            <div className="info-item" style={{ minHeight: '120px' }}>
              <span className="info-label">Description:</span>
            </div>
            <div className="info-item mt-auto">
              <span className="info-label">Home Owner Information:</span>
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <h3 className="reviews-title">Reviews:</h3>
          <div className="reviews-container">
            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar"></div>
                <span className="review-name">Name:</span>
              </div>
              <div className="review-body">
                <p>Review Description</p>
              </div>
            </div>
            
            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar"></div>
                <span className="review-name">Name:</span>
              </div>
              <div className="review-body">
                <p>Review Description</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HouseDetails;
