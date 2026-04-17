import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import { supabase } from '../components/supabaseClient';
import { heapSort } from '../utils/heapSort';
import './Housing.css';

const Housing = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*');
        
      if (error) {
        throw error;
      } 
      
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (err) {
      console.error('Error fetching properties from DB:', err);
      // Fallback to empty array to prevent map crashes
      setProperties([]);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSearch = (filters) => {
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
  };

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
                // Safely grab the first photo URL if it exists, otherwise placeholder
                const firstImage = (item.photos_urls && item.photos_urls.length > 0) 
                  ? item.photos_urls[0] 
                  : null;
                  
                return (
                  <div 
                    key={item.id} 
                    className="house-card" 
                    onClick={() => window.location.href = `/details/${item.id}`} 
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="house-image-container" style={{ backgroundColor: '#ececec' }}>
                      {firstImage ? (
                        <>
                          <img 
                            src={firstImage} 
                            alt={item.name} 
                            className="house-image" 
                            onError={(e) => {
                              try {
                                e.target.style.display = 'none';
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display = 'flex';
                                }
                              } catch (err) {
                                console.error('Error handling image fallback:', err);
                              }
                            }}
                          />
                          <div className="empty-image-placeholder" style={{ display: 'none', width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>
                             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                             No Image Available
                          </div>
                        </>
                      ) : (
                        <div className="empty-image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>
                           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                           No Image Available
                        </div>
                      )}
                    </div>
                    <div className="house-details">
                      <h4>{item.name}</h4>
                      <p>RM{item.price}</p>
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
