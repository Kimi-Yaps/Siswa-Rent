import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HomeMobile from './HomeMobile';
import gradientImg from '../assets/Gradient.svg';
import orangeBgTextImg from '../assets/OrangeBgText.webp';
import welcomeNoteImg from '../assets/WelcomeNote.webp';

const faqs = [
  { question: 'What Is Siswa Rent ', answer: 'Siswa Rent is a modern platform to help you find your perfect personal space and beyond.' },
  { question: 'How Do I Find My Perfect House?', answer: 'Simply enter your desired destination in the search bar and compare prices, distances, and reviews to find your match.' },
  { question: 'Who Is Siswa Rent Targeted Towards?', answer: 'We primarily focus on students and renters looking for affordable, reliable housing options near campuses or cities.' }
];

const Home = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <HomeMobile />;
  }

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main>
      <section className="hero-section">
        {/* Background gradients */}
        <img src={gradientImg} alt="Gradient Background Left" className="hero-bg-gradient gradient-left" />
        <img src={gradientImg} alt="Gradient Background Right" className="hero-bg-gradient gradient-right" />
        
        <div className="hero-content">
          <div className="hero-images">
            <img src={orangeBgTextImg} alt="Your Personal Space Experience" className="hero-title-img" />
            <motion.img 
              src={welcomeNoteImg} 
              alt="Welcome to your personal space & beyond" 
              className="hero-welcome-card" 
              drag
              dragConstraints={{ left: -300, right: 300, top: -150, bottom: 150 }}
              dragElastic={0.2}
              whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
              style={{ cursor: 'grab' }}
            />
          </div>
        </div>
      </section>

      <section className="faq-section">
        <h2 className="faq-title">FAQ</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="faq-item" 
              onClick={() => toggleFaq(index)} 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h3>• {faq.question}</h3>
                <span className="faq-icon" style={{ fontSize: '24px' }}>{openFaq === index ? '-' : '+'}</span>
              </div>
              {openFaq === index && (
                <div style={{ marginTop: '10px', fontSize: '16px', color: '#555', paddingLeft: '15px' }}>
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

export default Home;
