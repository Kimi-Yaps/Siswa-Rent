import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../components/supabaseClient';
import gradientSvg from '../assets/Gradient.svg';
import './SignIn.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate the password based on Supabase strict requirements
  const validatePassword = (pw) => {
    if (pw.length < 6) return 'Password must be at least 6 characters.';
    if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter.';
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
    if (!/\d/.test(pw)) return 'Password must contain at least one digit.';
    if (!/[!@#$%^&*(),.?":{}|<>+_\-\=\[\]\\;'/`~]/.test(pw)) return 'Password must contain at least one special character.';
    return null;
  };

  const handleUpdatePassword = async () => {
    if (!password) {
      setError('Please provide a new password.');
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setLoading(false);
      navigate('/auth-success', { state: { type: 'signin' } }); // Route back home or to success
    }
  };

  useEffect(() => {
    // Optionally check if user session exists (the link contains recovery token which Supabase uses to open a session)
  }, []);

  return (
    <main className="signin-page">
      <img src={gradientSvg} className="gradient-bg gradient-left" alt="" />
      <img src={gradientSvg} className="gradient-bg gradient-right" alt="" />

      <button className="back-button" onClick={() => navigate('/signin')}>
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Sign In
      </button>

      <div className="signin-card">
        <h2 className="signin-title">Change Password</h2>

        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
          Please enter your new password below. It must be at least 6 characters, contain lowercase, uppercase, digits, and special characters.
        </p>

        {error && <div style={{ color: '#d32f2f', backgroundColor: '#fdecea', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>{error}</div>}

        <input
          type="password"
          className="signin-input"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdatePassword();
          }}
        />

        <div className="signin-actions" style={{ marginTop: '20px' }}>
          <button className="next-button" onClick={handleUpdatePassword} disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
