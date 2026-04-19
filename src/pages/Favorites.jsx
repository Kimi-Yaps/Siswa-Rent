import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import "./Favorites.css";

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
              price
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

              const coverImage =
                property.image_urls && property.image_urls.length > 0
                  ? property.image_urls[0]
                  : null;

              return (
                <div key={fav.id} className="favorite-card">
                  <Link
                    to={`/details/${property.id}`}
                    className="favorite-image-container"
                  >
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={property.name}
                        className="favorite-image"
                      />
                    ) : (
                      <div className="favorite-image-placeholder">No Image</div>
                    )}
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

                    <p className="favorite-price">RM {property.price}</p>
                    <p className="favorite-location">{property.location}</p>

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
                            setEditNoteValue(fav.notes || "");
                          }}
                        >
                          {fav.notes ? (
                            <p className="notes-text">{fav.notes}</p>
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