import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gradientSvg from '../assets/Gradient.svg';
import './SignIn.css';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const type = location.state?.type || 'signin';

  useEffect(() => {
    // Automatically redirect to home after 3 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="signin-page">
      <img src={gradientSvg} className="gradient-bg gradient-left" alt="" />
      <img src={gradientSvg} className="gradient-bg gradient-right" alt="" />

      <div className="signin-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7D9E4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        
        <h2 className="signin-title" style={{ marginBottom: '16px' }}>
          {type === 'signup' ? 'Account Created!' : type === 'reset' ? 'Link Sent!' : 'Welcome Back!'}
        </h2>
        
        <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.5' }}>
          {type === 'signup' 
            ? 'Your account has been successfully created. Please check your email to verify your account if required.' 
            : type === 'reset' 
              ? 'A password reset link has been sent to your email.'
              : 'You have been successfully signed in.'}
          <br/><br/>
          Redirecting to home page shortly...
        </p>
      </div>
    </main>
  );
};

export default AuthSuccess;
