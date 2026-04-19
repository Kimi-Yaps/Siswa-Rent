import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../components/supabaseClient';

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userName, setUserName] = useState('');

  // Fetch profile once on mount / auth change
  useEffect(() => {
    const fetchProfile = async (userId) => {
      if (!userId) {
        setAvatarUrl(null);
        setUserName('');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setAvatarUrl(data.avatar_url || null);
        setUserName(data.full_name || '');
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      fetchProfile(data?.session?.user?.id ?? null);
    });

    // Keep in sync with auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session?.user?.id ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // Called by Profile page right after a successful upload
  const updateAvatar = (url) => setAvatarUrl(url);
  const updateUserName = (name) => setUserName(name);

  return (
    <ProfileContext.Provider value={{ avatarUrl, userName, updateAvatar, updateUserName }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
