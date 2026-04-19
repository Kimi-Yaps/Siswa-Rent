import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomeMobile.css';
import gradientImg from '../assets/Gradient.svg';
import orangeBgTextImg from '../assets/OrangeBgText.webp';
import welcomeNoteImg from '../assets/WelcomeNote.webp';

const faqs = [
  { question: 'What Is QuerySaja?', answer: 'QuerySaja is a modern platform to help you find your perfect personal space and beyond.' },
  { question: 'How Do I Find My Perfect House?', answer: 'Simply enter your desired destination in the search bar and compare prices, distances, and reviews to find your match.' },
  { question: 'Who Is QuerySaja Targeted Towards?', answer: 'We primarily focus on students and renters looking for affordable, reliable housing options near campuses or cities.' }
];

const HomeMobile = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className="hm-page">
      <section className="hm-hero-section">
        <img src={gradientImg} alt="Gradient Background Left" className="hm-gradient gradient-left" />
        <img src={gradientImg} alt="Gradient Background Right" className="hm-gradient gradient-right" />
        
        <div className="hm-hero-content">
          <div className="hm-hero-images">
            <img src={orangeBgTextImg} alt="Your Personal Space Experience" className="hm-title-img" />
            <img src={welcomeNoteImg} alt="Welcome to your personal space & beyond" className="hm-welcome-card" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', zIndex: 10, position: 'relative' }}>
             <Link to="/map" style={{ padding: '14px 30px', backgroundColor: '#7D9E4E', color: 'white', borderRadius: '30px', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 6px 15px rgba(125, 158, 78, 0.3)' }}>
               Start Searching →
             </Link>
          </div>
        </div>
      </section>

      <section className="hm-faq-section">
        <h2 className="hm-faq-title">FAQ</h2>
        <div className="hm-faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="hm-faq-item" 
              onClick={() => toggleFaq(index)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h3>• {faq.question}</h3>
                <span className="hm-faq-icon" style={{ fontSize: '24px' }}>{openFaq === index ? '-' : '+'}</span>
              </div>
              {openFaq === index && (
                <div style={{ marginTop: '10px', fontSize: '15px', color: '#555', paddingLeft: '15px' }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomeMobile;
