import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import "./Favorites.css";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_JAVASCRIPT_MAP_API;

const getStreetViewUrl = (property) => {
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
  if (!lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&fov=80&pitch=0&radius=25&source=outdoor&key=${MAPS_API_KEY}`;
};

const getStaticMapUrl = (property) => {
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
  if (!lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=17&size=600x400&maptype=roadmap&markers=color:0x7D9E4E%7C${lat},${lng}&key=${MAPS_API_KEY}`;
};

const checkStreetViewExists = async (property) => {
  const lat = property.latitude ?? property.lat;
  const lng = property.longitude ?? property.lng;
  if (!lat || !lng) return false;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=25&source=outdoor&key=${MAPS_API_KEY}`
    );
    const data = await res.json();
    return data.status === 'OK';
  } catch {
    return false;
  }
};

const getCompiledPrice = (property) => {
  if (property.price_avg) return `RM ${parseFloat(property.price_avg).toLocaleString()}`;
  if (property.price_min && property.price_max) {
    return `RM ${parseFloat(property.price_min).toLocaleString()} – RM ${parseFloat(property.price_max).toLocaleString()}`;
  }
  if (property.price_min) return `RM ${parseFloat(property.price_min).toLocaleString()}`;
  if (property.price_max) return `RM ${parseFloat(property.price_max).toLocaleString()}`;
  if (property.price) return `RM ${parseFloat(property.price).toLocaleString()}`;
  return 'Price N/A';
};

// Per-card image component with Street View / Static Map fallback
const FavoriteImage = ({ property }) => {
  const hasPhotos = property.photos_urls && property.photos_urls.length > 0;
  const [imgSrc, setImgSrc] = useState(hasPhotos ? property.photos_urls[0] : null);
  const [fallbackChecked, setFallbackChecked] = useState(hasPhotos);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (hasPhotos || fallbackChecked) return;
    // No photos — check Street View then fall back to Static Map
    checkStreetViewExists(property).then(exists => {
      if (exists) {
        setImgSrc(getStreetViewUrl(property));
      } else {
        const smUrl = getStaticMapUrl(property);
        setImgSrc(smUrl); // null if no coords either
      }
      setFallbackChecked(true);
    });
  }, [property.id]);

  const handleError = () => {
    // Photo URL broke — try Street View
    const svUrl = getStreetViewUrl(property);
    if (svUrl && imgSrc !== svUrl) {
      setImgSrc(svUrl);
      return;
    }
    // Street View failed — try Static Map
    const smUrl = getStaticMapUrl(property);
    if (smUrl && imgSrc !== smUrl) {
      setImgSrc(smUrl);
      return;
    }
    setFailed(true);
  };

  if (failed || (!imgSrc && fallbackChecked)) {
    return <div className="favorite-image-placeholder">No Image</div>;
  }

  if (!imgSrc) {
    // Still checking street view
    return <div className="favorite-image-placeholder" style={{ color: '#ccc', fontSize: '12px' }}>Loading…</div>;
  }

  return (
    <img
      src={imgSrc}
      alt={property.name}
      className="favorite-image"
      onError={handleError}
    />
  );
};

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNoteValue, setEditNoteValue] = useState("");

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          navigate("/signin");
          return;
        }

        const { data, error: favError } = await supabase
          .from("favorites")
          .select(`
            id,
            property_id,
            note,
            created_at,
            properties (
              id,
              name,
              price,
              price_avg,
              price_min,
              price_max,
              address,
              neighborhood,
              city,
              latitude,
              longitude,
              photos_urls
            )
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (favError) throw favError;
        setFavorites(data || []);
      } catch (err) {
        console.error("Error fetching favorites:", err.message);
        setError("Failed to load favorites. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [navigate]);

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch (err) {
      console.error("Error removing favorite:", err.message);
      alert("Failed to remove favorite.");
    }
  };

  const handleSaveNote = async (favoriteId) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .update({ note: editNoteValue })
        .eq("id", favoriteId);

      if (error) throw error;

      setFavorites((prev) =>
        prev.map((f) =>
          f.id === favoriteId ? { ...f, note: editNoteValue } : f
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error saving note:", err.message);
      alert("Failed to save note.");
    }
  };

  if (loading) {
    return (
      <main className="favorites-page">
        <div className="loading-spinner">Loading...</div>
      </main>
    );
  }

  return (
    <main className="favorites-page">
      <div className="favorites-container">
        <h1 className="favorites-title">My Favorites</h1>

        {error && <div className="alert-message error-message">{error}</div>}

        {favorites.length === 0 && !error ? (
          <div className="empty-favorites">
            <p>You haven't saved any properties yet.</p>
            <Link to="/housing" className="browse-link">
              Browse Housing
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorites.map((fav) => {
              const property = fav.properties;
              if (!property) return null;

              const location =
                property.address ||
                property.neighborhood ||
                property.city ||
                null;

              return (
                <div key={fav.id} className="favorite-card">
                  <Link
                    to={`/details/${property.id}`}
                    className="favorite-image-container"
                  >
                    <FavoriteImage property={property} />
                  </Link>

                  <div className="favorite-content">
                    <div className="favorite-header">
                      <Link
                        to={`/details/${property.id}`}
                        className="favorite-name"
                      >
                        {property.name}
                      </Link>
                      <button
                        className="remove-fav-btn"
                        onClick={() => handleRemoveFavorite(fav.id)}
                        title="Remove from favorites"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </button>
                    </div>

                    <p className="favorite-price">{getCompiledPrice(property)}</p>
                    {location && <p className="favorite-location">{location}</p>}

                    <div className="favorite-notes-section">
                      {editingId === fav.id ? (
                        <div className="notes-editor">
                          <textarea
                            value={editNoteValue}
                            onChange={(e) => setEditNoteValue(e.target.value)}
                            placeholder="Add a note... (e.g. Too far from campus?)"
                            rows="2"
                          />
                          <div className="notes-actions">
                            <button
                              className="cancel-note"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              className="save-note"
                              onClick={() => handleSaveNote(fav.id)}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="notes-display"
                          onClick={() => {
                            setEditingId(fav.id);
                            setEditNoteValue(fav.note || "");
                          }}
                        >
                          {fav.note ? (
                            <p className="notes-text">{fav.note}</p>
                          ) : (
                            <p className="add-note-prompt">+ Add note</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Favorites;
