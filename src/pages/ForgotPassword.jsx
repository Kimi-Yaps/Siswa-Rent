import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../components/supabaseClient';
import gradientSvg from '../assets/Gradient.svg';
import './SignIn.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password', // or wherever you expect them to land
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setLoading(false);
      navigate('/auth-success', { state: { type: 'reset' } });
    }
  };

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

        {error && <div style={{ color: '#d32f2f', backgroundColor: '#fdecea', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>{error}</div>}

        <input
          type="email"
          className="signin-input"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleResetPassword();
          }}
        />

        <div className="signin-actions" style={{ marginTop: '20px' }}>
          <button className="next-button" onClick={handleResetPassword} disabled={loading}>
            {loading ? 'Sending...' : 'Send Link'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
