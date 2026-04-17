import React, { useState, useEffect } from 'react';
import { supabase } from '../components/supabaseClient';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [destination, setDestination] = useState('');
  
  const [recommendations, setRecommendations] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  // Call onSearch whenever relevant inputs change
  useEffect(() => {
    if (onSearch) {
      onSearch({ minBudget, maxBudget, destination });
    }
  }, [minBudget, maxBudget, destination, onSearch]);

  // Debounced Supabase search for recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (destination.trim() === '') {
        setRecommendations([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('name, neighborhood, city')
          .or(`name.ilike.%${destination}%,neighborhood.ilike.%${destination}%,city.ilike.%${destination}%`)
          .limit(4);
          
        if (!error && data) {
          // Format recommendations based on matched fields to provide up to 4 rich hints
          const recs = data.map(item => item.name || item.neighborhood || item.city);
          setRecommendations([...new Set(recs)]); // deduplicate identical texts
        }
      } catch (err) {
        console.error('Failed fetching recommendations:', err);
      }
    };
    
    // 300ms typical debounce
    const timerId = setTimeout(() => {
      fetchRecommendations();
    }, 300);
    
    return () => clearTimeout(timerId);
  }, [destination]);

  const handleMinChange = (e) => {
    setMinBudget(e.target.value.replace(/\D/g, ''));
  };

  const handleMaxChange = (e) => {
    setMaxBudget(e.target.value.replace(/\D/g, ''));
  };

  const handleBlur = () => {
    // Timeout hides the autocomplete after a short delay so clicks can register first
    setTimeout(() => setIsFocused(false), 200);

    if (minBudget !== '' && maxBudget !== '') {
      if (parseInt(minBudget) > parseInt(maxBudget)) {
        // Swap values if Min is accidentally higher than Max
        const temp = minBudget;
        setMinBudget(maxBudget);
        setMaxBudget(temp);
      }
    }
  };

  return (
    <section className="search-header">
      <div className="search-banner">
        
        <div className="search-bar-container" style={{ position: 'relative', width: '100%' }}>
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-l">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Enter A Destination Or Property" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
            />
          </div>

          {/* Recommendations Dropdown */}
          {isFocused && recommendations.length > 0 && (
             <div className="search-recommendations">
               {recommendations.map((rec, i) => (
                 <div 
                   key={i} 
                   className="rec-item"
                   onMouseDown={() => {
                     setDestination(rec);
                     setIsFocused(false);
                   }}
                 >
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', marginRight: '10px' }}>
                     <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                     <circle cx="12" cy="10" r="3"></circle>
                   </svg>
                   {rec}
                 </div>
               ))}
             </div>
          )}
        </div>

        <div className="filters-row">
          <div className="filter-item" style={{ padding: 0 }}>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Max Budget"
              className="filter-input"
              value={maxBudget}
              onChange={handleMaxChange}
              onBlur={handleBlur}
            />
          </div>
          <div className="filter-item" style={{ padding: 0 }}>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Min Budget"
              className="filter-input"
              value={minBudget}
              onChange={handleMinChange}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
