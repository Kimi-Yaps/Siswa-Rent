import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = () => {
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

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
          <input type="text" placeholder="Enter A Destination Or Property" />
        </div>
        <div className="filters-row">
          <div className="filter-item" style={{ padding: 0, display: 'flex' }}>
            <select
              defaultValue=""
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                color: 'inherit',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                padding: '16px 40px 16px 20px',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%23888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 15px center'
              }}
            >
              <option value="" disabled hidden>Compare Distance To</option>
              <option value="gas_station" style={{ color: '#1a1a1a', backgroundColor: '#f0ede0', padding: '18px 24px', fontFamily: 'Recia, serif' }}>Gas Station</option>
              <option value="utm" style={{ color: '#1a1a1a', backgroundColor: '#f0ede0', padding: '18px 24px', fontFamily: 'Recia, serif' }}>UTM</option>
              <option value="mall" style={{ color: '#1a1a1a', backgroundColor: '#f0ede0', padding: '18px 24px', fontFamily: 'Recia, serif' }}>Mall</option>
            </select>
          </div>
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
