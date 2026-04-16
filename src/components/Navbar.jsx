import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <header className="navbar-container">
      <div className="top-banner">
        <div className="scrolling-text">
          {Array.from({ length: 15 }).map((_, index) => (
            <span key={index}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="circle-icon">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              Find Your Home Now
            </span>
          ))}
        </div>
      </div>
      <nav className="nav-main">
        <div className="nav-links">
          <a href="#housing">Housing</a>
          <a href="#map">Map</a>
        </div>
        <div className="nav-logo">
          QuerySaja
        </div>
        <div className="nav-actions">
          <button className="search-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <a href="#signin" className="sign-in">Sign In</a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
