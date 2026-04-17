import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = () => {
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [destination, setDestination] = useState('');

  const handleMinChange = (e) => {
    setMinBudget(e.target.value.replace(/\D/g, ''));
  };

  const handleMaxChange = (e) => {
    setMaxBudget(e.target.value.replace(/\D/g, ''));
  };

  const handleBlur = () => {
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
          />
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
