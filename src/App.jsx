import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import gradientImg from './assets/Gradient.svg';
import orangeBgTextImg from './assets/OrangeBgText.webp';
import welcomeNoteImg from './assets/WelcomeNote.webp';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Navbar />

      <main>
        <section className="hero-section">
          {/* Background gradients */}
          <img src={gradientImg} alt="Gradient Background Left" className="hero-bg-gradient gradient-left" />
          <img src={gradientImg} alt="Gradient Background Right" className="hero-bg-gradient gradient-right" />
          
          <div className="hero-content">
            <div className="hero-images">
              <img src={orangeBgTextImg} alt="Your Personal Space Experience" className="hero-title-img" />
              <img src={welcomeNoteImg} alt="Welcome to your personal space & beyond" className="hero-welcome-card" />
            </div>
          </div>
        </section>

        <section className="faq-section">
          <h2 className="faq-title">FAQ</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>• What Is QuerySaja?</h3>
              <span className="faq-icon">+</span>
            </div>
            <div className="faq-item">
              <h3>• How Do I Find My Perfect House?</h3>
              <span className="faq-icon">+</span>
            </div>
            <div className="faq-item">
              <h3>• Who Is QuerySaja Targeted Towards?</h3>
              <span className="faq-icon">+</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
