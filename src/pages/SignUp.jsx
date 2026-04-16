import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gradientSvg from '../assets/Gradient.svg';
import './SignIn.css';

const SignUp = () => {
  const navigate = useNavigate();

  return (
    <main className="signin-page">
      <img src={gradientSvg} className="gradient-bg gradient-left" alt="" />
      <img src={gradientSvg} className="gradient-bg gradient-right" alt="" />

      <button className="back-button" onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back
      </button>

      <div className="signin-card">
        <h2 className="signin-title">Create account</h2>
        
        <input 
          type="text" 
          className="signin-input" 
          placeholder="Email address"
        />
        
        <input 
          type="password" 
          className="signin-input" 
          placeholder="Create password"
        />

        <div className="signin-links">
          <p>Already have an account? <Link to="/signin">Sign in!</Link></p>
        </div>

        <div className="signin-actions">
          <button className="next-button" onClick={() => navigate('/auth-success', { state: { type: 'signup' } })}>Next</button>
        </div>
      </div>
    </main>
  );
};

export default SignUp;
