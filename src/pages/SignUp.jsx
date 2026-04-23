import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../components/supabaseClient';
import gradientSvg from '../assets/Gradient.svg';
import './SignIn.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EyeIcon = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.73-2.06 1.96-3.84 3.56-5.21" />
        <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
        <path d="M1 1l22 22" />
        <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a10.96 10.96 0 0 1-4.08 5.14" />
      </>
    )}
  </svg>
);

const SignUp = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const passwordChecks = {
    length: form.password.length >= 8,
    lowercase: /[a-z]/.test(form.password),
    uppercase: /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
    symbol: /[!@#$%^&*(),.?":{}|<>+_\-=[\]\\;'/`~]/.test(form.password),
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setSubmitError('');
  };

  const validate = () => {
    const errors = {};

    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (!Object.values(passwordChecks).every(Boolean)) {
      errors.password = 'Please meet all password requirements.';
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    const errors = validate();
    setFieldErrors(errors);
    setSubmitError('');

    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth-success`,
      },
    });

    setLoading(false);

    if (error) {
      setSubmitError(error.message || 'Unable to create account. Please try again.');
      return;
    }

    navigate('/auth-success', { state: { type: 'signup' } });
  };

  return (
    <main className="signin-page">
      <img src={gradientSvg} className="gradient-bg gradient-left" alt="" />
      <img src={gradientSvg} className="gradient-bg gradient-right" alt="" />

      <button className="back-button" onClick={() => navigate(-1)}>
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </button>

      <div className="signin-card">
        <h2 className="signin-title">Create account</h2>
        <p className="signin-subtitle">
          Save searches, shortlist places, and continue your housing search anytime.
        </p>

        {submitError && (
          <div className="form-alert" role="alert">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSignUp} noValidate>
          <div className="form-group">
            <label className="signin-label" htmlFor="signup-email">
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              className={`signin-input ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group">
            <label className="signin-label" htmlFor="signup-password">
              Create password
            </label>
            <div className="password-input-wrap">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className={`signin-input ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {(isPasswordFocused || form.password) && (
              <div className="password-checks">
                <span className={`check-pill ${passwordChecks.length ? 'valid' : ''}`}>8+ chars</span>
                <span className={`check-pill ${passwordChecks.lowercase ? 'valid' : ''}`}>lowercase</span>
                <span className={`check-pill ${passwordChecks.uppercase ? 'valid' : ''}`}>uppercase</span>
                <span className={`check-pill ${passwordChecks.number ? 'valid' : ''}`}>number</span>
                <span className={`check-pill ${passwordChecks.symbol ? 'valid' : ''}`}>symbol</span>
              </div>
            )}

            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>

          <div className="form-group">
            <label className="signin-label" htmlFor="signup-confirm-password">
              Confirm password
            </label>
            <div className="password-input-wrap">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`signin-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="field-error">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="signin-links">
            <p>
              Already have an account? <Link to="/signin">Sign in</Link>
            </p>
          </div>

          <div className="signin-actions">
            <button type="submit" className="next-button" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default SignUp;