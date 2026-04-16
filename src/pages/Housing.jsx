import React from 'react';
import SearchBar from '../components/SearchBar';
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
      <div className="housing-hero-banner">
        <SearchBar />
      </div>

      {/* Grid of Houses */}
      <section className="houses-grid-section">
        <div className="houses-grid">
          {dummyData.map((item) => (
            <div 
              key={item.id} 
              className="house-card" 
              onClick={() => window.location.href = '/details'} 
              style={{ cursor: 'pointer' }}
            >
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
