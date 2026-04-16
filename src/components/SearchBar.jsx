import React from 'react';
import './SearchBar.css';

const SearchBar = () => {
  return (
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
          <div className="filter-item">Compare distance To</div>
          <div className="filter-item">Max Budget</div>
          <div className="filter-item">Min Budget</div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
