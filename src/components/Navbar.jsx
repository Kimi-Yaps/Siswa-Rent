import React from 'react';
import { Link } from 'react-router-dom';
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
          <Link to="/housing">Housing</Link>
          <Link to="/map">Map</Link>
        </div>
        <div className="nav-logo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>QuerySaja</Link>
        </div>
        <div className="nav-actions">
          <a href="#signin" className="sign-in">Sign In</a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
