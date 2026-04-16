import React from 'react';
import './Housing.css';

const dummyData = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  name: 'Pulau Hujung',
  price: 'RM260 for Night',
  image: '/Pulau_Tengah_11.webp',
}));

const Housing = () => {
  return (
    <main className="housing-page">
      {/* Search Header */}
      <section className="search-header">
        <div className="search-banner">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-l">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Enter a destination or property" />
          </div>
          <div className="filters-row">
            <div className="filter-item">Compare distance</div>
            <div className="filter-item">Max Budget</div>
            <div className="filter-item">Min Budget</div>
          </div>
        </div>
      </section>

      {/* Grid of Houses */}
      <section className="houses-grid-section">
        <div className="houses-grid">
          {dummyData.map((item) => (
            <div key={item.id} className="house-card">
              <img src={item.image} alt={item.name} className="house-image" />
              <div className="house-details">
                <h4>{item.name}</h4>
                <p>{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Housing;
