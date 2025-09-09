// pages/chat.js
'use client';
import { useState, useEffect } from 'react';
import { supabase, chatService } from '../lib/supabase';
import Chat from '../components/Chat';
import AuthComponent from '../components/AuthComponent';
import { MessageCircle, Headphones } from 'lucide-react';

export default function UserChatPage() {
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatStarted, setChatStarted] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          // Check if user already has a conversation
          await checkExistingConversation(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const checkExistingConversation = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setConversation(data);
        setChatStarted(true);
      }
    } catch (error) {
      console.error('Error checking conversation:', error);
    }
  };

  const startChat = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const newConversation = await chatService.getOrCreateConversation(
        user.id
      );
      setConversation(newConversation);
      setChatStarted(true);
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setConversation(null);
    setChatStarted(false);
  };


  const loadConversations = async () => {
    try {
      const data = await chatService.getCompanyConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
      const subscribeToConversations = () => {
        const conversationChannel = supabase
          .channel('conversations')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'conversations' },
            loadConversations
          )
          .subscribe();

        const messageChannel = supabase
          .channel('messages')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            loadConversations
          )
          .subscribe();

        return () => {
          conversationChannel.unsubscribe();
          messageChannel.unsubscribe();
        };
      };

      subscribeToConversations();
    }
  }, [user]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthComponent />;
  }

  if (!chatStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Headphones className="text-white" size={40} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h1>

          <p className="text-gray-600 mb-8">
            Start a conversation with our support team. We are here to help you
            with any questions or issues.
          </p>

          <button
            onClick={startChat}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all font-semibold disabled:opacity-50"
          >
            {loading ? 'Starting Chat...' : 'Start Chat'}
          </button>

          <button
            onClick={signOut}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Support Chat</h1>
        <button
          onClick={signOut}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-gray-100">
        <div className="h-full max-w-4xl mx-auto bg-white shadow-lg">
          <Chat conversationId={conversation.id} currentUser={user} />
        </div>
      </div>
    </div>
  );
}
