import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-links">
        <a href="#home">Home</a>
        <a href="#housing">Housing</a>
        <a href="#map">Map</a>
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
