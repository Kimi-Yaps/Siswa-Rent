import React, { useState, useEffect } from 'react';
import { supabase } from '../components/supabaseClient';
import './SearchBar.css';

const SearchBar = ({ onSearch, onSubmit, isSearching, lastResultCount, lastQueryLabel }) => {
  const [minBudget, setMinBudget] = useState(() => sessionStorage.getItem('search_minBudget') || '');
  const [maxBudget, setMaxBudget] = useState(() => sessionStorage.getItem('search_maxBudget') || '');
  const [destination, setDestination] = useState(() => sessionStorage.getItem('search_destination') || '');

  useEffect(() => {
    sessionStorage.setItem('search_minBudget', minBudget);
    sessionStorage.setItem('search_maxBudget', maxBudget);
    sessionStorage.setItem('search_destination', destination);
  }, [minBudget, maxBudget, destination]);

  console.log('[SearchBar] render', { hasOnSubmit: !!onSubmit, hasOnSearch: !!onSearch });

  const [recommendations, setRecommendations] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  // Call onSearch whenever relevant inputs change
  useEffect(() => {
    if (onSearch) {
      onSearch({ minBudget, maxBudget, destination });
    }
  }, [minBudget, maxBudget, destination, onSearch]);

  // Debounced Supabase search for recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (destination.trim() === '') {
        setRecommendations([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('name, neighborhood, city')
          .or(`name.ilike.%${destination}%,neighborhood.ilike.%${destination}%,city.ilike.%${destination}%`)
          .limit(4);

        if (!error && data) {
          // Format recommendations based on matched fields to provide up to 4 rich hints
          const recs = data.map(item => item.name || item.neighborhood || item.city);
          setRecommendations([...new Set(recs)]); // deduplicate identical texts
        }
      } catch (err) {
        console.error('Failed fetching recommendations:', err);
      }
    };

    // 300ms typical debounce
    const timerId = setTimeout(() => {
      fetchRecommendations();
    }, 300);

    return () => clearTimeout(timerId);
  }, [destination]);

  const handleMinChange = (e) => {
    setMinBudget(e.target.value.replace(/\D/g, ''));
  };

  const handleMaxChange = (e) => {
    setMaxBudget(e.target.value.replace(/\D/g, ''));
  };

  const handleBlur = () => {
    // Timeout hides the autocomplete after a short delay so clicks can register first
    setTimeout(() => setIsFocused(false), 200);

    if (minBudget !== '' && maxBudget !== '') {
      if (parseInt(minBudget) > parseInt(maxBudget)) {
        // Swap values if Min is accidentally higher than Max
        const temp = minBudget;
        setMinBudget(maxBudget);
        setMaxBudget(temp);
      }
    }
  };

  return (
    <section className="search-header">
      <div className="search-banner">

        <div className="search-bar-container" style={{ position: 'relative', width: '100%' }}>
          <div className={`search-bar${isSearching ? ' search-bar--loading' : ''}`}>
            <input
              type="text"
              placeholder="Where do you want to stay?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              disabled={isSearching}
              style={{ opacity: isSearching ? 0.6 : 1, transition: 'opacity 0.2s' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (onSubmit) onSubmit({ minBudget, maxBudget, destination });
                  setIsFocused(false);
                }
              }}
            />
            {isSearching ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="search-icon-l" style={{ cursor: 'not-allowed', animation: 'sb-spin 0.9s linear infinite', flexShrink: 0, color: '#7D9E4E' }}>
                <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
                <path d="M12 3 a9 9 0 0 1 9 9" />
              </svg>
            ) : (
              <button className="search-btn" onClick={() => { if (onSubmit) onSubmit({ minBudget, maxBudget, destination }); setIsFocused(false); }} aria-label="Search" tabIndex={0}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon-l" style={{ margin: 0, pointerEvents: 'none', color: '#fff' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Status line — shown near the search bar */}
          {isSearching && (
            <div className="search-status search-status--searching">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ width: '13px', height: '13px', animation: 'sb-spin 0.9s linear infinite', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
                <path d="M12 3 a9 9 0 0 1 9 9" />
              </svg>
              Searching…
            </div>
          )}
          {!isSearching && lastQueryLabel && (
            <div className="search-status search-status--done">
              ✓ {lastResultCount} result{lastResultCount !== 1 ? 's' : ''} found
              <span className="search-status__query">
                &nbsp;· Searching for: &ldquo;{lastQueryLabel}&rdquo;
              </span>
            </div>
          )}

          {/* Recommendations Dropdown */}
          {isFocused && recommendations.length > 0 && (
            <div className="search-recommendations">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="rec-item"
                  onMouseDown={() => {
                    setDestination(rec);
                    setIsFocused(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', marginRight: '10px' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {rec}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget fields with clear labels */}
        <div className="budget-section">
          <div className="budget-labels-row">
            <span className="budget-label">Min budget</span>
            <span className="budget-label">Max budget</span>
          </div>
          <div className="filters-row">
            <div className="filter-item" style={{ padding: 0 }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 300"
                className="filter-input"
                value={minBudget}
                onChange={handleMinChange}
                onBlur={handleBlur}
                disabled={isSearching}
                style={{ opacity: isSearching ? 0.6 : 1 }}
              />
            </div>
            <div className="filter-item" style={{ padding: 0 }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 700"
                className="filter-input"
                value={maxBudget}
                onChange={handleMaxChange}
                onBlur={handleBlur}
                disabled={isSearching}
                style={{ opacity: isSearching ? 0.6 : 1 }}
              />
            </div>
          </div>
          <p className="search-hint budget-hint">Leave blank if not needed.</p>
          <p className="search-hint scope-hint">📍 Currently showing rentals near UTM Johor / Skudai.</p>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
