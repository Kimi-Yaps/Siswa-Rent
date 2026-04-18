import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../components/supabaseClient';
import gradientSvg from '../assets/Gradient.svg';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    email: '',
    avatar_url: '',
    university: '',
    phone: '',
    preferred_lang: 'ms-MY'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setAvatarLoaded(false); // Reset avatar loaded state
        // Robust session check
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          navigate('/signin');
          return;
        }

        const user = session.user;
        setProfile(prev => ({ ...prev, id: user.id, email: user.email }));

        // Fetch existing profile from public.profiles
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, university, phone, preferred_lang')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError; // Ignore row not found, it means it's a new user without a profile setup yet
        }

        if (data) {
          setProfile(prev => ({
            ...prev,
            full_name: data.full_name || '',
            avatar_url: data.avatar_url ? `${data.avatar_url}?t=${Date.now()}` : '',
            university: data.university || '',
            phone: data.phone || '',
            preferred_lang: data.preferred_lang || 'ms-MY'
          }));
          // If avatar URL exists in database, mark as loaded immediately
          if (data.avatar_url) {
            setAvatarLoaded(true);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err.message);
        setError('Failed to load profile. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Update avatarLoaded when avatar_url changes
  useEffect(() => {
    if (profile.avatar_url) {
      setAvatarLoaded(true);
    } else {
      setAvatarLoaded(false);
    }
  }, [profile.avatar_url]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Strip cache-buster before saving to database
      const cleanAvatarUrl = profile.avatar_url?.split('?')[0] || '';

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id, // mapped to auth.users id
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: cleanAvatarUrl,
          university: profile.university,
          phone: profile.phone,
          preferred_lang: profile.preferred_lang,
          updated_at: new Date()
        });

      if (saveError) throw saveError;
      
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err.message);
      setError('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploadingAvatar(true);
      setError('');
      setSuccess('');
      
      const file = event.target.files[0];
      if (!file) return;

      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        throw new Error('Only JPG and PNG images are allowed.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB.');
      }

      // Use consistent filename so it overwrites instead of creating new versions
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `Avatar/${profile.id}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('rebtal-siswa_bucket')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError; // ← stop here if failed, don't proceed

      // 2. Only get URL if upload succeeded
      const { data: publicUrlData } = supabase.storage
        .from('rebtal-siswa_bucket')
        .getPublicUrl(filePath);

      // 3. Only set state if URL exists
      if (!publicUrlData?.publicUrl) throw new Error('Failed to retrieve public URL');

      // Add cache-buster to force Supabase to serve the latest file
      const cachebustedUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      console.log('New avatar URL:', cachebustedUrl);
      setProfile(prev => ({ ...prev, avatar_url: cachebustedUrl }));
      setSuccess('Avatar updated! Click Save Changes to update your profile.');

    } catch (err) {
      console.error('Upload Error:', err.message);
      setError(err.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = ''; // Reset input to allow selecting same file again
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <main className="profile-page"><div className="loading-spinner">Loading...</div></main>;
  }

  return (
    <main className="profile-page">
      <img src={gradientSvg} className="gradient-bg gradient-left" alt="" />
      <img src={gradientSvg} className="gradient-bg gradient-right" alt="" />

      <div className="profile-card">
        <div className="profile-header">
          <h2 className="profile-title">Your Profile</h2>
        </div>

        {error && <div className="alert-message error-message">{error}</div>}
        {success && <div className="alert-message success-message">{success}</div>}

        <div className="profile-form">
          <div className="form-group">
            <label>Email <span className="read-only-badge">Read Only</span></label>
            <input
              type="text"
              name="email"
              className="profile-input"
              value={profile.email}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              className="profile-input"
              placeholder="e.g. Ali Bin Abu"
              value={profile.full_name}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group avatar-form-group">
            <label>Avatar / Profile Picture</label>
            <div className="avatar-upload-container">
              <div className="avatar-preview" style={{ position: 'relative' }}>
                {profile.avatar_url && avatarLoaded ? (
                  <img 
                    key={profile.avatar_url}
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      console.error('Avatar image failed to load. URL:', profile.avatar_url, 'Error:', e);
                      setAvatarLoaded(false);
                    }}
                  />
                ) : (
                  <div 
                    className="avatar-placeholder" 
                    style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', display: 'flex' }}
                  >
                    <span>{profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}</span>
                  </div>
                )}
              </div>
              <div className="avatar-upload-actions">
                <label className={`upload-button ${(uploadingAvatar || saving) ? 'disabled' : ''}`}>
                  {uploadingAvatar ? 'Uploading...' : 'Choose Image'}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar || saving}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className="upload-hint">PNG or JPG, max 5MB</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>University</label>
            <input
              type="text"
              name="university"
              className="profile-input"
              placeholder="e.g. Universiti Malaya"
              value={profile.university}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="profile-input"
              placeholder="+60 12-345 6789"
              value={profile.phone}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Preferred Language</label>
            <select
              name="preferred_lang"
              className="profile-input select-input"
              value={profile.preferred_lang}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="ms-MY">Bahasa Melayu (ms-MY)</option>
              <option value="en-US">English (en-US)</option>
              <option value="zh-CN">Mandarin (zh-CN)</option>
              <option value="ta-IN">Tamil (ta-IN)</option>
            </select>
          </div>
        </div>

        <div className="profile-actions">
          <button className="signout-button" onClick={handleSignOut} disabled={saving}>
            Sign Out
          </button>
          <button className="save-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default Profile;
