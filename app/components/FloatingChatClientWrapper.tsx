// Client wrapper for chat
'use client';
import { useState, useEffect } from 'react';
import FloatingChat from './FloatingChat';
import { useUserStore } from '../stores/userStores';
import { supabase } from '../lib/supabase';

export const FloatingChatClientWrapper: React.FC = () => {

    const [user, setUser] = useState(null);
    const setCurrentUser = useUserStore((state) => state.setCurrentUser);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setCurrentUser(user);
            }
        };
        fetchUser();
    }, [setCurrentUser]);


    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted || !user) return null;
    return <FloatingChat />;
}
