// Client wrapper for chat
'use client';
import { useState, useEffect } from 'react';
import FloatingChat from './FloatingChat';
import { useUserStore } from '../stores/userStores';
import { supabase } from '../lib/supabase';

export const FloatingChatClientWrapper = () => {
  const [userLoaded, setUserLoaded] = useState(false);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserLoaded(true);
          return;
        }

        // fetch profile to obtain role and other profile props
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 or similar may indicate profile not found; ignore and set defaults
          console.warn('Profile fetch error', error);
        }

        const enrichedUser = {
          ...user,
          role: profile?.role || null,
          full_name: profile?.full_name || null,
        };

        setCurrentUser(enrichedUser);
      } catch (err) {
        console.error('Error fetching user/profile', err);
      } finally {
        setUserLoaded(true);
      }
    };

    fetchUserAndProfile();
  }, [setCurrentUser]);

  if (!userLoaded) return null;
  return <FloatingChat />;
};

