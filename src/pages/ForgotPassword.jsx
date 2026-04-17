import React from 'react';
import { useNavigate } from 'react-router-dom';
import gradientSvg from '../assets/Gradient.svg';
import './SignIn.css';

const ForgotPassword = () => {
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
        <h2 className="signin-title">Reset Password</h2>
        
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
          Enter the email address associated with your account and we'll send you a link to securely reset your password.
        </p>

        <input
          type="email"
          className="signin-input"
          placeholder="Email address"
        />

        <div className="signin-actions" style={{ marginTop: '20px' }}>
          <button className="next-button" onClick={() => navigate('/auth-success', { state: { type: 'reset' } })}>Send Link</button>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
