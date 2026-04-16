import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gradientSvg from '../assets/Gradient.svg';
import './SignIn.css';

const SignIn = () => {
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
        <h2 className="signin-title">Sign in</h2>

        <input
          type="text"
          className="signin-input"
          placeholder="Email"
        />

        <input
          type="password"
          className="signin-input"
          placeholder="Password"
        />

        <div className="signin-links">
          <p>No account? <Link to="/signup">Create one!</Link></p>
          <p><a href="#">Can't access your account?</a></p>
        </div>

        <div className="signin-actions">
          <button className="next-button" onClick={() => navigate('/auth-success', { state: { type: 'signin' } })}>Next</button>
        </div>
      </div>
    </main>
  );
};

export default SignIn;
