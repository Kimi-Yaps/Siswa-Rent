import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-links">
        <Link to="/">Home</Link>
        <Link to="/housing">Housing</Link>
        <Link to="/map">Map</Link>
        <a href="#privacy">Privacy policy</a>
        <a href="#terms">Terms</a>
      </div>
      <div className="footer-brand">
        <h2 className="pixel-text">
          House Recommendation<br/>At Your Finger Tips
        </h2>
      </div>
    </footer>
  );
};

export default Footer;
