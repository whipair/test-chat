// Client wrapper for chat
'use client';
import { useState, useEffect } from 'react';
import FloatingChat from './FloatingChat';
import { useUserStore } from '../stores/userStores';
import { supabase } from '../lib/supabase';

export const FloatingChatClientWrapper: React.FC = () => {


    const setCurrentUser = useUserStore((state) => state.setCurrentUser);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUser(user);
        };
        fetchUser();
    }, []);


    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return <FloatingChat />;
}
