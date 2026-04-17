import React from 'react';
import './HomeMobile.css';
import gradientImg from '../assets/Gradient.svg';
import orangeBgTextImg from '../assets/OrangeBgText.webp';
import welcomeNoteImg from '../assets/WelcomeNote.webp';

const HomeMobile = () => {
  return (
    <main className="hm-page">
      <section className="hm-hero-section">
        {/* Reduced gradient opacity and size to prevent distraction */}
        <img src={gradientImg} alt="Gradient Background" className="hm-gradient" />
        
        <div className="hm-hero-content">
          <img src={orangeBgTextImg} alt="Your Personal Space Experience" className="hm-title-img" />
          <img src={welcomeNoteImg} alt="Welcome to your personal space & beyond" className="hm-welcome-card" />
        </div>
      </section>

      <section className="hm-faq-section">
        <h2 className="hm-faq-title">FAQ</h2>
        <div className="hm-faq-list">
          <div className="hm-faq-item">
            <h3>• What Is QuerySaja?</h3>
            <span className="hm-faq-icon">+</span>
          </div>
          <div className="hm-faq-item">
            <h3>• How Do I Find My Perfect House?</h3>
            <span className="hm-faq-icon">+</span>
          </div>
          <div className="hm-faq-item">
            <h3>• Who Is QuerySaja Targeted Towards?</h3>
            <span className="hm-faq-icon">+</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomeMobile;
