'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import Chat from './Chat';
import { useUserStore } from '../stores/userStores';
import { chatService } from '../lib/supabase';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [mounted, setMounted] = useState(false);

  const currentUser = useUserStore((state) => state.currentUser);

  useEffect(() => {
    setMounted(true);
  }, [currentUser]);

  const openChat = async () => {
        console.log(currentUser)

    if (!conversationId && currentUser) {
      const conversation = await chatService.getOrCreateConversation(currentUser.id);
      setConversationId(conversation.id);
    }
    setIsOpen(true);
  };

  if (!mounted) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && conversationId && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 border">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <h3 className="font-semibold">Support Chat</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white hover:bg-opacity-20 p-1 rounded">
              <X size={18} />
            </button>
          </div>
          <div className="h-[calc(500px-64px)]">
            <Chat conversationId={conversationId} currentUser={currentUser} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
