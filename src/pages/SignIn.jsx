import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../components/supabaseClient';
import gradientSvg from '../assets/Gradient.svg';
import './SignIn.css';

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      setLoading(false);
      navigate('/auth-success', { state: { type: 'signin' } });
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
        <h2 className="signin-title">Sign in</h2>

        {error && <div style={{ color: '#d32f2f', backgroundColor: '#fdecea', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>{error}</div>}

        <input
          type="email"
          className="signin-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          className="signin-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSignIn();
          }}
        />

        <div className="signin-links">
          <p>No account? <Link to="/signup">Create one!</Link></p>
          <p><Link to="/forgot-password">Forgot password? Reset it here</Link></p>
        </div>

        <div className="signin-actions">
          <button className="next-button" onClick={handleSignIn} disabled={loading}>
            {loading ? 'Signing in...' : 'Next'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default SignIn;
