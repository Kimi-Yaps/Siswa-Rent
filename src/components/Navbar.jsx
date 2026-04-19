import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useProfile } from '../context/ProfileContext';
import './Navbar.css';

const Navbar = () => {
  const [session, setSession] = useState(null);
  const { avatarUrl, userName, updateAvatar } = useProfile();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
      } catch (err) {
        console.error('Error restoring session:', err.message);
        setSession(null);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="navbar-container">
      <div className="top-banner">
        <div className="scrolling-text">
          {Array.from({ length: 15 }).map((_, index) => (
            <span key={index}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="circle-icon">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              Find Your Home Now
            </span>
          ))}
        </div>
      </div>
      <nav className="nav-main">
        <div className="nav-links">
          <Link to="/housing">Housing</Link>
          <Link to="/map">Map</Link>
        </div>
        <div className="nav-logo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>QuerySaja</Link>
        </div>
        <div className="nav-actions">
          {session ? (
            <div className="auth-links">
              <Link to="/favorites" className="nav-icon" title="Favorites">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </Link>
              <Link to="/profile" className="nav-icon" title="Profile" style={{ padding: avatarUrl ? '2px' : '8px' }}>
                {avatarUrl ? (
                  <img 
                    key={avatarUrl}
                    src={avatarUrl} 
                    alt="Profile" 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                    onError={() => updateAvatar(null)}
                  />
                ) : userName ? (
                  <div 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: '#2C3E50',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </Link>
            </div>
          ) : (
            <Link to="/signin" className="sign-in">Sign In</Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
